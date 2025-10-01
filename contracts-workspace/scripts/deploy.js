const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of DomaDAO contracts...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy Mock USDC (for testing)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy Mock Domain NFT (for testing)
  console.log("\nDeploying MockDomainNFT...");
  const MockDomainNFT = await hre.ethers.getContractFactory("MockDomainNFT");
  const domainNFT = await MockDomainNFT.deploy();
  await domainNFT.waitForDeployment();
  const domainNFTAddress = await domainNFT.getAddress();
  console.log("MockDomainNFT deployed to:", domainNFTAddress);

  // Deploy PoolFactory
  console.log("\nDeploying PoolFactory...");
  const PoolFactory = await hre.ethers.getContractFactory("PoolFactory");
  const poolFactory = await PoolFactory.deploy();
  await poolFactory.waitForDeployment();
  const poolFactoryAddress = await poolFactory.getAddress();
  console.log("PoolFactory deployed to:", poolFactoryAddress);

  // Deploy BuyoutHandler
  console.log("\nDeploying BuyoutHandler...");
  const BuyoutHandler = await hre.ethers.getContractFactory("BuyoutHandler");
  const buyoutHandler = await BuyoutHandler.deploy(usdcAddress, deployer.address);
  await buyoutHandler.waitForDeployment();
  const buyoutHandlerAddress = await buyoutHandler.getAddress();
  console.log("BuyoutHandler deployed to:", buyoutHandlerAddress);

  // Deploy RevenueDistributor
  console.log("\nDeploying RevenueDistributor...");
  const RevenueDistributor = await hre.ethers.getContractFactory("RevenueDistributor");
  const revenueDistributor = await RevenueDistributor.deploy(deployer.address);
  await revenueDistributor.waitForDeployment();
  const revenueDistributorAddress = await revenueDistributor.getAddress();
  console.log("RevenueDistributor deployed to:", revenueDistributorAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("MockUSDC:            ", usdcAddress);
  console.log("MockDomainNFT:       ", domainNFTAddress);
  console.log("PoolFactory:         ", poolFactoryAddress);
  console.log("BuyoutHandler:       ", buyoutHandlerAddress);
  console.log("RevenueDistributor:  ", revenueDistributorAddress);
  
  console.log("\n=== Deployment Complete ===");
  
  // Save deployment addresses to a file
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: usdcAddress,
      MockDomainNFT: domainNFTAddress,
      PoolFactory: poolFactoryAddress,
      BuyoutHandler: buyoutHandlerAddress,
      RevenueDistributor: revenueDistributorAddress
    }
  };
  
  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment addresses saved to deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
