// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IFractionPool
 * @notice Interface for FractionPool contract
 */
interface IFractionPool {
    enum PoolStatus {
        Fundraising,
        Voting,
        Purchased,
        Fractionalized,
        Closed,
        Disputed
    }

    struct PoolMetadata {
        address creator;
        string poolName;
        uint256 targetRaise;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 purchaseWindowStart;
        uint256 purchaseWindowEnd;
        uint256 minimumContribution;
        address usdcAddress;
        uint256 fractionalSharesTotal;
        PoolStatus status;
    }

    struct DomainCandidate {
        string domainName;
        uint256 voteCount;
        uint256 estimatedPrice;
    }

    event ContributionMade(
        address indexed contributor,
        uint256 amount,
        uint256 timestamp
    );
    event VoteCast(address indexed voter, string candidate, uint256 weight);
    event PurchaseExecuted(
        bytes32 indexed txHash,
        address domainNFT,
        uint256 tokenId
    );
    event Fractionalized(
        address indexed fractionTokenAddress,
        uint256 totalSupply
    );
    event SharesDistributed(address indexed recipient, uint256 amount);
    event RevenueReceived(uint256 amount, address indexed source);
    event BuyoutProposed(address indexed buyer, uint256 amount);
    event RefundIssued(address indexed contributor, uint256 amount);
    event PoolStatusChanged(PoolStatus oldStatus, PoolStatus newStatus);
}
