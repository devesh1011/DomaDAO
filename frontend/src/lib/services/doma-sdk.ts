/**
 * Doma Orderbook SDK Service
 * Uses the official @doma-protocol/orderbook-sdk
 */

import {
  DomaOrderbookSDK,
  createDomaOrderbookClient,
  OrderbookType,
  type CreateOfferParams,
  type CreateOfferResult,
  type Caip2ChainId,
  type DomaOrderbookSDKConfig,
} from "@doma-protocol/orderbook-sdk";
import { BrowserProvider } from "ethers";
import { defineChain } from "viem";

const DOMA_CHAIN_ID: Caip2ChainId = "eip155:97476";

// Define Doma Testnet chain for viem
const domaTestnet = defineChain({
  id: 97476,
  name: "Doma Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Doma",
    symbol: "DOMA",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.doma.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Doma Testnet Explorer",
      url: "https://explorer-testnet.doma.xyz",
    },
  },
  testnet: true,
});

/**
 * Get or create the Doma Orderbook SDK client
 */
let sdkClient: DomaOrderbookSDK | null = null;

export function getDomaSDKClient(): DomaOrderbookSDK {
  if (!sdkClient) {
    const apiKey = process.env.NEXT_PUBLIC_DOMA_API_KEY;
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_DOMA_API_BASE_URL ||
      "https://api-testnet.doma.xyz";

    if (!apiKey) {
      throw new Error("DOMA API key not configured");
    }

    const config: DomaOrderbookSDKConfig = {
      source: "DomaDAO", // Your app name
      chains: [domaTestnet],
      apiClientOptions: {
        baseUrl: apiBaseUrl,
        defaultHeaders: {
          "Api-Key": apiKey,
        },
      },
    };

    sdkClient = createDomaOrderbookClient(config);
  }

  return sdkClient;
}

/**
 * Create a buy offer using the Doma SDK
 */
export async function createBuyOfferWithSDK(params: {
  nftContractAddress: string;
  tokenId: string;
  offerAmountUsdc: string; // Amount in payment token (e.g., "5" for 5 tokens)
  paymentTokenAddress: string; // Payment token contract address (USDC or WETH)
}): Promise<CreateOfferResult> {
  // Validate required parameters
  if (
    !params.nftContractAddress ||
    !params.nftContractAddress.startsWith("0x")
  ) {
    throw new Error("Invalid NFT contract address");
  }

  if (!params.tokenId) {
    throw new Error("Invalid token ID");
  }

  if (
    !params.paymentTokenAddress ||
    !params.paymentTokenAddress.startsWith("0x")
  ) {
    throw new Error(
      "Invalid payment token address. Please check your .env.local file for NEXT_PUBLIC_USDC_ADDRESS"
    );
  }

  if (!params.offerAmountUsdc || parseFloat(params.offerAmountUsdc) <= 0) {
    throw new Error("Invalid offer amount");
  }

  // Determine decimals based on token address
  const USDC_ADDRESS = "0x2f3463756C59387D6Cd55b034100caf7ECfc757b";
  const WETH_ADDRESS = "0x6f898cd313dcEe4D28A87F675BD93C471868B0Ac";

  let decimals = 6; // Default USDC
  let tokenName = "USDC";

  if (params.paymentTokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
    decimals = 18;
    tokenName = "WETH";
  } else if (
    params.paymentTokenAddress.toLowerCase() === USDC_ADDRESS.toLowerCase()
  ) {
    decimals = 6;
    tokenName = "USDC";
  } else {
    // Unknown token, try to detect
    console.warn("Unknown payment token, assuming 18 decimals");
    decimals = 18;
    tokenName = "UNKNOWN";
  }

  console.log("Validated parameters:", {
    nftContract: params.nftContractAddress,
    tokenId: params.tokenId.substring(0, 20) + "...",
    offerAmount: params.offerAmountUsdc,
    paymentToken: params.paymentTokenAddress,
    tokenName,
    decimals,
  });

  // Get the SDK client
  const sdk = getDomaSDKClient();

  // First, check what currencies are supported
  try {
    console.log("Fetching supported currencies...");
    const currencies = await sdk.getSupportedCurrencies({
      chainId: DOMA_CHAIN_ID,
      contractAddress: params.nftContractAddress,
      orderbook: OrderbookType.DOMA,
    });
    console.log("Supported currencies:", currencies);

    // Check if our USDC is in the list
    const usdcSupported = currencies.currencies?.find(
      (c: any) =>
        c.contractAddress?.toLowerCase() ===
        params.paymentTokenAddress.toLowerCase()
    );

    if (!usdcSupported) {
      console.warn(
        "USDC not in supported currencies list. Available currencies:",
        currencies.currencies
      );
      // Try to find any supported currency
      if (currencies.currencies && currencies.currencies.length > 0) {
        console.log("First supported currency:", currencies.currencies[0]);
      }
    } else {
      console.log("✅ USDC is supported:", usdcSupported);
    }
  } catch (currencyError) {
    console.error("Error fetching supported currencies:", currencyError);
  }

  // Get ethers provider and signer
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Convert amount to wei based on token decimals
  const offerAmountWei = (
    parseFloat(params.offerAmountUsdc) * Math.pow(10, decimals)
  ).toString();

  console.log("Amount conversion:", {
    inputAmount: params.offerAmountUsdc,
    decimals,
    amountWei: offerAmountWei,
  });

  // Prepare offer parameters
  const offerParams: CreateOfferParams = {
    items: [
      {
        contract: params.nftContractAddress,
        tokenId: params.tokenId,
        price: offerAmountWei,
        currencyContractAddress: params.paymentTokenAddress,
        duration: 7 * 24 * 60 * 60, // 7 days in seconds
      },
    ],
    source: await signer.getAddress(), // Offerer address
    orderbook: OrderbookType.DOMA,
    cancelExisting: false, // Don't cancel existing offers
  };

  console.log("Creating offer with SDK:", {
    nftContract: params.nftContractAddress,
    tokenId: params.tokenId,
    price: offerAmountWei,
    currency: params.paymentTokenAddress,
    offerer: offerParams.source,
  });

  // Track progress
  const progressSteps: string[] = [];
  const onProgress = (steps: any[]) => {
    steps.forEach((step) => {
      const message = `[${step.kind}] ${step.action}: ${step.status}`;
      progressSteps.push(message);
      console.log("SDK Progress:", message);
      if (step.error) {
        console.error("SDK Error:", step.error);
      }
    });
  };

  // Create the offer using the SDK
  const result = await sdk.createOffer({
    params: offerParams,
    signer,
    chainId: DOMA_CHAIN_ID,
    onProgress,
  });

  console.log("Offer creation result:", result);

  if (result.errors && result.errors.length > 0) {
    console.error("Offer creation errors:", result.errors);
    throw new Error(result.errors[0].error);
  }

  return result;
}

/**
 * Get orderbook fees for a specific NFT contract
 */
export async function getOrderbookFeesWithSDK(params: {
  nftContractAddress: string;
  orderbook?: OrderbookType;
}) {
  const sdk = getDomaSDKClient();

  const result = await sdk.getOrderbookFee({
    orderbook: params.orderbook || OrderbookType.DOMA,
    chainId: DOMA_CHAIN_ID,
    contractAddress: params.nftContractAddress,
  });

  console.log("Orderbook fees:", result);
  return result;
}

/**
 * Get supported currencies for offers/listings
 */
export async function getSupportedCurrenciesWithSDK(params: {
  nftContractAddress: string;
  orderbook?: OrderbookType;
}) {
  const sdk = getDomaSDKClient();

  const result = await sdk.getSupportedCurrencies({
    chainId: DOMA_CHAIN_ID,
    contractAddress: params.nftContractAddress,
    orderbook: params.orderbook || OrderbookType.DOMA,
  });

  console.log("Supported currencies:", result);
  return result;
}

/**
 * Wrap ETH to WETH on Doma Testnet
 */
export async function wrapETH(amountInEth: string): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  const { BrowserProvider, Contract, parseEther } = await import("ethers");
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const WETH_ADDRESS = "0x6f898cd313dcEe4D28A87F675BD93C471868B0Ac";
  const WETH_ABI = [
    "function deposit() payable",
    "function balanceOf(address) view returns (uint256)",
  ];

  const wethContract = new Contract(WETH_ADDRESS, WETH_ABI, signer);

  const amountWei = parseEther(amountInEth);

  console.log(`Wrapping ${amountInEth} ETH to WETH...`);

  const tx = await wethContract.deposit({ value: amountWei });
  console.log("Wrap transaction sent:", tx.hash);

  await tx.wait();
  console.log("✅ ETH wrapped to WETH successfully!");

  return tx.hash;
}

/**
 * Check WETH balance
 */
export async function getWETHBalance(walletAddress: string): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  const { BrowserProvider, Contract, formatEther } = await import("ethers");
  const provider = new BrowserProvider(window.ethereum);

  const WETH_ADDRESS = "0x6f898cd313dcEe4D28A87F675BD93C471868B0Ac";
  const WETH_ABI = ["function balanceOf(address) view returns (uint256)"];

  const wethContract = new Contract(WETH_ADDRESS, WETH_ABI, provider);

  const balance = await wethContract.balanceOf(walletAddress);
  const balanceFormatted = formatEther(balance);

  console.log(`WETH Balance: ${balanceFormatted} WETH`);

  return balanceFormatted;
}
