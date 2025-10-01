import assert from "node:assert/strict";
import { describe, it } from "node:test";

import pkg from "hardhat";
const { network } = pkg;

describe("PoolFactory", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  it("Should deploy successfully", async function () {
    const poolFactory = await viem.deployContract("PoolFactory");
    assert.ok(poolFactory.address);
  });

  it("Should have zero pools initially", async function () {
    const poolFactory = await viem.deployContract("PoolFactory");
    const poolCount = await poolFactory.read.getPoolCount();
    assert.equal(poolCount, 0n);
  });

  it("Should create a pool successfully", async function () {
    const mockUSDC = await viem.deployContract("MockUSDC");
    const mockDomainNFT = await viem.deployContract("MockDomainNFT");
    const poolFactory = await viem.deployContract("PoolFactory");

    const poolName = "Test Pool";
    const targetAmount = 1000000000000000000000n; // 1000 ETH in wei
    const votingPeriod = 7n * 24n * 60n * 60n; // 7 days
    const minContribution = 10000000000000000000n; // 10 ETH in wei

    await viem.assertions.emitEvent(
      poolFactory.write.createPool([
        poolName,
        targetAmount,
        votingPeriod,
        minContribution,
        mockUSDC.address,
        mockDomainNFT.address
      ]),
      poolFactory,
      "PoolCreated"
    );

    const poolCount = await poolFactory.read.getPoolCount();
    assert.equal(poolCount, 1n);
  });
});