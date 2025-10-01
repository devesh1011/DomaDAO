import fs from "fs/promises";
import pkg from "hardhat";
const { ethers, network } = pkg;

async function verifyDeployment(contract, contractName, address, txHash) {
  console.log(`🔍 Verifying ${contractName} at ${address}...`);

  // Log the actual deployment transaction hash
  if (txHash) {
    console.log(`📝 Deployment Transaction Hash: ${txHash}`);
    console.log(`🔗 View on Explorer: https://explorer-testnet.doma.xyz/tx/${txHash}`);
  } else {
    console.log(`⚠️  No deployment transaction hash available`);
  }

  // Check if there's code at the address
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(`${contractName} deployment failed - no code at address ${address}`);
  }
  console.log(`✅ Code found at ${address} (${code.length} bytes)`);

  // Try to call a simple view function to verify the contract is responsive
  try {
    if (contractName === "MockUSDC") {
      const totalSupply = await contract.totalSupply();
      console.log(`✅ MockUSDC totalSupply: ${totalSupply}`);
    } else if (contractName === "MockDomainNFT") {
      // Check if it has name() function instead
      try {
        const name = await contract.name();
        console.log(`✅ MockDomainNFT name: ${name}`);
      } catch (e) {
        console.log(`⚠️  MockDomainNFT verification limited - name() not available`);
      }
    } else if (contractName === "PoolFactory") {
      // Check if it has owner() function
      try {
        const owner = await contract.owner();
        console.log(`✅ PoolFactory owner: ${owner}`);
      } catch (e) {
        console.log(`⚠️  PoolFactory verification limited - owner() not available`);
      }
    } else if (contractName === "BuyoutHandler") {
      const owner = await contract.owner();
      console.log(`✅ BuyoutHandler owner: ${owner}`);
    } else if (contractName === "RevenueDistributor") {
      const owner = await contract.owner();
      console.log(`✅ RevenueDistributor owner: ${owner}`);
    }
    console.log(`✅ ${contractName} fully verified at ${address}\n`);
  } catch (error) {
    console.log(`⚠️  ${contractName} deployed but function call failed: ${error.message}\n`);
  }
}

async function main() {
  console.log("Starting deployment of DomaDAO contracts...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // Deploy Mock USDC (for testing)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdcTx = await MockUSDC.deploy();
  console.log("MockUSDC deployment transaction:", usdcTx.deploymentTransaction()?.hash || "N/A");
  const usdc = await usdcTx.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);
  await verifyDeployment(usdc, "MockUSDC", usdcAddress, usdcTx.deploymentTransaction()?.hash);

  // Deploy Mock Domain NFT (for testing)
  console.log("\nDeploying MockDomainNFT...");
  const MockDomainNFT = await ethers.getContractFactory("MockDomainNFT");
  const domainNFTTx = await MockDomainNFT.deploy();
  console.log("MockDomainNFT deployment transaction:", domainNFTTx.deploymentTransaction()?.hash || "N/A");
  const domainNFT = await domainNFTTx.waitForDeployment();
  const domainNFTAddress = await domainNFT.getAddress();
  console.log("MockDomainNFT deployed to:", domainNFTAddress);
  await verifyDeployment(domainNFT, "MockDomainNFT", domainNFTAddress, domainNFTTx.deploymentTransaction()?.hash);

  // Deploy PoolFactory
  console.log("\nDeploying PoolFactory...");
  const PoolFactory = await ethers.getContractFactory("PoolFactory");
  const poolFactoryTx = await PoolFactory.deploy();
  console.log("PoolFactory deployment transaction:", poolFactoryTx.deploymentTransaction()?.hash || "N/A");
  const poolFactory = await poolFactoryTx.waitForDeployment();
  const poolFactoryAddress = await poolFactory.getAddress();
  console.log("PoolFactory deployed to:", poolFactoryAddress);
  await verifyDeployment(poolFactory, "PoolFactory", poolFactoryAddress, poolFactoryTx.deploymentTransaction()?.hash);

  // Deploy BuyoutHandler
  console.log("\nDeploying BuyoutHandler...");
  const BuyoutHandler = await ethers.getContractFactory("BuyoutHandler");
  const buyoutHandlerTx = await BuyoutHandler.deploy(usdcAddress, deployer.address);
  console.log("BuyoutHandler deployment transaction:", buyoutHandlerTx.deploymentTransaction()?.hash || "N/A");
  const buyoutHandler = await buyoutHandlerTx.waitForDeployment();
  const buyoutHandlerAddress = await buyoutHandler.getAddress();
  console.log("BuyoutHandler deployed to:", buyoutHandlerAddress);
  await verifyDeployment(buyoutHandler, "BuyoutHandler", buyoutHandlerAddress, buyoutHandlerTx.deploymentTransaction()?.hash);

  // Deploy RevenueDistributor
  console.log("\nDeploying RevenueDistributor...");
  const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
  const revenueDistributorTx = await RevenueDistributor.deploy(deployer.address);
  console.log("RevenueDistributor deployment transaction:", revenueDistributorTx.deploymentTransaction()?.hash || "N/A");
  const revenueDistributor = await revenueDistributorTx.waitForDeployment();
  const revenueDistributorAddress = await revenueDistributor.getAddress();
  console.log("RevenueDistributor deployed to:", revenueDistributorAddress);
  await verifyDeployment(revenueDistributor, "RevenueDistributor", revenueDistributorAddress, revenueDistributorTx.deploymentTransaction()?.hash);

  console.log("\n=== Deployment Summary ===");
  console.log("MockUSDC:            ", usdcAddress);
  console.log("MockDomainNFT:       ", domainNFTAddress);
  console.log("PoolFactory:         ", poolFactoryAddress);
  console.log("BuyoutHandler:       ", buyoutHandlerAddress);
  console.log("RevenueDistributor:  ", revenueDistributorAddress);
  
  console.log("\n=== Deployment Complete ===");
  
  // Save deployment addresses to a file
  const deploymentInfo = {
    network: network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: usdcAddress,
      MockDomainNFT: domainNFTAddress,
      PoolFactory: poolFactoryAddress,
      BuyoutHandler: buyoutHandlerAddress,
      RevenueDistributor: revenueDistributorAddress
    }
  };
  
  await fs.writeFile(
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
