import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;

describe("BuyoutHandler", function () {
  let buyoutHandler: any;
  let mockUSDC: any;
  let fractionPool: any;
  let mockFractionToken: any;
  let owner: any;
  let buyer: any;
  let voter1: any;
  let voter2: any;
  let voter3: any;

  beforeEach(async function () {
    [owner, buyer, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy mock contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();

    const MockFractionToken = await ethers.getContractFactory("MockFractionToken");
    mockFractionToken = await MockFractionToken.deploy("Mock Fraction", "FRAC", owner.address, 0);

    // Deploy BuyoutHandler
    const BuyoutHandler = await ethers.getContractFactory("BuyoutHandler");
    buyoutHandler = await BuyoutHandler.deploy(await mockUSDC.getAddress(), owner.address);

    // Mint USDC to buyer
    await mockUSDC.mint(buyer.address, ethers.parseUnits("1000000", 6));

    // Mint fraction tokens to voters
    await mockFractionToken.mint(voter1.address, ethers.parseEther("6000")); // 60%
    await mockFractionToken.mint(voter2.address, ethers.parseEther("3000")); // 30%
    await mockFractionToken.mint(voter3.address, ethers.parseEther("1000")); // 10%

    // Mock pool address
    fractionPool = voter1.address; // Using an address as mock pool
  });

  describe("Deployment", function () {
    it("Should set correct USDC address", async function () {
      expect(await buyoutHandler.usdcAddress()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set correct owner", async function () {
      expect(await buyoutHandler.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero offers", async function () {
      expect(await buyoutHandler.offerCount()).to.equal(0);
    });

    it("Should set default voting period to 7 days", async function () {
      expect(await buyoutHandler.votingPeriod()).to.equal(7 * 24 * 60 * 60);
    });

    it("Should set acceptance threshold to 60%", async function () {
      expect(await buyoutHandler.acceptanceThreshold()).to.equal(6000);
    });
  });

  describe("Buyout Proposal", function () {
    it("Should create a buyout offer", async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);

      await expect(
        buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount)
      )
        .to.emit(buyoutHandler, "BuyoutProposed")
        .withArgs(0, buyer.address, fractionPool, offerAmount, await time.latest() + 7 * 24 * 60 * 60 + 1);

      expect(await buyoutHandler.offerCount()).to.equal(1);
    });

    it("Should transfer USDC to escrow", async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);

      const balanceBefore = await mockUSDC.balanceOf(await buyoutHandler.getAddress());
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);
      const balanceAfter = await mockUSDC.balanceOf(await buyoutHandler.getAddress());

      expect(balanceAfter - balanceBefore).to.equal(offerAmount);
    });

    it("Should reject zero amount offers", async function () {
      await expect(
        buyoutHandler.connect(buyer).proposeBuyout(fractionPool, 0)
      ).to.be.revertedWith("BuyoutHandler: Invalid offer amount");
    });

    it("Should reject offers with insufficient allowance", async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      
      await expect(
        buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount)
      ).to.be.reverted; // ERC20 will revert on insufficient allowance
    });

    it("Should track multiple offers for same pool", async function () {
      const amount1 = ethers.parseUnits("300000", 6);
      const amount2 = ethers.parseUnits("400000", 6);

      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), amount1 + amount2);

      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, amount1);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, amount2);

      const poolOffers = await buyoutHandler.getPoolOffers(fractionPool);
      expect(poolOffers.length).to.equal(2);
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);
    });

    it("Should allow token holders to vote accept", async function () {
      const voteWeight = ethers.parseEther("6000");
      
      await expect(
        buyoutHandler.connect(voter1).voteOnBuyout(0, true, voteWeight)
      )
        .to.emit(buyoutHandler, "BuyoutVoteCast")
        .withArgs(0, voter1.address, true, voteWeight);
    });

    it("Should allow token holders to vote reject", async function () {
      const voteWeight = ethers.parseEther("3000");
      
      await expect(
        buyoutHandler.connect(voter2).voteOnBuyout(0, false, voteWeight)
      )
        .to.emit(buyoutHandler, "BuyoutVoteCast")
        .withArgs(0, voter2.address, false, voteWeight);
    });

    it("Should track acceptance and rejection votes separately", async function () {
      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      await buyoutHandler.connect(voter2).voteOnBuyout(0, false, ethers.parseEther("3000"));

      const offer = await buyoutHandler.buyoutOffers(0);
      expect(offer.acceptanceVotes).to.equal(ethers.parseEther("6000"));
      expect(offer.rejectionVotes).to.equal(ethers.parseEther("3000"));
    });

    it("Should reject duplicate votes", async function () {
      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      
      await expect(
        buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"))
      ).to.be.revertedWith("BuyoutHandler: Already voted");
    });

    it("Should reject votes with zero weight", async function () {
      await expect(
        buyoutHandler.connect(voter1).voteOnBuyout(0, true, 0)
      ).to.be.revertedWith("BuyoutHandler: Invalid vote weight");
    });

    it("Should reject votes after deadline", async function () {
      await time.increase(8 * 24 * 60 * 60); // Move past 7-day voting period
      
      await expect(
        buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"))
      ).to.be.revertedWith("BuyoutHandler: Voting period ended");
    });
  });

  describe("Buyout Finalization", function () {
    beforeEach(async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);
    });

    it("Should finalize as accepted when threshold met", async function () {
      // 60% votes accept (meets 60% threshold)
      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      await buyoutHandler.connect(voter2).voteOnBuyout(0, false, ethers.parseEther("3000"));
      await buyoutHandler.connect(voter3).voteOnBuyout(0, false, ethers.parseEther("1000"));

      await time.increase(8 * 24 * 60 * 60);

      await expect(buyoutHandler.finalizeBuyout(0))
        .to.emit(buyoutHandler, "BuyoutAccepted");

      const offer = await buyoutHandler.buyoutOffers(0);
      expect(offer.status).to.equal(1); // BuyoutStatus.Accepted
    });

    it("Should finalize as rejected when threshold not met", async function () {
      // Only 30% votes accept (below 60% threshold)
      await buyoutHandler.connect(voter1).voteOnBuyout(0, false, ethers.parseEther("6000"));
      await buyoutHandler.connect(voter2).voteOnBuyout(0, true, ethers.parseEther("3000"));
      await buyoutHandler.connect(voter3).voteOnBuyout(0, false, ethers.parseEther("1000"));

      await time.increase(8 * 24 * 60 * 60);

      await expect(buyoutHandler.finalizeBuyout(0))
        .to.emit(buyoutHandler, "BuyoutRejected");

      const offer = await buyoutHandler.buyoutOffers(0);
      expect(offer.status).to.equal(2); // BuyoutStatus.Rejected
    });

    it("Should reject finalization before voting ends", async function () {
      await expect(buyoutHandler.finalizeBuyout(0))
        .to.be.revertedWith("BuyoutHandler: Voting still ongoing");
    });

    it("Should reject finalization of already finalized offer", async function () {
      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      await time.increase(8 * 24 * 60 * 60);
      await buyoutHandler.finalizeBuyout(0);

      await expect(buyoutHandler.finalizeBuyout(0))
        .to.be.revertedWith("BuyoutHandler: Already finalized");
    });
  });

  describe("Buyout Execution", function () {
    beforeEach(async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);
      
      // Vote and finalize as accepted
      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      await buyoutHandler.connect(voter2).voteOnBuyout(0, true, ethers.parseEther("3000"));
      await time.increase(8 * 24 * 60 * 60);
      await buyoutHandler.finalizeBuyout(0);
    });

    it("Should execute accepted buyout", async function () {
      await expect(buyoutHandler.connect(owner).executeBuyout(0))
        .to.emit(buyoutHandler, "BuyoutExecuted")
        .withArgs(0, buyer.address, fractionPool);

      const offer = await buyoutHandler.buyoutOffers(0);
      expect(offer.status).to.equal(3); // BuyoutStatus.Executed
    });

    it("Should transfer funds to pool on execution", async function () {
      const balanceBefore = await mockUSDC.balanceOf(fractionPool);
      await buyoutHandler.connect(owner).executeBuyout(0);
      const balanceAfter = await mockUSDC.balanceOf(fractionPool);

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("500000", 6));
    });

    it("Should reject execution of rejected offer", async function () {
      // Create and reject another offer
      const offerAmount = ethers.parseUnits("300000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);
      await buyoutHandler.connect(voter1).voteOnBuyout(1, false, ethers.parseEther("6000"));
      await time.increase(8 * 24 * 60 * 60);
      await buyoutHandler.finalizeBuyout(1);

      await expect(buyoutHandler.connect(owner).executeBuyout(1))
        .to.be.revertedWith("BuyoutHandler: Offer not accepted");
    });

    it("Should reject double execution", async function () {
      await buyoutHandler.connect(owner).executeBuyout(0);
      
      await expect(buyoutHandler.connect(owner).executeBuyout(0))
        .to.be.revertedWith("BuyoutHandler: Offer not accepted");
    });
  });

  describe("Offer Cancellation", function () {
    beforeEach(async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);
    });

    it("Should allow buyer to cancel pending offer", async function () {
      await expect(buyoutHandler.connect(buyer).cancelOffer(0))
        .to.emit(buyoutHandler, "BuyoutCancelled")
        .withArgs(0);

      const offer = await buyoutHandler.buyoutOffers(0);
      expect(offer.status).to.equal(5); // BuyoutStatus.Cancelled
    });

    it("Should refund escrowed funds on cancellation", async function () {
      const balanceBefore = await mockUSDC.balanceOf(buyer.address);
      await buyoutHandler.connect(buyer).cancelOffer(0);
      const balanceAfter = await mockUSDC.balanceOf(buyer.address);

      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("500000", 6));
    });

    it("Should reject cancellation by non-buyer", async function () {
      await expect(buyoutHandler.connect(voter1).cancelOffer(0))
        .to.be.revertedWith("BuyoutHandler: Not the buyer");
    });

    it("Should reject cancellation of finalized offer", async function () {
      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      await time.increase(8 * 24 * 60 * 60);
      await buyoutHandler.finalizeBuyout(0);

      await expect(buyoutHandler.connect(buyer).cancelOffer(0))
        .to.be.revertedWith("BuyoutHandler: Cannot cancel");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      const amount1 = ethers.parseUnits("300000", 6);
      const amount2 = ethers.parseUnits("400000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), amount1 + amount2);
      
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, amount1);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, amount2);
    });

    it("Should return all offers for a pool", async function () {
      const offers = await buyoutHandler.getPoolOffers(fractionPool);
      expect(offers.length).to.equal(2);
      expect(offers[0]).to.equal(0);
      expect(offers[1]).to.equal(1);
    });

    it("Should return empty array for pool with no offers", async function () {
      const offers = await buyoutHandler.getPoolOffers(voter2.address);
      expect(offers.length).to.equal(0);
    });

    it("Should return offer details correctly", async function () {
      const offer = await buyoutHandler.buyoutOffers(0);
      expect(offer.buyer).to.equal(buyer.address);
      expect(offer.poolAddress).to.equal(fractionPool);
      expect(offer.offerAmount).to.equal(ethers.parseUnits("300000", 6));
      expect(offer.status).to.equal(0); // BuyoutStatus.Pending
    });
  });

  describe("Edge Cases", function () {
    it("Should handle expired offer", async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);

      await time.increase(8 * 24 * 60 * 60); // Past voting deadline
      
      const offer = await buyoutHandler.buyoutOffers(0);
      const currentTime = await time.latest();
      expect(currentTime).to.be.greaterThan(offer.votingDeadline);
    });

    it("Should handle exact threshold vote (60%)", async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);

      // Exactly 60% accept
      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      await buyoutHandler.connect(voter2).voteOnBuyout(0, false, ethers.parseEther("3000"));
      await buyoutHandler.connect(voter3).voteOnBuyout(0, false, ethers.parseEther("1000"));

      await time.increase(8 * 24 * 60 * 60);
      await buyoutHandler.finalizeBuyout(0);

      const offer = await buyoutHandler.buyoutOffers(0);
      expect(offer.status).to.equal(1); // Should be accepted
    });

    it("Should handle very large offer amount", async function () {
      const largeAmount = ethers.parseUnits("1000000", 6); // 1M USDC
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), largeAmount);
      
      await expect(
        buyoutHandler.connect(buyer).proposeBuyout(fractionPool, largeAmount)
      ).to.not.be.reverted;
    });
  });

  describe("Gas Optimization", function () {
    it("Should efficiently handle voting", async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);

      const tx = await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      const receipt = await tx.wait();
      
      console.log(`Gas used for voting: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(150000n);
    });

    it("Should efficiently handle finalization", async function () {
      const offerAmount = ethers.parseUnits("500000", 6);
      await mockUSDC.connect(buyer).approve(await buyoutHandler.getAddress(), offerAmount);
      await buyoutHandler.connect(buyer).proposeBuyout(fractionPool, offerAmount);

      await buyoutHandler.connect(voter1).voteOnBuyout(0, true, ethers.parseEther("6000"));
      await time.increase(8 * 24 * 60 * 60);

      const tx = await buyoutHandler.finalizeBuyout(0);
      const receipt = await tx.wait();
      
      console.log(`Gas used for finalization: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(200000n);
    });
  });
});
