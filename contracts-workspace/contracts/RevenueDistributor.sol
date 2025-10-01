// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IRevenueDistributor.sol";

/**
 * @title RevenueDistributor
 * @notice Distributes revenue to fractional share token holders
 * @dev Implements snapshot-based distribution to prevent manipulation
 */
contract RevenueDistributor is IRevenueDistributor, Ownable, ReentrancyGuard {
    // State variables
    address public fractionTokenAddress;
    address public usdcAddress;
    uint256 public distributionCount;

    // Distribution tracking
    mapping(uint256 => DistributionInfo) public distributions;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    struct DistributionInfo {
        uint256 id;
        uint256 totalAmount;
        uint256 timestamp;
        uint256 claimedAmount;
        uint256 totalSupplyAtSnapshot;
        mapping(address => uint256) balanceSnapshot;
        address[] snapshotHolders;
    }

    modifier onlyInitialized() {
        require(
            fractionTokenAddress != address(0),
            "RevenueDistributor: Not initialized"
        );
        _;
    }

    constructor(address _owner) Ownable(_owner) {}

    /**
     * @notice Initialize the distributor with token addresses
     * @param _fractionTokenAddress Address of the ERC20 fraction token
     * @param _usdcAddress Address of USDC token
     */
    function initialize(
        address _fractionTokenAddress,
        address _usdcAddress
    ) external onlyOwner {
        require(
            fractionTokenAddress == address(0),
            "RevenueDistributor: Already initialized"
        );
        require(
            _fractionTokenAddress != address(0),
            "RevenueDistributor: Invalid fraction token"
        );
        require(
            _usdcAddress != address(0),
            "RevenueDistributor: Invalid USDC address"
        );

        fractionTokenAddress = _fractionTokenAddress;
        usdcAddress = _usdcAddress;
    }

    /**
     * @notice Create a new revenue distribution
     * @param amount Amount of USDC to distribute
     * @param holders Array of addresses holding fraction tokens at snapshot
     * @param balances Array of balances corresponding to holders
     */
    function createDistribution(
        uint256 amount,
        address[] calldata holders,
        uint256[] calldata balances
    ) external onlyOwner onlyInitialized nonReentrant {
        require(
            amount > 0,
            "RevenueDistributor: Amount must be greater than 0"
        );
        require(
            holders.length == balances.length,
            "RevenueDistributor: Length mismatch"
        );
        require(holders.length > 0, "RevenueDistributor: No holders");

        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "RevenueDistributor: USDC transfer failed"
        );

        uint256 distributionId = distributionCount;
        DistributionInfo storage dist = distributions[distributionId];

        dist.id = distributionId;
        dist.totalAmount = amount;
        dist.timestamp = block.timestamp;
        dist.claimedAmount = 0;
        dist.snapshotHolders = holders;

        uint256 totalSupply = 0;
        for (uint256 i = 0; i < holders.length; i++) {
            dist.balanceSnapshot[holders[i]] = balances[i];
            totalSupply += balances[i];
        }
        dist.totalSupplyAtSnapshot = totalSupply;

        distributionCount++;

        emit DistributionCreated(
            distributionId,
            amount,
            distributionId,
            block.timestamp
        );
    }

    /**
     * @notice Claim share of a distribution
     * @param distributionId ID of the distribution to claim from
     */
    function claim(uint256 distributionId) external nonReentrant {
        require(
            distributionId < distributionCount,
            "RevenueDistributor: Invalid distribution ID"
        );
        require(
            !hasClaimed[distributionId][msg.sender],
            "RevenueDistributor: Already claimed"
        );

        DistributionInfo storage dist = distributions[distributionId];
        uint256 userBalance = dist.balanceSnapshot[msg.sender];
        require(userBalance > 0, "RevenueDistributor: No balance at snapshot");

        uint256 claimAmount = (dist.totalAmount * userBalance) /
            dist.totalSupplyAtSnapshot;
        require(claimAmount > 0, "RevenueDistributor: Nothing to claim");

        hasClaimed[distributionId][msg.sender] = true;
        dist.claimedAmount += claimAmount;

        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transfer(msg.sender, claimAmount),
            "RevenueDistributor: Transfer failed"
        );

        emit Claimed(msg.sender, distributionId, claimAmount);
    }

    /**
     * @notice Claim from multiple distributions at once
     * @param distributionIds Array of distribution IDs to claim from
     */
    function claimMultiple(
        uint256[] calldata distributionIds
    ) external nonReentrant {
        uint256 totalClaim = 0;

        for (uint256 i = 0; i < distributionIds.length; i++) {
            uint256 distributionId = distributionIds[i];

            if (distributionId >= distributionCount) continue;
            if (hasClaimed[distributionId][msg.sender]) continue;

            DistributionInfo storage dist = distributions[distributionId];
            uint256 userBalance = dist.balanceSnapshot[msg.sender];

            if (userBalance == 0) continue;

            uint256 claimAmount = (dist.totalAmount * userBalance) /
                dist.totalSupplyAtSnapshot;

            if (claimAmount > 0) {
                hasClaimed[distributionId][msg.sender] = true;
                dist.claimedAmount += claimAmount;
                totalClaim += claimAmount;

                emit Claimed(msg.sender, distributionId, claimAmount);
            }
        }

        require(totalClaim > 0, "RevenueDistributor: Nothing to claim");

        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transfer(msg.sender, totalClaim),
            "RevenueDistributor: Transfer failed"
        );
    }

    /**
     * @notice Deposit revenue to the contract
     * @param amount Amount of USDC to deposit
     */
    function depositRevenue(uint256 amount) external nonReentrant {
        require(
            amount > 0,
            "RevenueDistributor: Amount must be greater than 0"
        );

        IERC20 usdc = IERC20(usdcAddress);
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "RevenueDistributor: Transfer failed"
        );

        emit RevenueDeposited(msg.sender, amount);
    }

    /**
     * @notice Get claimable amount for a user in a specific distribution
     * @param distributionId ID of the distribution
     * @param user Address of the user
     * @return Claimable amount in USDC
     */
    function getClaimableAmount(
        uint256 distributionId,
        address user
    ) external view returns (uint256) {
        if (distributionId >= distributionCount) return 0;
        if (hasClaimed[distributionId][user]) return 0;

        DistributionInfo storage dist = distributions[distributionId];
        uint256 userBalance = dist.balanceSnapshot[user];

        if (userBalance == 0) return 0;

        return (dist.totalAmount * userBalance) / dist.totalSupplyAtSnapshot;
    }

    /**
     * @notice Get total claimable amount for a user across all distributions
     * @param user Address of the user
     * @return Total claimable amount in USDC
     */
    function getTotalClaimableAmount(
        address user
    ) external view returns (uint256) {
        uint256 total = 0;

        for (uint256 i = 0; i < distributionCount; i++) {
            if (hasClaimed[i][user]) continue;

            DistributionInfo storage dist = distributions[i];
            uint256 userBalance = dist.balanceSnapshot[user];

            if (userBalance > 0) {
                total +=
                    (dist.totalAmount * userBalance) /
                    dist.totalSupplyAtSnapshot;
            }
        }

        return total;
    }

    /**
     * @notice Get distribution info (without mapping data)
     * @param distributionId ID of the distribution
     */
    function getDistributionInfo(
        uint256 distributionId
    )
        external
        view
        returns (
            uint256 id,
            uint256 totalAmount,
            uint256 timestamp,
            uint256 claimedAmount,
            uint256 totalSupplyAtSnapshot,
            address[] memory snapshotHolders
        )
    {
        require(
            distributionId < distributionCount,
            "RevenueDistributor: Invalid distribution ID"
        );
        DistributionInfo storage dist = distributions[distributionId];

        return (
            dist.id,
            dist.totalAmount,
            dist.timestamp,
            dist.claimedAmount,
            dist.totalSupplyAtSnapshot,
            dist.snapshotHolders
        );
    }

    /**
     * @notice Get user balance at distribution snapshot
     * @param distributionId ID of the distribution
     * @param user Address of the user
     */
    function getSnapshotBalance(
        uint256 distributionId,
        address user
    ) external view returns (uint256) {
        require(
            distributionId < distributionCount,
            "RevenueDistributor: Invalid distribution ID"
        );
        return distributions[distributionId].balanceSnapshot[user];
    }
}
