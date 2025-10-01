import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;
import type { Signer } from "ethers";

describe("FractionPool", function () {
  let poolFactory: any;
  let fractionPool: any;
  let mockUSDC: any;
  let mockDomainNFT: any;
  let owner: any;
  let contributor1: any;
  let contributor2: any;
  let contributor3: any;

  const POOL_NAME = "Premium Domains Pool";
  const TARGET_RAISE = ethers.parseUnits("1000000", 6); // 1M USDC
  const MIN_CONTRIBUTION = ethers.parseUnits("1000", 6); // 1000 USDC
  const FRACTIONAL_SHARES = ethers.parseEther("1000000"); // 1M shares

  beforeEach(async function () {
    [owner, contributor1, contributor2, contributor3] = await ethers.getSigners();

    // Deploy mock contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();

    const MockDomainNFT = await ethers.getContractFactory("MockDomainNFT");
    mockDomainNFT = await MockDomainNFT.deploy();

    // Deploy PoolFactory
    const PoolFactory = await ethers.getContractFactory("PoolFactory");
    poolFactory = await PoolFactory.deploy();

    // Setup timestamps
    const now = await time.latest();
    const contributionStart = now + 100;
    const contributionEnd = contributionStart + 7 * 24 * 60 * 60; // 7 days
    const votingStart = contributionEnd + 60;
    const votingEnd = votingStart + 3 * 24 * 60 * 60; // 3 days
    const purchaseStart = votingEnd + 60;
    const purchaseEnd = purchaseStart + 2 * 24 * 60 * 60; // 2 days

    // Create pool
    const tx = await poolFactory.createPool(
      POOL_NAME,
      TARGET_RAISE,
      contributionStart,
      contributionEnd,
      votingStart,
      votingEnd,
      purchaseStart,
      purchaseEnd,
      FRACTIONAL_SHARES,
      MIN_CONTRIBUTION,
      await mockUSDC.getAddress()
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => {
      try {
        return poolFactory.interface.parseLog(log)?.name === "PoolCreated";
      } catch {
        return false;
      }
    });

    const poolAddress = poolFactory.interface.parseLog(event).args.poolAddress;
    fractionPool = await ethers.getContractAt("FractionPool", poolAddress);

    // Mint USDC to contributors
    await mockUSDC.mint(contributor1.address, ethers.parseUnits("100000", 6));
    await mockUSDC.mint(contributor2.address, ethers.parseUnits("100000", 6));
    await mockUSDC.mint(contributor3.address, ethers.parseUnits("100000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct pool metadata", async function () {
      const metadata = await fractionPool.metadata();
      expect(metadata.poolName).to.equal(POOL_NAME);
      expect(metadata.targetRaise).to.equal(TARGET_RAISE);
      expect(metadata.fractionalSharesTotal).to.equal(FRACTIONAL_SHARES);
    });

    it("Should start in Fundraising status", async function () {
      const metadata = await fractionPool.metadata();
      expect(metadata.status).to.equal(0); // PoolStatus.Fundraising
    });
  });

  describe("Contributions", function () {
    beforeEach(async function () {
      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.startTimestamp);
    });

    it("Should accept contributions during contribution window", async function () {
      const amount = ethers.parseUnits("5000", 6);
      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount);
      
      const tx = await fractionPool.connect(contributor1).contribute(amount);
      await expect(tx).to.emit(fractionPool, "ContributionMade");

      expect(await fractionPool.contributions(contributor1.address)).to.equal(amount);
      expect(await fractionPool.totalRaised()).to.equal(amount);
    });

    it("Should reject contributions below minimum", async function () {
      const amount = ethers.parseUnits("500", 6); // Below minimum
      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount);
      
      await expect(fractionPool.connect(contributor1).contribute(amount))
        .to.be.revertedWith("FractionPool: Below minimum contribution");
    });

    it("Should reject contributions that exceed target", async function () {
      const amount = TARGET_RAISE + ethers.parseUnits("1000", 6);
      await mockUSDC.mint(contributor1.address, amount);
      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount);
      
      await expect(fractionPool.connect(contributor1).contribute(amount))
        .to.be.revertedWith("FractionPool: Exceeds target raise");
    });

    it("Should allow multiple contributions from same address", async function () {
      const amount1 = ethers.parseUnits("5000", 6);
      const amount2 = ethers.parseUnits("3000", 6);

      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount1 + amount2);
      
      await fractionPool.connect(contributor1).contribute(amount1);
      await fractionPool.connect(contributor1).contribute(amount2);

      expect(await fractionPool.contributions(contributor1.address)).to.equal(amount1 + amount2);
    });

    it("Should track multiple contributors", async function () {
      const amount = ethers.parseUnits("10000", 6);

      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount);
      await mockUSDC.connect(contributor2).approve(await fractionPool.getAddress(), amount);

      await fractionPool.connect(contributor1).contribute(amount);
      await fractionPool.connect(contributor2).contribute(amount);

      expect(await fractionPool.totalRaised()).to.equal(amount * 2n);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      // Setup contributions
      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.startTimestamp);

      const amount1 = ethers.parseUnits("60000", 6);
      const amount2 = ethers.parseUnits("40000", 6);

      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount1);
      await mockUSDC.connect(contributor2).approve(await fractionPool.getAddress(), amount2);

      await fractionPool.connect(contributor1).contribute(amount1);
      await fractionPool.connect(contributor2).contribute(amount2);

      // Add domain candidates
      await fractionPool.connect(owner).addDomainCandidate("premium.com");
      await fractionPool.connect(owner).addDomainCandidate("example.com");
      await fractionPool.connect(owner).addDomainCandidate("startup.io");

      // Move to voting period
      await time.increaseTo(metadata.votingStart);
      await fractionPool.connect(owner).startVoting();
    });

    it("Should allow contributors to vote", async function () {
      await expect(fractionPool.connect(contributor1).castVote("premium.com"))
        .to.emit(fractionPool, "VoteCast")
        .withArgs(contributor1.address, "premium.com", ethers.parseUnits("60000", 6));

      expect(await fractionPool.hasVoted(contributor1.address)).to.be.true;
      expect(await fractionPool.voterChoice(contributor1.address)).to.equal("premium.com");
    });

    it("Should reject votes from non-contributors", async function () {
      await expect(fractionPool.connect(contributor3).castVote("premium.com"))
        .to.be.revertedWith("FractionPool: Must be a contributor");
    });

    it("Should reject duplicate votes", async function () {
      await fractionPool.connect(contributor1).castVote("premium.com");
      
      await expect(fractionPool.connect(contributor1).castVote("example.com"))
        .to.be.revertedWith("FractionPool: Already voted");
    });

    it("Should calculate weighted votes correctly", async function () {
      await fractionPool.connect(contributor1).castVote("premium.com");
      await fractionPool.connect(contributor2).castVote("example.com");

      expect(await fractionPool.votesPerCandidate("premium.com"))
        .to.equal(ethers.parseUnits("60000", 6));
      expect(await fractionPool.votesPerCandidate("example.com"))
        .to.equal(ethers.parseUnits("40000", 6));
    });

    it("Should finalize voting and determine winner", async function () {
      await fractionPool.connect(contributor1).castVote("premium.com");
      await fractionPool.connect(contributor2).castVote("example.com");

      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.votingEnd + 1n);

      await fractionPool.connect(owner).finalizeVoting();

      expect(await fractionPool.winningDomain()).to.equal("premium.com");
    });
  });

  describe("Domain Purchase", function () {
    beforeEach(async function () {
      // Setup contributions and voting
      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.startTimestamp);

      const amount = ethers.parseUnits("100000", 6);
      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount);
      await fractionPool.connect(contributor1).contribute(amount);

      await fractionPool.connect(owner).addDomainCandidate("premium.com");
      
      await time.increaseTo(metadata.votingStart);
      await fractionPool.connect(owner).startVoting();
      await fractionPool.connect(contributor1).castVote("premium.com");
      
      await time.increaseTo(metadata.votingEnd + 1n);
      await fractionPool.connect(owner).finalizeVoting();

      // Move to purchase window
      await time.increaseTo(metadata.purchaseWindowStart);

      // Mint NFT to owner for purchase simulation
      await mockDomainNFT.mint(owner.address);
    });

    it("Should record domain purchase", async function () {
      const nftAddress = await mockDomainNFT.getAddress();
      const tokenId = 0; // MockDomainNFT starts from 0
      const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      await mockDomainNFT.connect(owner).approve(await fractionPool.getAddress(), tokenId);

      await expect(fractionPool.connect(owner).recordDomainPurchase(nftAddress, tokenId, txHash))
        .to.emit(fractionPool, "DomainPurchased")
        .withArgs(nftAddress, tokenId, txHash);

      expect(await fractionPool.domainNFTAddress()).to.equal(nftAddress);
      expect(await fractionPool.domainTokenId()).to.equal(tokenId);
    });

    it("Should reject purchase without NFT ownership", async function () {
      const nftAddress = await mockDomainNFT.getAddress();
      const tokenId = 999; // Non-existent token
      const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      await expect(fractionPool.connect(owner).recordDomainPurchase(nftAddress, tokenId, txHash))
        .to.be.reverted;
    });
  });

  describe("Share Distribution", function () {
    beforeEach(async function () {
      // Complete full cycle up to fractionalization
      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.startTimestamp);

      // Multiple contributors with different amounts
      const amount1 = ethers.parseUnits("60000", 6);
      const amount2 = ethers.parseUnits("40000", 6);

      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount1);
      await mockUSDC.connect(contributor2).approve(await fractionPool.getAddress(), amount2);

      await fractionPool.connect(contributor1).contribute(amount1);
      await fractionPool.connect(contributor2).contribute(amount2);

      // Complete voting
      await fractionPool.connect(owner).addDomainCandidate("premium.com");
      await time.increaseTo(metadata.votingStart);
      await fractionPool.connect(owner).startVoting();
      await fractionPool.connect(contributor1).castVote("premium.com");
      await time.increaseTo(metadata.votingEnd + 1n);
      await fractionPool.connect(owner).finalizeVoting();

      // Move to purchase window and complete purchase
      await time.increaseTo(metadata.purchaseWindowStart);
      await mockDomainNFT.mint(owner.address);
      const tokenId = 0; // First token minted
      await mockDomainNFT.connect(owner).approve(await fractionPool.getAddress(), tokenId);
      const txHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      await fractionPool.connect(owner).recordDomainPurchase(await mockDomainNFT.getAddress(), tokenId, txHash);

      // Deploy mock fraction token
      const MockFractionToken = await ethers.getContractFactory("MockFractionToken");
      const fractionToken = await MockFractionToken.deploy("Mock Fraction", "FRAC", owner.address, 0);
      
      // Record fractionalization
      await fractionPool.connect(owner).recordFractionalization(await fractionToken.getAddress());
    });

    it("Should calculate pro-rata share entitlements", async function () {
      const entitlement1 = await fractionPool.shareEntitlements(contributor1.address);
      const entitlement2 = await fractionPool.shareEntitlements(contributor2.address);

      // 60% and 40% of total shares
      expect(entitlement1).to.equal(ethers.parseEther("600000"));
      expect(entitlement2).to.equal(ethers.parseEther("400000"));
    });

    it("Should allow contributors to claim shares", async function () {
      await expect(fractionPool.connect(contributor1).claimShares())
        .to.emit(fractionPool, "SharesClaimed")
        .withArgs(contributor1.address, ethers.parseEther("600000"));

      expect(await fractionPool.hasClaimed(contributor1.address)).to.be.true;
    });

    it("Should reject duplicate claims", async function () {
      await fractionPool.connect(contributor1).claimShares();
      
      await expect(fractionPool.connect(contributor1).claimShares())
        .to.be.revertedWith("FractionPool: Already claimed shares");
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.startTimestamp);

      const amount = ethers.parseUnits("50000", 6);
      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount);
      await fractionPool.connect(contributor1).contribute(amount);
    });

    it("Should allow refunds if purchase fails", async function () {
      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.purchaseWindowEnd + 1n);

      const balanceBefore = await mockUSDC.balanceOf(contributor1.address);
      
      await expect(fractionPool.connect(contributor1).refund())
        .to.emit(fractionPool, "RefundIssued")
        .withArgs(contributor1.address, ethers.parseUnits("50000", 6));

      const balanceAfter = await mockUSDC.balanceOf(contributor1.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("50000", 6));
    });

    it("Should reject refunds before they are enabled", async function () {
      await expect(fractionPool.connect(contributor1).refund())
        .to.be.revertedWith("FractionPool: Refund not available");
    });
  });

  describe("Gas Optimization", function () {
    it("Should efficiently handle multiple contributions", async function () {
      const metadata = await fractionPool.metadata();
      await time.increaseTo(metadata.startTimestamp);

      const amount = ethers.parseUnits("5000", 6);
      await mockUSDC.connect(contributor1).approve(await fractionPool.getAddress(), amount * 10n);

      const gasUsed = [];
      for (let i = 0; i < 5; i++) {
        const tx = await fractionPool.connect(contributor1).contribute(amount);
        const receipt = await tx.wait();
        gasUsed.push(receipt.gasUsed);
      }

      // Gas should be relatively stable (within 10% variance)
      const avgGas = gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
      gasUsed.forEach(gas => {
        expect(gas).to.be.closeTo(avgGas, avgGas / 10n);
      });
    });
  });
});
