import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("RevenueDistributor", function () {
  let revenueDistributor: any;
  let mockFractionToken: any;
  let mockUSDC: any;
  let owner: any;
  let holder1: any;
  let holder2: any;
  let holder3: any;

  beforeEach(async function () {
    [owner, holder1, holder2, holder3] = await ethers.getSigners();

    // Deploy mock contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();

    const MockFractionToken = await ethers.getContractFactory("MockFractionToken");
    mockFractionToken = await MockFractionToken.deploy("Mock Fraction", "FRAC", owner.address, 0);

    // Deploy RevenueDistributor
    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    revenueDistributor = await RevenueDistributor.deploy(owner.address);

    // Initialize
    await revenueDistributor.initialize(
      await mockFractionToken.getAddress(),
      await mockUSDC.getAddress()
    );

    // Mint fraction tokens to holders
    await mockFractionToken.mint(holder1.address, ethers.parseEther("6000")); // 60%
    await mockFractionToken.mint(holder2.address, ethers.parseEther("3000")); // 30%
    await mockFractionToken.mint(holder3.address, ethers.parseEther("1000")); // 10%
  });

  describe("Initialization", function () {
    it("Should initialize with correct addresses", async function () {
      expect(await revenueDistributor.fractionTokenAddress()).to.equal(
        await mockFractionToken.getAddress()
      );
      expect(await revenueDistributor.usdcAddress()).to.equal(
        await mockUSDC.getAddress()
      );
    });

    it("Should reject double initialization", async function () {
      await expect(
        revenueDistributor.initialize(
          await mockFractionToken.getAddress(),
          await mockUSDC.getAddress()
        )
      ).to.be.revertedWith("RevenueDistributor: Already initialized");
    });

    it("Should reject invalid addresses", async function () {
      const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
      const newDistributor = await RevenueDistributor.deploy(owner.address);

      await expect(
        newDistributor.initialize(ethers.ZeroAddress, await mockUSDC.getAddress())
      ).to.be.revertedWith("RevenueDistributor: Invalid fraction token");

      await expect(
        newDistributor.initialize(await mockFractionToken.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("RevenueDistributor: Invalid USDC address");
    });
  });

  describe("Distribution Creation", function () {
    it("Should create a distribution with snapshot", async function () {
      const distributionAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
      
      // Mint USDC to distributor
      await mockUSDC.mint(await revenueDistributor.getAddress(), distributionAmount);

      const holders = [holder1.address, holder2.address, holder3.address];
      const balances = [
        ethers.parseEther("6000"),
        ethers.parseEther("3000"),
        ethers.parseEther("1000")
      ];

      await expect(
        revenueDistributor.createDistribution(distributionAmount, holders, balances)
      )
        .to.emit(revenueDistributor, "DistributionCreated")
        .withArgs(0, distributionAmount);

      expect(await revenueDistributor.distributionCount()).to.equal(1);
    });

    it("Should reject distribution with insufficient balance", async function () {
      const distributionAmount = ethers.parseUnits("10000", 6);
      const holders = [holder1.address];
      const balances = [ethers.parseEther("6000")];

      await expect(
        revenueDistributor.createDistribution(distributionAmount, holders, balances)
      ).to.be.revertedWith("RevenueDistributor: Insufficient USDC balance");
    });

    it("Should reject distribution with mismatched arrays", async function () {
      const distributionAmount = ethers.parseUnits("10000", 6);
      await mockUSDC.mint(await revenueDistributor.getAddress(), distributionAmount);

      const holders = [holder1.address, holder2.address];
      const balances = [ethers.parseEther("6000")]; // Mismatched length

      await expect(
        revenueDistributor.createDistribution(distributionAmount, holders, balances)
      ).to.be.revertedWith("RevenueDistributor: Array length mismatch");
    });

    it("Should handle multiple distributions", async function () {
      const amount1 = ethers.parseUnits("10000", 6);
      const amount2 = ethers.parseUnits("5000", 6);

      await mockUSDC.mint(await revenueDistributor.getAddress(), amount1 + amount2);

      const holders = [holder1.address, holder2.address, holder3.address];
      const balances = [
        ethers.parseEther("6000"),
        ethers.parseEther("3000"),
        ethers.parseEther("1000")
      ];

      await revenueDistributor.createDistribution(amount1, holders, balances);
      await revenueDistributor.createDistribution(amount2, holders, balances);

      expect(await revenueDistributor.distributionCount()).to.equal(2);
    });
  });

  describe("Claiming", function () {
    beforeEach(async function () {
      const distributionAmount = ethers.parseUnits("10000", 6);
      await mockUSDC.mint(await revenueDistributor.getAddress(), distributionAmount);

      const holders = [holder1.address, holder2.address, holder3.address];
      const balances = [
        ethers.parseEther("6000"),
        ethers.parseEther("3000"),
        ethers.parseEther("1000")
      ];

      await revenueDistributor.createDistribution(distributionAmount, holders, balances);
    });

    it("Should allow holders to claim their share", async function () {
      const balanceBefore = await mockUSDC.balanceOf(holder1.address);
      
      await expect(revenueDistributor.connect(holder1).claim(0))
        .to.emit(revenueDistributor, "RevenueClaimed")
        .withArgs(0, holder1.address, ethers.parseUnits("6000", 6));

      const balanceAfter = await mockUSDC.balanceOf(holder1.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("6000", 6));
    });

    it("Should calculate proportional shares correctly", async function () {
      await revenueDistributor.connect(holder1).claim(0);
      await revenueDistributor.connect(holder2).claim(0);
      await revenueDistributor.connect(holder3).claim(0);

      const balance1 = await mockUSDC.balanceOf(holder1.address);
      const balance2 = await mockUSDC.balanceOf(holder2.address);
      const balance3 = await mockUSDC.balanceOf(holder3.address);

      expect(balance1).to.equal(ethers.parseUnits("6000", 6)); // 60%
      expect(balance2).to.equal(ethers.parseUnits("3000", 6)); // 30%
      expect(balance3).to.equal(ethers.parseUnits("1000", 6)); // 10%
    });

    it("Should reject duplicate claims", async function () {
      await revenueDistributor.connect(holder1).claim(0);
      
      await expect(revenueDistributor.connect(holder1).claim(0))
        .to.be.revertedWith("RevenueDistributor: Already claimed");
    });

    it("Should reject claims from non-holders", async function () {
      const [, , , , nonHolder] = await ethers.getSigners();
      
      await expect(revenueDistributor.connect(nonHolder).claim(0))
        .to.be.revertedWith("RevenueDistributor: No tokens at snapshot");
    });

    it("Should handle partial claims correctly", async function () {
      await revenueDistributor.connect(holder1).claim(0);
      
      const distribution = await revenueDistributor.distributions(0);
      expect(distribution.claimedAmount).to.equal(ethers.parseUnits("6000", 6));
    });
  });

  describe("Batch Claiming", function () {
    beforeEach(async function () {
      // Create multiple distributions
      for (let i = 0; i < 3; i++) {
        const amount = ethers.parseUnits("10000", 6);
        await mockUSDC.mint(await revenueDistributor.getAddress(), amount);

        const holders = [holder1.address, holder2.address, holder3.address];
        const balances = [
          ethers.parseEther("6000"),
          ethers.parseEther("3000"),
          ethers.parseEther("1000")
        ];

        await revenueDistributor.createDistribution(amount, holders, balances);
      }
    });

    it("Should allow batch claiming from multiple distributions", async function () {
      const balanceBefore = await mockUSDC.balanceOf(holder1.address);
      
      await expect(revenueDistributor.connect(holder1).batchClaim([0, 1, 2]))
        .to.emit(revenueDistributor, "RevenueClaimed");

      const balanceAfter = await mockUSDC.balanceOf(holder1.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("18000", 6)); // 6000 * 3
    });

    it("Should skip already claimed distributions", async function () {
      await revenueDistributor.connect(holder1).claim(0);
      
      const balanceBefore = await mockUSDC.balanceOf(holder1.address);
      await revenueDistributor.connect(holder1).batchClaim([0, 1, 2]);
      const balanceAfter = await mockUSDC.balanceOf(holder1.address);

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("12000", 6)); // 6000 * 2
    });

    it("Should handle empty batch", async function () {
      await expect(revenueDistributor.connect(holder1).batchClaim([]))
        .to.not.be.reverted;
    });
  });

  describe("Distribution Queries", function () {
    beforeEach(async function () {
      const amount = ethers.parseUnits("10000", 6);
      await mockUSDC.mint(await revenueDistributor.getAddress(), amount);

      const holders = [holder1.address, holder2.address];
      const balances = [ethers.parseEther("7000"), ethers.parseEther("3000")];

      await revenueDistributor.createDistribution(amount, holders, balances);
    });

    it("Should return claimable amount for holder", async function () {
      const claimable = await revenueDistributor.getClaimableAmount(0, holder1.address);
      expect(claimable).to.equal(ethers.parseUnits("7000", 6));
    });

    it("Should return zero for claimed distribution", async function () {
      await revenueDistributor.connect(holder1).claim(0);
      
      const claimable = await revenueDistributor.getClaimableAmount(0, holder1.address);
      expect(claimable).to.equal(0);
    });

    it("Should return distribution info correctly", async function () {
      const info = await revenueDistributor.distributions(0);
      expect(info.totalAmount).to.equal(ethers.parseUnits("10000", 6));
      expect(info.claimedAmount).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small distributions", async function () {
      const smallAmount = 100n; // 100 micro-USDC = 0.0001 USDC
      await mockUSDC.mint(await revenueDistributor.getAddress(), smallAmount);

      const holders = [holder1.address];
      const balances = [ethers.parseEther("1000")];

      await expect(
        revenueDistributor.createDistribution(smallAmount, holders, balances)
      ).to.not.be.reverted;
    });

    it("Should handle single holder", async function () {
      const amount = ethers.parseUnits("10000", 6);
      await mockUSDC.mint(await revenueDistributor.getAddress(), amount);

      const holders = [holder1.address];
      const balances = [ethers.parseEther("10000")];

      await revenueDistributor.createDistribution(amount, holders, balances);
      await revenueDistributor.connect(holder1).claim(0);

      expect(await mockUSDC.balanceOf(holder1.address)).to.equal(amount);
    });

    it("Should handle zero balance holder in snapshot", async function () {
      const amount = ethers.parseUnits("10000", 6);
      await mockUSDC.mint(await revenueDistributor.getAddress(), amount);

      const holders = [holder1.address, holder2.address];
      const balances = [ethers.parseEther("10000"), 0n]; // holder2 has 0 balance

      await revenueDistributor.createDistribution(amount, holders, balances);
      
      const claimable2 = await revenueDistributor.getClaimableAmount(0, holder2.address);
      expect(claimable2).to.equal(0);
    });
  });

  describe("Gas Optimization", function () {
    it("Should efficiently handle large number of holders", async function () {
      const holderCount = 50;
      const signers = await ethers.getSigners();
      const holders = signers.slice(0, holderCount).map(s => s.address);
      const balances = Array(holderCount).fill(ethers.parseEther("100"));

      const amount = ethers.parseUnits("100000", 6);
      await mockUSDC.mint(await revenueDistributor.getAddress(), amount);

      const tx = await revenueDistributor.createDistribution(amount, holders, balances);
      const receipt = await tx.wait();
      
      console.log(`Gas used for ${holderCount} holders: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(10000000n); // Should be under 10M gas
    });

    it("Should efficiently handle batch claims", async function () {
      // Create 10 distributions
      for (let i = 0; i < 10; i++) {
        const amount = ethers.parseUnits("1000", 6);
        await mockUSDC.mint(await revenueDistributor.getAddress(), amount);
        await revenueDistributor.createDistribution(
          amount,
          [holder1.address],
          [ethers.parseEther("1000")]
        );
      }

      const tx = await revenueDistributor.connect(holder1).batchClaim([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      const receipt = await tx.wait();
      
      console.log(`Gas used for 10 batch claims: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(500000n);
    });
  });
});
