/**
 * Doma Orderbook API Integration
 * Handles domain marketplace operations (listings, offers, purchases)
 */

const DOMA_API_BASE_URL =
  process.env.NEXT_PUBLIC_DOMA_API_BASE_URL || "https://api-testnet.doma.xyz";
const DOMA_API_KEY = process.env.NEXT_PUBLIC_DOMA_API_KEY || "";
const DOMA_CHAIN_ID = "eip155:97476"; // Doma Testnet in CAIP-2 format

/**
 * Order component structure for Seaport protocol
 */
export interface OrderComponents {
  offerer: string;
  zone: string;
  orderType: number; // 0=Full Open, 1=Partial Open, 2=Full Restricted, 3=Partial Restricted
  startTime: string;
  endTime: string;
  zoneHash: string;
  salt: string;
  offer: OfferItem[];
  consideration: ConsiderationItem[];
  totalOriginalConsiderationItems: number;
  conduitKey: string;
  counter: string;
}

export interface OfferItem {
  itemType: number; // 0=ETH, 1=ERC20, 2=ERC721, 3=ERC1155
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
}

export interface ConsiderationItem {
  itemType: number;
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
  recipient: string;
}

export interface CreateOfferRequest {
  orderbook: string;
  chainId: string;
  parameters: OrderComponents;
  signature: string;
}

export interface CreateOfferResponse {
  orderId: string;
}

export interface GetOfferResponse {
  parameters: OrderComponents;
  signature: string;
}

export interface MarketplaceFee {
  recipient: string;
  amount: string;
}

export interface GetOrderbookFeeResponse {
  marketplaceFees: MarketplaceFee[];
}

export interface Currency {
  address: string;
  decimals: number;
  symbol: string;
}

export interface CurrenciesResponse {
  currencies: Currency[];
}

/**
 * Doma Orderbook Service
 */
export class DomaOrderbookService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || DOMA_API_KEY;
    this.baseUrl = baseUrl || DOMA_API_BASE_URL;
  }

  /**
   * Get marketplace fees for a specific orderbook and chain
   */
  async getOrderbookFees(
    orderbook: string,
    contractAddress: string,
    chainId: string = DOMA_CHAIN_ID
  ): Promise<GetOrderbookFeeResponse> {
    // Ensure orderbook value is uppercase (DOMA, OPENSEA)
    const orderbookUpper = orderbook.toUpperCase();
    const url = `${this.baseUrl}/v1/orderbook/fee/${orderbookUpper}/${chainId}/${contractAddress}`;

    console.log("Fetching orderbook fees:", {
      orderbook: orderbookUpper,
      chainId,
      contractAddress,
      url,
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to get orderbook fees:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      throw new Error(`Failed to get orderbook fees: ${error}`);
    }

    const data = await response.json();
    console.log("Orderbook fees response:", data);
    console.log("Marketplace fees details:", {
      fees: data.marketplaceFees,
      count: data.marketplaceFees?.length,
    });

    // Ensure marketplaceFees is an array, default to empty if null/undefined
    if (!data.marketplaceFees || !Array.isArray(data.marketplaceFees)) {
      console.warn("No marketplace fees returned, using empty array");
      return { marketplaceFees: [] };
    }

    return data;
  }

  /**
   * Get supported currencies for orderbook operations
   */
  async getSupportedCurrencies(
    contractAddress: string,
    orderbook: string,
    chainId: string = DOMA_CHAIN_ID
  ): Promise<CurrenciesResponse> {
    // Ensure orderbook value is uppercase (DOMA, OPENSEA)
    const orderbookUpper = orderbook.toUpperCase();
    const url = `${this.baseUrl}/v1/orderbook/currencies/${chainId}/${contractAddress}/${orderbookUpper}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get supported currencies: ${error}`);
    }

    return response.json();
  }

  /**
   * Create an offer to buy a domain
   */
  async createOffer(request: CreateOfferRequest): Promise<CreateOfferResponse> {
    const url = `${this.baseUrl}/v1/orderbook/offer`;

    // Ensure orderbook value is uppercase
    const normalizedRequest = {
      ...request,
      orderbook: request.orderbook.toUpperCase(),
    };

    console.log("Sending create offer request:", {
      url,
      orderbook: normalizedRequest.orderbook,
      chainId: normalizedRequest.chainId,
      offerer: normalizedRequest.parameters.offerer,
      hasSignature: !!normalizedRequest.signature,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Create offer failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      let errorMessage = `Failed to create offer (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get offer fulfillment data by order ID and fulfiller address
   */
  async getOfferById(
    orderId: string,
    fulfiller: string
  ): Promise<GetOfferResponse> {
    const url = `${this.baseUrl}/v1/orderbook/offer/${orderId}/${fulfiller}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get offer: ${error}`);
    }

    return response.json();
  }

  /**
   * Get listing fulfillment data by order ID and buyer address
   */
  async getListingById(
    orderId: string,
    buyer: string
  ): Promise<GetOfferResponse> {
    const url = `${this.baseUrl}/v1/orderbook/listing/${orderId}/${buyer}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get listing: ${error}`);
    }

    return response.json();
  }

  /**
   * Cancel an offer
   */
  async cancelOffer(
    orderId: string,
    signature: string
  ): Promise<{ orderId: string }> {
    const url = `${this.baseUrl}/v1/orderbook/offer/cancel`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId, signature }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to cancel offer: ${error}`);
    }

    return response.json();
  }
}

/**
 * Get singleton instance of orderbook service
 */
let orderbookServiceInstance: DomaOrderbookService | null = null;

export function getDomaOrderbookService(): DomaOrderbookService {
  if (!orderbookServiceInstance) {
    orderbookServiceInstance = new DomaOrderbookService();
  }
  return orderbookServiceInstance;
}

/**
 * Helper to build offer parameters for buying a domain
 */
export function buildBuyOfferParams(
  offererAddress: string, // The connected wallet address (buyer)
  domainNftAddress: string,
  tokenId: string,
  paymentTokenAddress: string,
  offerAmount: string,
  fees: MarketplaceFee[],
  counter: string = "0",
  recipientAddress?: string // Optional: where NFT should go (defaults to offerer)
): OrderComponents {
  const now = Math.floor(Date.now() / 1000);
  const oneWeekLater = now + 7 * 24 * 60 * 60;

  // NFT recipient defaults to the offerer if not specified
  const nftRecipient = recipientAddress || offererAddress;

  // Validate and filter fees to remove any null/undefined values
  const validFees = (fees || []).filter(
    (fee) =>
      fee &&
      fee.recipient &&
      fee.amount !== null &&
      fee.amount !== undefined &&
      fee.amount !== ""
  );

  console.log("Building offer with validated fees:", {
    originalFeesCount: fees?.length || 0,
    validFeesCount: validFees.length,
    validFees,
  });

  // Offer: USDC from buyer
  const offer: OfferItem[] = [
    {
      itemType: 1, // ERC20
      token: paymentTokenAddress,
      identifierOrCriteria: "0",
      startAmount: offerAmount,
      endAmount: offerAmount,
    },
  ];

  // Consideration: NFT to buyer + fees
  const consideration: ConsiderationItem[] = [
    // NFT to buyer (or specified recipient)
    {
      itemType: 2, // ERC721
      token: domainNftAddress,
      identifierOrCriteria: tokenId,
      startAmount: "1",
      endAmount: "1",
      recipient: nftRecipient,
    },
    // Add marketplace fees (only valid ones)
    ...validFees.map((fee) => ({
      itemType: 1, // ERC20
      token: paymentTokenAddress,
      identifierOrCriteria: "0",
      startAmount: fee.amount,
      endAmount: fee.amount,
      recipient: fee.recipient,
    })),
  ];

  return {
    offerer: offererAddress, // THIS IS THE KEY FIX - use offererAddress not poolAddress
    zone: "0x0000000000000000000000000000000000000000",
    orderType: 2, // FULL_RESTRICTED (required by Doma Orderbook API)
    startTime: now.toString(),
    endTime: oneWeekLater.toString(),
    zoneHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    salt: Math.floor(Math.random() * 1000000000).toString(),
    offer,
    consideration,
    totalOriginalConsiderationItems: consideration.length,
    conduitKey:
      "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
    counter,
  };
}
