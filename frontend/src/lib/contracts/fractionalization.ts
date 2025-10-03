/**
 * Doma Fractionalization Service
 *
 * This service handles interaction with the Doma Fractionalization smart contract
 * to fractionalize domain NFTs into fungible ERC-20 tokens.
 */

import { ethers, BrowserProvider, Contract, TransactionResponse } from "ethers";

// Doma Fractionalization Contract Address (Doma Testnet)
const FRACTIONALIZATION_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_FRACTIONALIZATION_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000"; // Placeholder - update with actual address

/**
 * Fractionalization result
 */
export interface FractionalizationResult {
  success: boolean;
  fractionalTokenAddress?: string;
  txHash?: string;
  error?: string;
}

/**
 * Fractional token information
 */
export interface FractionalTokenInfo {
  name: string;
  symbol: string;
  totalSupply: string; // In base units (e.g., 1000000 tokens with 18 decimals = 1000000 * 10^18)
}

/**
 * Fractionalization parameters
 */
export interface FractionalizeParams {
  domainNftAddress: string;
  tokenId: string;
  tokenInfo: FractionalTokenInfo;
  minimumBuyoutPrice: string; // In USDC base units (6 decimals)
}

/**
 * Buyout parameters
 */
export interface BuyoutParams {
  domainNftAddress: string;
  tokenId: string;
}

/**
 * Exchange parameters
 */
export interface ExchangeParams {
  fractionalTokenAddress: string;
  amount: string; // In fractional token base units
}

// ABI for Doma Fractionalization Contract
// Based on the documentation, we need these main functions
const FRACTIONALIZATION_ABI = [
  // Fractionalize domain NFT
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      {
        name: "fractionalTokenInfo",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
        ],
      },
      { name: "minimumBuyoutPrice", type: "uint256" },
    ],
    name: "fractionalizeOwnershipToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Buy out domain NFT
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "buyoutOwnershipToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Exchange fractional tokens
  {
    inputs: [
      { name: "fractionalToken", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "exchangeFractionalToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Get buyout price
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getOwnershipTokenBuyoutPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenAddress", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "fractionalTokenAddress", type: "address" },
      {
        indexed: false,
        name: "fractionalTokenInfo",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
        ],
      },
      { indexed: false, name: "minimumBuyoutPrice", type: "uint256" },
      { indexed: false, name: "tokenizationVersion", type: "uint256" },
    ],
    name: "NameTokenFractionalized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenAddress", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "fractionalTokenAddress", type: "address" },
      { indexed: false, name: "buyoutPrice", type: "uint256" },
      { indexed: true, name: "newOwner", type: "address" },
      { indexed: false, name: "tokenizationVersion", type: "uint256" },
    ],
    name: "NameTokenBoughtOut",
    type: "event",
  },
];

/**
 * Singleton service for Doma Fractionalization operations
 */
class DomaFractionalizationService {
  private provider: BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: Contract | null = null;

  /**
   * Initialize the service with wallet provider
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new Contract(
      FRACTIONALIZATION_CONTRACT_ADDRESS,
      FRACTIONALIZATION_ABI,
      this.signer
    );
  }

  /**
   * Fractionalize a domain NFT into fungible tokens
   */
  async fractionalizeDomain(
    params: FractionalizeParams
  ): Promise<FractionalizationResult> {
    try {
      await this.initialize();

      if (!this.contract || !this.signer) {
        throw new Error("Contract not initialized");
      }

      console.log("Fractionalizing domain NFT...", {
        tokenId: params.tokenId,
        tokenInfo: params.tokenInfo,
        minimumBuyoutPrice: params.minimumBuyoutPrice,
      });

      // Call the fractionalization contract
      const tx: TransactionResponse =
        await this.contract.fractionalizeOwnershipToken(
          params.tokenId,
          {
            name: params.tokenInfo.name,
            symbol: params.tokenInfo.symbol,
          },
          params.minimumBuyoutPrice
        );

      console.log("Fractionalization transaction sent:", tx.hash);
      const receipt = await tx.wait();

      // Parse the event to get the fractional token address
      let fractionalTokenAddress: string | undefined;

      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = this.contract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });

            if (parsedLog && parsedLog.name === "NameTokenFractionalized") {
              fractionalTokenAddress = parsedLog.args.fractionalTokenAddress;
              console.log(
                "Fractional token created at:",
                fractionalTokenAddress
              );
              break;
            }
          } catch (e) {
            // Skip logs that don't match our interface
            continue;
          }
        }
      }

      return {
        success: true,
        fractionalTokenAddress,
        txHash: tx.hash,
      };
    } catch (error: any) {
      console.error("Error fractionalizing domain:", error);
      return {
        success: false,
        error: error.message || "Failed to fractionalize domain",
      };
    }
  }

  /**
   * Buy out a fractionalized domain NFT
   */
  async buyoutDomain(params: BuyoutParams): Promise<TransactionResponse> {
    await this.initialize();

    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    console.log("Buying out domain NFT...", params);

    const tx: TransactionResponse = await this.contract.buyoutOwnershipToken(
      params.tokenId
    );

    console.log("Buyout transaction sent:", tx.hash);
    return tx;
  }

  /**
   * Exchange fractional tokens for USDC after buyout
   */
  async exchangeFractionalTokens(
    params: ExchangeParams
  ): Promise<TransactionResponse> {
    await this.initialize();

    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    console.log("Exchanging fractional tokens...", params);

    const tx: TransactionResponse = await this.contract.exchangeFractionalToken(
      params.fractionalTokenAddress,
      params.amount
    );

    console.log("Exchange transaction sent:", tx.hash);
    return tx;
  }

  /**
   * Get the current buyout price for a domain NFT
   */
  async getBuyoutPrice(
    domainNftAddress: string,
    tokenId: string
  ): Promise<bigint> {
    await this.initialize();

    if (!this.contract) {
      throw new Error("Contract not initialized");
    }

    const price = await this.contract.getOwnershipTokenBuyoutPrice(tokenId);
    return price;
  }

  /**
   * Check if a domain NFT is fractionalized
   * This would require checking if a fractional token exists for the NFT
   */
  async isFractionalized(
    domainNftAddress: string,
    tokenId: string
  ): Promise<boolean> {
    try {
      // Try to get the buyout price - if it exists, the NFT is fractionalized
      const price = await this.getBuyoutPrice(domainNftAddress, tokenId);
      return price > BigInt(0);
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
let fractionalizationServiceInstance: DomaFractionalizationService | null =
  null;

export function getDomaFractionalizationService(): DomaFractionalizationService {
  if (!fractionalizationServiceInstance) {
    fractionalizationServiceInstance = new DomaFractionalizationService();
  }
  return fractionalizationServiceInstance;
}
