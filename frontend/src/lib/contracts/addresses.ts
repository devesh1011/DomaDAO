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
  PoolFactory: "0xEa814c2f9a320C304Fa3fdaE49F20f8bCc14cec4",

  // Supporting Contracts
  RevenueDistributor: "0xcD92BD175e6006F41c64751A9Ba8d2dF911b33ED",
  BuyoutHandler: "0x7EE964243D29a90b2D45500298566d1197b84112",

  // Mock Tokens (Testnet Only)
  MockUSDC: "0x0aE56Fa4528aA92A58103de714F3D122f0bac669",
  MockDomainNFT: "0x387196B48B566e84772f34382D4f10B0460867B5",

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
