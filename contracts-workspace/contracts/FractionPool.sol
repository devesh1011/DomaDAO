// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFractionPool.sol";

/**
 * @title FractionPool
 * @notice Main pool contract for fractional domain investment
 * @dev Handles contributions, voting, domain purchase, and fractionalization
 */
contract FractionPool is
    IFractionPool,
    IERC721Receiver,
    ReentrancyGuard,
    Ownable
{
    // Pool metadata
    PoolMetadata public metadata;

    // Financial tracking
    mapping(address => uint256) public contributions;
    address[] public contributors;
    mapping(address => bool) private isContributor;
    uint256 public totalRaised;

    // Voting tracking
    mapping(string => uint256) public votesPerCandidate;
    mapping(address => string) public voterChoice;
    mapping(address => bool) public hasVoted;
    string[] public domainCandidates;
    string public winningDomain;

    // Domain and fractionalization
    address public domainNFTAddress;
    uint256 public domainTokenId;
    address public fractionTokenAddress;

    // Distribution tracking
    mapping(address => uint256) public shareEntitlements;
    mapping(address => bool) public hasClaimed;

    // Signature verification for off-chain voting
    address public verificationKey;
    mapping(bytes32 => bool) public usedNonces;

    modifier onlyDuringContribution() {
        require(
            block.timestamp >= metadata.startTimestamp &&
                block.timestamp <= metadata.endTimestamp,
            "FractionPool: Not in contribution window"
        );
        require(
            metadata.status == PoolStatus.Fundraising,
            "FractionPool: Not in fundraising status"
        );
        _;
    }

    modifier onlyDuringVoting() {
        require(
            block.timestamp >= metadata.votingStart &&
                block.timestamp <= metadata.votingEnd,
            "FractionPool: Not in voting window"
        );
        require(
            metadata.status == PoolStatus.Voting,
            "FractionPool: Not in voting status"
        );
        _;
    }

    modifier onlyDuringPurchase() {
        require(
            block.timestamp >= metadata.purchaseWindowStart &&
                block.timestamp <= metadata.purchaseWindowEnd,
            "FractionPool: Not in purchase window"
        );
        _;
    }

    constructor(
        address _creator,
        string memory _poolName,
        uint256 _targetRaise,
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        uint256 _votingStart,
        uint256 _votingEnd,
        uint256 _purchaseWindowStart,
        uint256 _purchaseWindowEnd,
        uint256 _fractionalSharesTotal,
        uint256 _minimumContribution,
        address _usdcAddress
    ) Ownable(_creator) {
        metadata = PoolMetadata({
            creator: _creator,
            poolName: _poolName,
            targetRaise: _targetRaise,
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp,
            votingStart: _votingStart,
            votingEnd: _votingEnd,
            purchaseWindowStart: _purchaseWindowStart,
            purchaseWindowEnd: _purchaseWindowEnd,
            minimumContribution: _minimumContribution,
            usdcAddress: _usdcAddress,
            fractionalSharesTotal: _fractionalSharesTotal,
            status: PoolStatus.Fundraising
        });

        verificationKey = _creator;
    }

    /**
     * @notice Contribute USDC to the pool
     * @param amount Amount of USDC to contribute
     */
    function contribute(
        uint256 amount
    ) external onlyDuringContribution nonReentrant {
        require(
            amount >= metadata.minimumContribution,
            "FractionPool: Below minimum contribution"
        );
        require(
            totalRaised + amount <= metadata.targetRaise,
            "FractionPool: Exceeds target raise"
        );

        IERC20 usdc = IERC20(metadata.usdcAddress);
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "FractionPool: USDC transfer failed"
        );

        if (!isContributor[msg.sender]) {
            contributors.push(msg.sender);
            isContributor[msg.sender] = true;
        }

        contributions[msg.sender] += amount;
        totalRaised += amount;

        emit ContributionMade(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Start voting phase (can only be called after contribution window ends)
     */
    function startVoting() external onlyOwner {
        require(
            block.timestamp >= metadata.endTimestamp,
            "FractionPool: Contribution window not ended"
        );
        require(
            metadata.status == PoolStatus.Fundraising,
            "FractionPool: Invalid status"
        );

        PoolStatus oldStatus = metadata.status;
        metadata.status = PoolStatus.Voting;
        emit PoolStatusChanged(oldStatus, PoolStatus.Voting);
    }

    /**
     * @notice Add a domain candidate for voting
     * @param domainName Name of the domain candidate
     */
    function addDomainCandidate(string memory domainName) external onlyOwner {
        require(
            metadata.status == PoolStatus.Fundraising ||
                metadata.status == PoolStatus.Voting,
            "FractionPool: Invalid status for adding candidates"
        );
        domainCandidates.push(domainName);
    }

    /**
     * @notice Cast vote for a domain (on-chain voting)
     * @param domainName Name of the domain to vote for
     */
    function castVote(
        string memory domainName
    ) external onlyDuringVoting nonReentrant {
        require(
            contributions[msg.sender] > 0,
            "FractionPool: Must be a contributor"
        );
        require(!hasVoted[msg.sender], "FractionPool: Already voted");
        require(
            _isDomainCandidate(domainName),
            "FractionPool: Invalid domain candidate"
        );

        uint256 voteWeight = contributions[msg.sender];
        votesPerCandidate[domainName] += voteWeight;
        voterChoice[msg.sender] = domainName;
        hasVoted[msg.sender] = true;

        emit VoteCast(msg.sender, domainName, voteWeight);
    }

    /**
     * @notice Finalize voting and determine winning domain
     */
    function finalizeVoting() external onlyOwner {
        require(
            block.timestamp >= metadata.votingEnd,
            "FractionPool: Voting not ended"
        );
        require(
            metadata.status == PoolStatus.Voting,
            "FractionPool: Invalid status"
        );

        string memory winner;
        uint256 maxVotes = 0;

        for (uint256 i = 0; i < domainCandidates.length; i++) {
            string memory candidate = domainCandidates[i];
            uint256 votes = votesPerCandidate[candidate];
            if (votes > maxVotes) {
                maxVotes = votes;
                winner = candidate;
            }
        }

        require(bytes(winner).length > 0, "FractionPool: No votes cast");
        winningDomain = winner;

        // Keep in Voting state until purchase is recorded
        // The status will transition to Purchased when recordDomainPurchase is called
    }

    /**
     * @notice Record domain purchase (called after off-chain purchase via Doma Orderbook)
     * @param _domainNFTAddress Address of the domain NFT contract
     * @param _domainTokenId Token ID of the purchased domain
     * @param txHash Transaction hash of the purchase
     */
    function recordDomainPurchase(
        address _domainNFTAddress,
        uint256 _domainTokenId,
        bytes32 txHash
    ) external onlyOwner nonReentrant {
        require(
            metadata.status == PoolStatus.Voting,
            "FractionPool: Invalid status - must finalize voting first"
        );
        require(
            _domainNFTAddress != address(0),
            "FractionPool: Invalid NFT address"
        );
        require(
            bytes(winningDomain).length > 0,
            "FractionPool: No winning domain - finalize voting first"
        );

        // Verify the pool holds the NFT
        IERC721 nft = IERC721(_domainNFTAddress);
        require(
            nft.ownerOf(_domainTokenId) == address(this),
            "FractionPool: Pool doesn't own NFT"
        );

        domainNFTAddress = _domainNFTAddress;
        domainTokenId = _domainTokenId;

        PoolStatus oldStatus = metadata.status;
        metadata.status = PoolStatus.Purchased;

        emit PurchaseExecuted(txHash, _domainNFTAddress, _domainTokenId);
        emit PoolStatusChanged(oldStatus, PoolStatus.Purchased);
    }

    /**
     * @notice Record fractionalization (called after interacting with Doma Fractionalization)
     * @param _fractionTokenAddress Address of the ERC20 fraction token
     */
    function recordFractionalization(
        address _fractionTokenAddress
    ) external onlyOwner nonReentrant {
        require(
            metadata.status == PoolStatus.Purchased,
            "FractionPool: Invalid status"
        );
        require(
            _fractionTokenAddress != address(0),
            "FractionPool: Invalid token address"
        );

        IERC20 fractionToken = IERC20(_fractionTokenAddress);
        uint256 balance = fractionToken.balanceOf(address(this));
        require(balance > 0, "FractionPool: No fraction tokens received");

        fractionTokenAddress = _fractionTokenAddress;

        PoolStatus oldStatus = metadata.status;
        metadata.status = PoolStatus.Fractionalized;

        emit Fractionalized(_fractionTokenAddress, balance);
        emit PoolStatusChanged(oldStatus, PoolStatus.Fractionalized);

        // Calculate entitlements
        _calculateEntitlements(balance);
    }

    /**
     * @notice Claim fractional share tokens
     */
    function claimShares() external nonReentrant {
        require(
            metadata.status == PoolStatus.Fractionalized,
            "FractionPool: Not fractionalized yet"
        );
        require(contributions[msg.sender] > 0, "FractionPool: No contribution");
        require(!hasClaimed[msg.sender], "FractionPool: Already claimed");

        uint256 entitlement = shareEntitlements[msg.sender];
        require(entitlement > 0, "FractionPool: No shares to claim");

        hasClaimed[msg.sender] = true;

        IERC20 fractionToken = IERC20(fractionTokenAddress);
        require(
            fractionToken.transfer(msg.sender, entitlement),
            "FractionPool: Transfer failed"
        );

        emit SharesDistributed(msg.sender, entitlement);
    }

    /**
     * @notice Request refund if purchase fails or pool is disputed
     */
    function refund() external nonReentrant {
        require(
            metadata.status == PoolStatus.Disputed ||
                (block.timestamp > metadata.purchaseWindowEnd &&
                    metadata.status != PoolStatus.Purchased),
            "FractionPool: Refund not available"
        );
        require(contributions[msg.sender] > 0, "FractionPool: No contribution");
        require(
            !hasClaimed[msg.sender],
            "FractionPool: Already claimed/refunded"
        );

        uint256 amount = contributions[msg.sender];
        hasClaimed[msg.sender] = true;
        contributions[msg.sender] = 0;

        IERC20 usdc = IERC20(metadata.usdcAddress);
        require(
            usdc.transfer(msg.sender, amount),
            "FractionPool: Refund failed"
        );

        emit RefundIssued(msg.sender, amount);
    }

    /**
     * @notice Mark pool as disputed (only owner)
     */
    function markDisputed() external onlyOwner {
        PoolStatus oldStatus = metadata.status;
        metadata.status = PoolStatus.Disputed;
        emit PoolStatusChanged(oldStatus, PoolStatus.Disputed);
    }

    /**
     * @notice Calculate share entitlements for all contributors
     * @param totalShares Total number of fraction tokens received
     */
    function _calculateEntitlements(uint256 totalShares) private {
        for (uint256 i = 0; i < contributors.length; i++) {
            address contributor = contributors[i];
            uint256 contribution = contributions[contributor];
            if (contribution > 0) {
                shareEntitlements[contributor] =
                    (contribution * totalShares) /
                    totalRaised;
            }
        }
    }

    /**
     * @notice Check if a domain is a valid candidate
     * @param domainName Domain name to check
     */
    function _isDomainCandidate(
        string memory domainName
    ) private view returns (bool) {
        for (uint256 i = 0; i < domainCandidates.length; i++) {
            if (
                keccak256(bytes(domainCandidates[i])) ==
                keccak256(bytes(domainName))
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Get all contributors
     */
    function getContributors() external view returns (address[] memory) {
        return contributors;
    }

    /**
     * @notice Get all domain candidates
     */
    function getDomainCandidates() external view returns (string[] memory) {
        return domainCandidates;
    }

    /**
     * @notice Get pool metadata
     */
    function getMetadata() external view returns (PoolMetadata memory) {
        return metadata;
    }

    /**
     * @notice ERC721 receiver implementation
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Receive function to accept ETH (for gas refunds, etc.)
     */
    receive() external payable {}
}
