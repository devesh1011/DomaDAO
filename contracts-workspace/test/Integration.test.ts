import { expect } from "chai";
import { ethers } from "hardhat";

// Import all generated contract types from typechain-types
import {
  PoolFactory,
  BuyoutHandler,
  RevenueDistributor,
  MockUSDC,
  MockDomainNFT,
  MockFractionToken,
  FractionPool,
} from "../typechain-types";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FractionPool Flow", function () {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let poolFactory: PoolFactory;
  let buyoutHandler: BuyoutHandler;
  let revenueDistributor: RevenueDistributor;
  let mockUSDC: MockUSDC;
  let mockDomainNFT: MockDomainNFT;
  let pool: FractionPool;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = (await MockUSDC.deploy()) as unknown as MockUSDC;
    await mockUSDC.waitForDeployment();

    // Deploy Mock Domain NFT
    const MockDomainNFT = await ethers.getContractFactory("MockDomainNFT");
    mockDomainNFT = (await MockDomainNFT.deploy()) as unknown as MockDomainNFT;
    await mockDomainNFT.waitForDeployment();

    // Deploy PoolFactory
    const PoolFactory = await ethers.getContractFactory("PoolFactory");
    poolFactory = (await PoolFactory.deploy()) as unknown as PoolFactory;
    await poolFactory.waitForDeployment();

    // Deploy BuyoutHandler
    const BuyoutHandler = await ethers.getContractFactory("BuyoutHandler");
    buyoutHandler = (await BuyoutHandler.deploy(
      await mockUSDC.getAddress(),
      owner.address
    )) as unknown as BuyoutHandler;
    await buyoutHandler.waitForDeployment();

    // Deploy RevenueDistributor
    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    revenueDistributor = (await RevenueDistributor.deploy(
      owner.address
    )) as unknown as RevenueDistributor;
    await revenueDistributor.waitForDeployment();

    // Create a pool through PoolFactory
    const tx = await poolFactory.createPool(
      await mockDomainNFT.getAddress(),
      await mockUSDC.getAddress(),
      1000, // fraction supply
      owner.address
    );
    const receipt = await tx.wait();

    // Get pool address from event
    const event = receipt?.logs.find(
      (log) =>
        (log as any).fragment?.name === "PoolCreated"
    );
    const poolAddress = (event as any).args.pool;

    // Attach FractionPool
    pool = (await ethers.getContractAt(
      "FractionPool",
      poolAddress
    )) as FractionPool;
  });

  it("allows contributions", async () => {
    await mockUSDC.mint(alice.address, 1000);
    await mockUSDC.connect(alice).approve(await pool.getAddress(), 500);

    await pool.connect(alice).contribute(500);

    const contribution = await pool.contributions(alice.address);
    expect(contribution).to.equal(500);
  });

  it("allows domain candidate addition", async () => {
    await pool.addDomainCandidate("example.eth");

    const candidate = await pool.domainCandidates(0);
    expect(candidate).to.equal("example.eth");
  });
});
