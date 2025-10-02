/**
 * Smart Contract Addresses on DOMA Testnet
 * 
 * Chain ID: 97476 (0x17CC4)
 * Network: DOMA Testnet
 * Deployed: 2025-10-01
 */

export const DOMA_TESTNET_CHAIN_ID = 97476

export const CONTRACT_ADDRESSES = {
  // Core Contracts
  PoolFactory: "0x5a12D663CF1e3d7b728468aBe09b3d956a524fb4",
  
  // Supporting Contracts
  RevenueDistributor: "0x372bD93F70Dfd866e17A17AbA51e47eebEb4859E",
  BuyoutHandler: "0x1BE5d82136624202212A706561f2f63D875AfA3C",
  
  // Mock Tokens (Testnet Only)
  MockUSDC: "0xdfF6Bf7FBCbbA7142e0B091a14404080DcA852BB",
  MockDomainNFT: "0x2D40FE0Ea341d42158a1827c5398f28B783bE803",
  
  // DOMA Protocol Contracts
  DomaRecord: "0xF6A92E0f8bEa4174297B0219d9d47fEe335f84f8",
  OwnershipToken: "0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f",
  CrossChainGateway: "0xCE1476C791ff195e462632bf9Eb22f3d3cA07388",
  
  // Network Configuration
  RPC_URL: "https://rpc-testnet.doma.xyz",
  EXPLORER_URL: "https://explorer-testnet.doma.xyz",
} as const

// Type-safe contract address getter
export function getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES): string {
  const address = CONTRACT_ADDRESSES[contractName]
  if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
    throw new Error(`Invalid contract address for ${contractName}`)
  }
  return address
}

// Validate network
export function validateNetwork(chainId: number): boolean {
  return chainId === DOMA_TESTNET_CHAIN_ID
}

// Get explorer link for address
export function getExplorerLink(address: string, type: 'address' | 'tx' = 'address'): string {
  return `${CONTRACT_ADDRESSES.EXPLORER_URL}/${type}/${address}`
}

// Get explorer link for transaction
export function getTransactionLink(txHash: string): string {
  return getExplorerLink(txHash, 'tx')
}
