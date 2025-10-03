/**
 * Smart Contract Addresses on DOMA Testnet
 *
 * Chain ID: 97476 (0x17CC4)
 * Network: DOMA Testnet
 * Deployed: 2025-10-02
 */

export const DOMA_TESTNET_CHAIN_ID = 97476;

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  PoolFactory: "0x0a9d46B83bEd07a60e26376Eb69Db3Db4C0021e2",

  // Supporting Contracts
  RevenueDistributor: "0x8E167dca9B9268Ba65967b26CdB8b14Edf6a26D7",
  BuyoutHandler: "0x2D1d867593BF0e6c33f9C9D9bc8a66DEF9e3769C",

  // Mock Tokens (Testnet Only)
  MockUSDC: "0xC86eb05835Cbfb4604dF162761180Acd0A0049DA",
  MockDomainNFT: "0xfe5fce5B82aBbfc59CE57779aC61b2d5bE974226",

  // DOMA Protocol Contracts
  DomaRecord: "0xF6A92E0f8bEa4174297B0219d9d47fEe335f84f8",
  OwnershipToken: "0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f",
  CrossChainGateway: "0xCE1476C791ff195e462632bf9Eb22f3d3cA07388",

  // Network Configuration
  RPC_URL: "https://rpc-testnet.doma.xyz",
  EXPLORER_URL: "https://explorer-testnet.doma.xyz",
} as const;

// Type-safe contract address getter
export function getContractAddress(
  contractName: keyof typeof CONTRACT_ADDRESSES
): string {
  const address = CONTRACT_ADDRESSES[contractName];
  if (!address || typeof address !== "string" || !address.startsWith("0x")) {
    throw new Error(`Invalid contract address for ${contractName}`);
  }
  return address;
}

// Validate network
export function validateNetwork(chainId: number): boolean {
  return chainId === DOMA_TESTNET_CHAIN_ID;
}

// Get explorer link for address
export function getExplorerLink(
  address: string,
  type: "address" | "tx" = "address"
): string {
  return `${CONTRACT_ADDRESSES.EXPLORER_URL}/${type}/${address}`;
}

// Get explorer link for transaction
export function getTransactionLink(txHash: string): string {
  return getExplorerLink(txHash, "tx");
}
