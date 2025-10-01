// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRevenueDistributor
 * @notice Interface for RevenueDistributor contract
 */
interface IRevenueDistributor {
    struct Distribution {
        uint256 id;
        uint256 totalAmount;
        uint256 snapshotId;
        uint256 timestamp;
        uint256 claimedAmount;
        mapping(address => bool) hasClaimed;
    }

    event DistributionCreated(
        uint256 indexed id,
        uint256 amount,
        uint256 snapshotId,
        uint256 timestamp
    );
    event Claimed(
        address indexed user,
        uint256 indexed distributionId,
        uint256 amount
    );
    event RevenueDeposited(address indexed from, uint256 amount);
}
