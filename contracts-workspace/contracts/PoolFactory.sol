// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./FractionPool.sol";

/**
 * @title PoolFactory
 * @notice Factory contract for creating and managing FractionPool instances
 */
contract PoolFactory is Ownable, ReentrancyGuard {
    // State variables
    address[] public allPools;
    mapping(uint256 => address) public poolById;
    uint256 public poolCount;
    uint256 public factoryFeePercentage; // Basis points (e.g., 100 = 1%)

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        address indexed poolAddress,
        address indexed creator,
        string poolName
    );
    event FactoryFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor() Ownable(msg.sender) {
        factoryFeePercentage = 0; // No factory fee initially
    }

    /**
     * @notice Create a new FractionPool
     * @param poolName Name of the pool
     * @param targetRaise Target amount to raise in USDC
     * @param contributionStart Start timestamp for contributions
     * @param contributionEnd End timestamp for contributions
     * @param votingStart Start timestamp for voting
     * @param votingEnd End timestamp for voting
     * @param purchaseWindowStart Start timestamp for purchase window
     * @param purchaseWindowEnd End timestamp for purchase window
     * @param fractionalSharesTotal Total supply of fractional shares to mint
     * @param minimumContribution Minimum contribution amount in USDC
     * @param usdcAddress Address of USDC token contract
     * @return poolAddress Address of the newly created pool
     */
    function createPool(
        string memory poolName,
        uint256 targetRaise,
        uint256 contributionStart,
        uint256 contributionEnd,
        uint256 votingStart,
        uint256 votingEnd,
        uint256 purchaseWindowStart,
        uint256 purchaseWindowEnd,
        uint256 fractionalSharesTotal,
        uint256 minimumContribution,
        address usdcAddress
    ) external nonReentrant returns (address poolAddress) {
        require(
            targetRaise > 0,
            "PoolFactory: Target raise must be greater than 0"
        );
        require(
            contributionEnd > contributionStart,
            "PoolFactory: Invalid contribution window"
        );
        require(votingEnd > votingStart, "PoolFactory: Invalid voting window");
        require(
            votingStart >= contributionEnd,
            "PoolFactory: Voting must start after contribution ends"
        );
        require(
            purchaseWindowEnd > purchaseWindowStart,
            "PoolFactory: Invalid purchase window"
        );
        require(
            purchaseWindowStart >= votingEnd,
            "PoolFactory: Purchase must start after voting ends"
        );
        require(
            fractionalSharesTotal > 0,
            "PoolFactory: Fractional shares must be greater than 0"
        );
        require(usdcAddress != address(0), "PoolFactory: Invalid USDC address");

        // Create new pool
        FractionPool newPool = new FractionPool(
            msg.sender,
            poolName,
            targetRaise,
            contributionStart,
            contributionEnd,
            votingStart,
            votingEnd,
            purchaseWindowStart,
            purchaseWindowEnd,
            fractionalSharesTotal,
            minimumContribution,
            usdcAddress
        );

        poolAddress = address(newPool);
        uint256 poolId = poolCount;

        allPools.push(poolAddress);
        poolById[poolId] = poolAddress;
        poolCount++;

        emit PoolCreated(poolId, poolAddress, msg.sender, poolName);

        return poolAddress;
    }

    /**
     * @notice Get pool address by ID
     * @param poolId ID of the pool
     * @return Pool address and metadata
     */
    function getPool(uint256 poolId) external view returns (address) {
        require(poolId < poolCount, "PoolFactory: Pool does not exist");
        return poolById[poolId];
    }

    /**
     * @notice Get all pools
     * @return Array of all pool addresses
     */
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /**
     * @notice Update factory fee percentage
     * @param newFeePercentage New fee percentage in basis points
     */
    function updateFactoryFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "PoolFactory: Fee too high"); // Max 10%
        uint256 oldFee = factoryFeePercentage;
        factoryFeePercentage = newFeePercentage;
        emit FactoryFeeUpdated(oldFee, newFeePercentage);
    }
}
