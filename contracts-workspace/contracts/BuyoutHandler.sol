// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BuyoutHandler
 * @notice Manages buyout offers and claim/refund flows for fractionalized domains
 */
contract BuyoutHandler is Ownable, ReentrancyGuard {
    struct BuyoutOffer {
        uint256 offerId;
        address buyer;
        address poolAddress;
        uint256 offerAmount;
        uint256 timestamp;
        uint256 expirationTime;
        BuyoutStatus status;
        uint256 acceptanceVotes;
        uint256 rejectionVotes;
        uint256 votingDeadline;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteChoice; // true = accept, false = reject
    }

    enum BuyoutStatus {
        Pending,
        Accepted,
        Rejected,
        Executed,
        Expired,
        Cancelled
    }

    // State variables
    uint256 public offerCount;
    mapping(uint256 => BuyoutOffer) public buyoutOffers;
    mapping(address => uint256[]) public poolOffers;
    address public usdcAddress;
    uint256 public votingPeriod = 7 days;
    uint256 public acceptanceThreshold = 6000; // 60% in basis points

    // Events
    event BuyoutProposed(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed poolAddress,
        uint256 offerAmount,
        uint256 votingDeadline
    );
    event BuyoutVoteCast(
        uint256 indexed offerId,
        address indexed voter,
        bool accept,
        uint256 weight
    );
    event BuyoutAccepted(uint256 indexed offerId, uint256 totalVotes);
    event BuyoutRejected(uint256 indexed offerId, uint256 totalVotes);
    event BuyoutExecuted(
        uint256 indexed offerId,
        address indexed buyer,
        address poolAddress
    );
    event BuyoutCancelled(uint256 indexed offerId);
    event FundsWithdrawn(
        uint256 indexed offerId,
        address indexed buyer,
        uint256 amount
    );

    constructor(address _usdcAddress, address _owner) Ownable(_owner) {
        require(
            _usdcAddress != address(0),
            "BuyoutHandler: Invalid USDC address"
        );
        usdcAddress = _usdcAddress;
    }

    /**
     * @notice Propose a buyout for a fractionalized domain
     * @param poolAddress Address of the FractionPool
     * @param offerAmount Amount offered in USDC
     * @param expirationTime Expiration timestamp for the offer
     */
    function proposeBuyout(
        address poolAddress,
        uint256 offerAmount,
        uint256 expirationTime
    ) external nonReentrant returns (uint256 offerId) {
        require(
            poolAddress != address(0),
            "BuyoutHandler: Invalid pool address"
        );
        require(offerAmount > 0, "BuyoutHandler: Offer must be greater than 0");
        require(
            expirationTime > block.timestamp,
            "BuyoutHandler: Invalid expiration time"
        );

        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transferFrom(msg.sender, address(this), offerAmount),
            "BuyoutHandler: USDC transfer failed"
        );

        offerId = offerCount;
        BuyoutOffer storage offer = buyoutOffers[offerId];

        offer.offerId = offerId;
        offer.buyer = msg.sender;
        offer.poolAddress = poolAddress;
        offer.offerAmount = offerAmount;
        offer.timestamp = block.timestamp;
        offer.expirationTime = expirationTime;
        offer.status = BuyoutStatus.Pending;
        offer.votingDeadline = block.timestamp + votingPeriod;
        offer.acceptanceVotes = 0;
        offer.rejectionVotes = 0;

        poolOffers[poolAddress].push(offerId);
        offerCount++;

        emit BuyoutProposed(
            offerId,
            msg.sender,
            poolAddress,
            offerAmount,
            offer.votingDeadline
        );

        return offerId;
    }

    /**
     * @notice Vote on a buyout offer
     * @param offerId ID of the buyout offer
     * @param accept True to accept, false to reject
     * @param voteWeight Weight of the vote (based on fraction token holdings)
     */
    function voteOnBuyout(
        uint256 offerId,
        bool accept,
        uint256 voteWeight
    ) external nonReentrant {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        BuyoutOffer storage offer = buyoutOffers[offerId];

        require(
            offer.status == BuyoutStatus.Pending,
            "BuyoutHandler: Offer not pending"
        );
        require(
            block.timestamp <= offer.votingDeadline,
            "BuyoutHandler: Voting period ended"
        );
        require(!offer.hasVoted[msg.sender], "BuyoutHandler: Already voted");
        require(voteWeight > 0, "BuyoutHandler: Invalid vote weight");

        offer.hasVoted[msg.sender] = true;
        offer.voteChoice[msg.sender] = accept;

        if (accept) {
            offer.acceptanceVotes += voteWeight;
        } else {
            offer.rejectionVotes += voteWeight;
        }

        emit BuyoutVoteCast(offerId, msg.sender, accept, voteWeight);
    }

    /**
     * @notice Finalize voting on a buyout offer
     * @param offerId ID of the buyout offer
     */
    function finalizeVoting(uint256 offerId) external nonReentrant {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        BuyoutOffer storage offer = buyoutOffers[offerId];

        require(
            offer.status == BuyoutStatus.Pending,
            "BuyoutHandler: Offer not pending"
        );
        require(
            block.timestamp > offer.votingDeadline,
            "BuyoutHandler: Voting period not ended"
        );

        uint256 totalVotes = offer.acceptanceVotes + offer.rejectionVotes;
        require(totalVotes > 0, "BuyoutHandler: No votes cast");

        uint256 acceptancePercentage = (offer.acceptanceVotes * 10000) /
            totalVotes;

        if (acceptancePercentage >= acceptanceThreshold) {
            offer.status = BuyoutStatus.Accepted;
            emit BuyoutAccepted(offerId, totalVotes);
        } else {
            offer.status = BuyoutStatus.Rejected;
            emit BuyoutRejected(offerId, totalVotes);
        }
    }

    /**
     * @notice Execute an accepted buyout
     * @param offerId ID of the buyout offer
     * @param domainNFTAddress Address of the domain NFT
     * @param tokenId Token ID of the domain
     */
    function executeBuyout(
        uint256 offerId,
        address domainNFTAddress,
        uint256 tokenId
    ) external onlyOwner nonReentrant {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        BuyoutOffer storage offer = buyoutOffers[offerId];

        require(
            offer.status == BuyoutStatus.Accepted,
            "BuyoutHandler: Offer not accepted"
        );
        require(
            block.timestamp <= offer.expirationTime,
            "BuyoutHandler: Offer expired"
        );

        // Transfer NFT to buyer
        IERC721 nft = IERC721(domainNFTAddress);
        nft.transferFrom(offer.poolAddress, offer.buyer, tokenId);

        // Transfer USDC to pool
        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transfer(offer.poolAddress, offer.offerAmount),
            "BuyoutHandler: USDC transfer failed"
        );

        offer.status = BuyoutStatus.Executed;

        emit BuyoutExecuted(offerId, offer.buyer, offer.poolAddress);
    }

    /**
     * @notice Cancel a buyout offer (only buyer can cancel pending offers)
     * @param offerId ID of the buyout offer
     */
    function cancelBuyout(uint256 offerId) external nonReentrant {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        BuyoutOffer storage offer = buyoutOffers[offerId];

        require(msg.sender == offer.buyer, "BuyoutHandler: Not the buyer");
        require(
            offer.status == BuyoutStatus.Pending,
            "BuyoutHandler: Cannot cancel"
        );

        offer.status = BuyoutStatus.Cancelled;

        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transfer(offer.buyer, offer.offerAmount),
            "BuyoutHandler: Refund failed"
        );

        emit BuyoutCancelled(offerId);
    }

    /**
     * @notice Withdraw funds from rejected or expired offers
     * @param offerId ID of the buyout offer
     */
    function withdrawRejectedOffer(uint256 offerId) external nonReentrant {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        BuyoutOffer storage offer = buyoutOffers[offerId];

        require(msg.sender == offer.buyer, "BuyoutHandler: Not the buyer");
        require(
            offer.status == BuyoutStatus.Rejected ||
                (offer.status == BuyoutStatus.Pending &&
                    block.timestamp > offer.expirationTime),
            "BuyoutHandler: Cannot withdraw"
        );

        if (offer.status == BuyoutStatus.Pending) {
            offer.status = BuyoutStatus.Expired;
        }

        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transfer(offer.buyer, offer.offerAmount),
            "BuyoutHandler: Withdrawal failed"
        );

        emit FundsWithdrawn(offerId, offer.buyer, offer.offerAmount);
    }

    /**
     * @notice Update voting period
     * @param newPeriod New voting period in seconds
     */
    function updateVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(
            newPeriod >= 1 days && newPeriod <= 30 days,
            "BuyoutHandler: Invalid period"
        );
        votingPeriod = newPeriod;
    }

    /**
     * @notice Update acceptance threshold
     * @param newThreshold New threshold in basis points (e.g., 6000 = 60%)
     */
    function updateAcceptanceThreshold(
        uint256 newThreshold
    ) external onlyOwner {
        require(
            newThreshold > 5000 && newThreshold <= 10000,
            "BuyoutHandler: Invalid threshold"
        );
        acceptanceThreshold = newThreshold;
    }

    /**
     * @notice Get all offer IDs for a pool
     * @param poolAddress Address of the pool
     */
    function getPoolOffers(
        address poolAddress
    ) external view returns (uint256[] memory) {
        return poolOffers[poolAddress];
    }

    /**
     * @notice Get offer details (excluding mappings)
     * @param offerId ID of the offer
     */
    function getOfferDetails(
        uint256 offerId
    )
        external
        view
        returns (
            address buyer,
            address poolAddress,
            uint256 offerAmount,
            uint256 timestamp,
            uint256 expirationTime,
            BuyoutStatus status,
            uint256 acceptanceVotes,
            uint256 rejectionVotes,
            uint256 votingDeadline
        )
    {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        BuyoutOffer storage offer = buyoutOffers[offerId];

        return (
            offer.buyer,
            offer.poolAddress,
            offer.offerAmount,
            offer.timestamp,
            offer.expirationTime,
            offer.status,
            offer.acceptanceVotes,
            offer.rejectionVotes,
            offer.votingDeadline
        );
    }

    /**
     * @notice Check if an address has voted on an offer
     * @param offerId ID of the offer
     * @param voter Address to check
     */
    function hasVotedOnOffer(
        uint256 offerId,
        address voter
    ) external view returns (bool) {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        return buyoutOffers[offerId].hasVoted[voter];
    }

    /**
     * @notice Get vote choice for an address
     * @param offerId ID of the offer
     * @param voter Address to check
     */
    function getVoteChoice(
        uint256 offerId,
        address voter
    ) external view returns (bool) {
        require(offerId < offerCount, "BuyoutHandler: Invalid offer ID");
        require(
            buyoutOffers[offerId].hasVoted[voter],
            "BuyoutHandler: Has not voted"
        );
        return buyoutOffers[offerId].voteChoice[voter];
    }
}
