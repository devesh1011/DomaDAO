import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;

describe("PoolFactory", function () {
  let poolFactory;
  let mockUSDC;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();

    const PoolFactory = await ethers.getContractFactory("PoolFactory");
    poolFactory = await PoolFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await poolFactory.getAddress()).to.be.properAddress;
    });

    it("Should start with zero pools", async function () {
      expect(await poolFactory.poolCount()).to.equal(0);
    });
  });

  describe("Pool Creation", function () {
    it("Should create a new pool", async function () {
      const now = await time.latest();
      const tx = await poolFactory.createPool(
        "Test Pool",
        ethers.parseUnits("100000", 6),
        now + 100,
        now + 7 * 24 * 60 * 60,
        now + 7 * 24 * 60 * 60 + 100,
        now + 10 * 24 * 60 * 60,
        now + 10 * 24 * 60 * 60 + 100,
        now + 12 * 24 * 60 * 60,
        ethers.parseEther("100000"),
        ethers.parseUnits("1000", 6),
        await mockUSDC.getAddress()
      );

      await expect(tx).to.emit(poolFactory, "PoolCreated");
      expect(await poolFactory.poolCount()).to.equal(1);
    });
  });
});
