/**
 * Gas pricing utilities for Doma Testnet
 *
 * Doma Testnet uses legacy gas pricing (pre-EIP-1559)
 * and doesn't support maxPriorityFeePerGas/maxFeePerGas methods
 */

import { BrowserProvider } from "ethers";

/**
 * Get legacy gas price for Doma Testnet
 * Uses eth_gasPrice RPC method instead of getFeeData()
 */
export async function getLegacyGasPrice(
  provider: BrowserProvider
): Promise<bigint> {
  try {
    const gasPriceHex = await provider.send("eth_gasPrice", []);
    return BigInt(gasPriceHex);
  } catch (error) {
    console.warn("Failed to fetch gas price, using fallback:", error);
    // Fallback to 1 gwei if gas price fetch fails
    return BigInt(1_000_000_000);
  }
}

/**
 * Get transaction overrides for Doma Testnet
 * Returns legacy transaction options (type 0)
 */
export async function getDomaTransactionOptions(
  provider: BrowserProvider,
  gasEstimate?: bigint,
  gasBuffer: number = 150 // 50% buffer by default
): Promise<{
  gasLimit?: bigint;
  gasPrice: bigint;
  type: number;
}> {
  const gasPrice = await getLegacyGasPrice(provider);

  return {
    gasLimit: gasEstimate
      ? (gasEstimate * BigInt(gasBuffer)) / BigInt(100)
      : undefined,
    gasPrice,
    type: 0, // Legacy transaction type
  };
}

/**
 * Check if network supports EIP-1559
 * Doma Testnet (chain ID 97476) does not support EIP-1559
 */
export async function supportsEIP1559(
  provider: BrowserProvider
): Promise<boolean> {
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Known chains that don't support EIP-1559
    const legacyChains = [
      97476, // Doma Testnet
    ];

    return !legacyChains.includes(chainId);
  } catch {
    return false;
  }
}

/**
 * Format gas price for display
 */
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1_000_000_000;
  return `${gwei.toFixed(2)} gwei`;
}
