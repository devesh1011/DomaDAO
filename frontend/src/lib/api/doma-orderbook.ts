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

    return response.json();
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

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create offer: ${error}`);
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
  poolAddress: string,
  domainNftAddress: string,
  tokenId: string,
  paymentTokenAddress: string,
  offerAmount: string,
  fees: MarketplaceFee[]
): OrderComponents {
  const now = Math.floor(Date.now() / 1000);
  const oneWeekLater = now + 7 * 24 * 60 * 60;

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
    // NFT to buyer (pool)
    {
      itemType: 2, // ERC721
      token: domainNftAddress,
      identifierOrCriteria: tokenId,
      startAmount: "1",
      endAmount: "1",
      recipient: poolAddress,
    },
    // Add marketplace fees
    ...fees.map((fee) => ({
      itemType: 1, // ERC20
      token: paymentTokenAddress,
      identifierOrCriteria: "0",
      startAmount: fee.amount,
      endAmount: fee.amount,
      recipient: fee.recipient,
    })),
  ];

  return {
    offerer: poolAddress,
    zone: "0x0000000000000000000000000000000000000000",
    orderType: 0, // Full Open
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
    counter: "0",
  };
}
