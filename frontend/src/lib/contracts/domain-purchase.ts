/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Domain Purchase Service
 * Handles the complete flow of purchasing a domain via Doma Orderbook
 */

import { BrowserProvider, Contract, TransactionResponse } from "ethers";
import {
  getDomaOrderbookService,
  buildBuyOfferParams,
  type CreateOfferRequest,
  type MarketplaceFee,
} from "@/lib/api/doma-orderbook";
import FractionPoolABI from "@/contracts/FractionPool.json";

const DOMA_CHAIN_ID = "eip155:97476";
const SEAPORT_ADDRESS = "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC"; // Seaport 1.5 on Doma Testnet

/**
 * Domain purchase parameters
 */
export interface PurchaseDomainParams {
  poolAddress: string;
  domainNftAddress: string;
  tokenId: string;
  listingOrderId?: string; // If buying from an existing listing
  offerAmount: string; // Amount in USDC (with 6 decimals)
  paymentTokenAddress: string; // USDC address
}

/**
 * Purchase result
 */
export interface PurchaseResult {
  success: boolean;
  orderId?: string;
  txHash?: string;
  error?: string;
}

/**
 * Domain Purchase Service
 */
export class DomainPurchaseService {
  private provider: BrowserProvider | null = null;
  private signer: any = null;

  constructor() {}

  /**
   * Initialize with MetaMask provider
   */
  async initialize(): Promise<void> {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
  }

  /**
   * Purchase a domain from a listing
   * This is the simpler flow - buying from an existing listing
   */
  async purchaseFromListing(
    params: PurchaseDomainParams
  ): Promise<PurchaseResult> {
    try {
      await this.initialize();

      if (!params.listingOrderId) {
        throw new Error("Listing order ID is required");
      }

      const orderbookService = getDomaOrderbookService();

      // Get listing fulfillment data
      const listing = await orderbookService.getListingById(
        params.listingOrderId,
        params.poolAddress
      );

      // TODO: Implement Seaport fulfillment
      // This requires interacting with the Seaport contract directly
      // For MVP, we'll focus on the offer flow instead

      return {
        success: false,
        error: "Listing purchase not yet implemented - use offer flow instead",
      };
    } catch (error: any) {
      console.error("Error purchasing from listing:", error);
      return {
        success: false,
        error: error.message || "Failed to purchase from listing",
      };
    }
  }

  /**
   * Create an offer to buy a domain
   * This creates an offer that the seller can accept
   */
  async createBuyOffer(params: PurchaseDomainParams): Promise<PurchaseResult> {
    try {
      await this.initialize();

      if (!this.signer) {
        throw new Error("Signer not initialized");
      }

      const orderbookService = getDomaOrderbookService();

      // 1. Get marketplace fees
      console.log("Fetching marketplace fees...");
      const fees = await orderbookService.getOrderbookFees(
        "doma",
        params.domainNftAddress,
        DOMA_CHAIN_ID
      );

      // 2. Build order parameters
      console.log("Building offer parameters...");
      const orderParams = buildBuyOfferParams(
        params.poolAddress,
        params.domainNftAddress,
        params.tokenId,
        params.paymentTokenAddress,
        params.offerAmount,
        fees.marketplaceFees
      );

      // 3. Sign the order using EIP-712
      console.log("Signing order...");
      const signature = await this.signOrder(orderParams);

      // 4. Submit offer to Doma Orderbook API
      console.log("Submitting offer to orderbook...");
      const request: CreateOfferRequest = {
        orderbook: "doma",
        chainId: DOMA_CHAIN_ID,
        parameters: orderParams,
        signature,
      };

      const response = await orderbookService.createOffer(request);

      console.log("Offer created successfully:", response.orderId);

      return {
        success: true,
        orderId: response.orderId,
      };
    } catch (error: any) {
      console.error("Error creating buy offer:", error);
      return {
        success: false,
        error: error.message || "Failed to create buy offer",
      };
    }
  }

  /**
   * Record domain purchase in FractionPool contract
   * Called after the domain NFT is transferred to the pool
   */
  async recordPurchase(
    poolAddress: string,
    domainNftAddress: string,
    tokenId: string,
    txHash: string
  ): Promise<TransactionResponse> {
    await this.initialize();

    if (!this.signer) {
      throw new Error("Signer not initialized");
    }

    const poolContract = new Contract(
      poolAddress,
      FractionPoolABI.abi,
      this.signer
    );

    // Convert txHash to bytes32 format
    const txHashBytes32 = txHash.startsWith("0x") ? txHash : `0x${txHash}`;

    const tx = await poolContract.recordDomainPurchase(
      domainNftAddress,
      tokenId,
      txHashBytes32
    );

    return tx;
  }

  /**
   * Sign order using EIP-712
   * This creates the signature required by the Seaport protocol
   */
  private async signOrder(orderParams: any): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer not initialized");
    }

    // EIP-712 domain for Seaport on Doma Testnet
    const domain = {
      name: "Seaport",
      version: "1.5",
      chainId: 97476, // Doma Testnet
      verifyingContract: SEAPORT_ADDRESS,
    };

    // EIP-712 types for OrderComponents
    const types = {
      OrderComponents: [
        { name: "offerer", type: "address" },
        { name: "zone", type: "address" },
        { name: "offer", type: "OfferItem[]" },
        { name: "consideration", type: "ConsiderationItem[]" },
        { name: "orderType", type: "uint8" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "zoneHash", type: "bytes32" },
        { name: "salt", type: "uint256" },
        { name: "conduitKey", type: "bytes32" },
        { name: "counter", type: "uint256" },
      ],
      OfferItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
      ],
      ConsiderationItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
        { name: "recipient", type: "address" },
      ],
    };

    // Sign the typed data
    const signature = await this.signer.signTypedData(
      domain,
      types,
      orderParams
    );

    return signature;
  }

  /**
   * Check if a domain NFT is owned by the pool
   */
  async checkNftOwnership(
    nftAddress: string,
    tokenId: string,
    poolAddress: string
  ): Promise<boolean> {
    await this.initialize();

    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    const nftAbi = ["function ownerOf(uint256 tokenId) view returns (address)"];

    const nftContract = new Contract(nftAddress, nftAbi, this.provider);
    const owner = await nftContract.ownerOf(tokenId);

    return owner.toLowerCase() === poolAddress.toLowerCase();
  }
}

/**
 * Get singleton instance
 */
let purchaseServiceInstance: DomainPurchaseService | null = null;

export function getDomainPurchaseService(): DomainPurchaseService {
  if (!purchaseServiceInstance) {
    purchaseServiceInstance = new DomainPurchaseService();
  }
  return purchaseServiceInstance;
}

/**
 * Helper to calculate total offer amount including fees
 */
export function calculateTotalOfferAmount(
  baseAmount: string,
  fees: MarketplaceFee[]
): string {
  let total = BigInt(baseAmount);

  for (const fee of fees) {
    total += BigInt(fee.amount);
  }

  return total.toString();
}
