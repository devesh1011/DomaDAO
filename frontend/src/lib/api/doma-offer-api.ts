/**
 * Direct Doma Orderbook API integration for creating offers
 * This bypasses the SDK and directly calls the Doma API
 */

import { ethers, TypedDataDomain, TypedDataField } from "ethers";

const DOMA_API_BASE_URL = "https://api-testnet.doma.xyz";
const DOMA_CHAIN_ID = "eip155:97476";
const SEAPORT_ADDRESS = "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC"; // Seaport 1.5
const CONDUIT_KEY =
  "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000"; // Doma conduit key

// Seaport EIP-712 Types
const EIP712_DOMAIN = {
  name: "Seaport",
  version: "1.5",
  chainId: 97476,
  verifyingContract: SEAPORT_ADDRESS,
};

const ORDER_COMPONENTS_TYPES = {
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

// Seaport Item Types
enum ItemType {
  NATIVE = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
  ERC721_WITH_CRITERIA = 4,
  ERC1155_WITH_CRITERIA = 5,
}

// Seaport Order Types
enum OrderType {
  FULL_OPEN = 0,
  PARTIAL_OPEN = 1,
  FULL_RESTRICTED = 2,
  PARTIAL_RESTRICTED = 3,
  CONTRACT = 4,
}

interface CreateOfferParams {
  nftContract: string;
  tokenId: string;
  paymentToken: string; // ERC20 token address (WETH/USDC)
  offerAmount: string; // In token units (e.g., "0.001" for 0.001 WETH)
  offererAddress: string; // Who is making the offer
  duration?: number; // Duration in seconds (default: 7 days)
}

/**
 * Build a Seaport buy offer order
 */
function buildSeaportBuyOffer(params: CreateOfferParams) {
  const now = Math.floor(Date.now() / 1000);
  const duration = params.duration || 7 * 24 * 60 * 60; // 7 days default
  const endTime = now + duration;

  // Generate random salt
  const salt = ethers.hexlify(ethers.randomBytes(32));

  // Determine decimals based on token
  const WETH_ADDRESS = "0x6f898cd313dcEe4D28A87F675BD93C471868B0Ac";
  const USDC_ADDRESS = "0x2f3463756C59387D6Cd55b034100caf7ECfc757b";

  let decimals = 18;
  if (params.paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
    decimals = 6;
  }

  // Convert amount to wei/smallest unit
  const amount = ethers.parseUnits(params.offerAmount, decimals).toString();

  // Offer: What the offerer is giving (ERC20 tokens)
  const offer = [
    {
      itemType: ItemType.ERC20,
      token: params.paymentToken,
      identifierOrCriteria: "0",
      startAmount: amount,
      endAmount: amount,
    },
  ];

  // Consideration: What the offerer wants to receive (NFT)
  const consideration = [
    {
      itemType: ItemType.ERC721,
      token: params.nftContract,
      identifierOrCriteria: params.tokenId,
      startAmount: "1",
      endAmount: "1",
      recipient: params.offererAddress,
    },
  ];

  return {
    offerer: params.offererAddress,
    zone: ethers.ZeroAddress, // No zone for FULL_RESTRICTED
    offer,
    consideration,
    orderType: OrderType.FULL_RESTRICTED, // DOMA requires FULL_RESTRICTED (2) for offers
    startTime: now.toString(),
    endTime: endTime.toString(),
    zoneHash: ethers.ZeroHash,
    salt,
    conduitKey: CONDUIT_KEY,
    totalOriginalConsiderationItems: consideration.length,
  };
}

/**
 * Sign a Seaport order using EIP-712
 */
async function signSeaportOrder(
  order: any,
  signer: ethers.Signer
): Promise<string> {
  // Get counter from signer's nonce
  const counter = 0; // Start with 0, Seaport will handle incrementing

  const orderComponents = {
    offerer: order.offerer,
    zone: order.zone,
    offer: order.offer,
    consideration: order.consideration,
    orderType: order.orderType,
    startTime: order.startTime,
    endTime: order.endTime,
    zoneHash: order.zoneHash,
    salt: order.salt,
    conduitKey: order.conduitKey,
    counter: counter.toString(),
  };

  console.log("🔏 Signing order with EIP-712...");
  console.log("Domain:", EIP712_DOMAIN);
  console.log("Order Components:", orderComponents);

  // Verify signer address before signing
  const signerAddress = await signer.getAddress();
  console.log("🔑 About to sign with address:", signerAddress);

  if (signerAddress.toLowerCase() !== order.offerer.toLowerCase()) {
    throw new Error(
      `Signer address ${signerAddress} does not match order offerer ${order.offerer}. Please check your MetaMask account.`
    );
  }

  // Sign using EIP-712
  const signature = await signer.signTypedData(
    EIP712_DOMAIN,
    ORDER_COMPONENTS_TYPES,
    orderComponents
  );

  console.log("✅ Signature generated:", signature);

  // Verify the signature was created by the correct address
  const recoveredAddress = ethers.verifyTypedData(
    EIP712_DOMAIN,
    ORDER_COMPONENTS_TYPES,
    orderComponents,
    signature
  );
  console.log("🔍 Signature recovered address:", recoveredAddress);

  if (recoveredAddress.toLowerCase() !== order.offerer.toLowerCase()) {
    throw new Error(
      `Signature verification failed locally. Expected ${order.offerer}, got ${recoveredAddress}. MetaMask may have switched accounts.`
    );
  }

  return signature;
}

/**
 * Create a buy offer directly via Doma API
 */
export async function createBuyOfferViaAPI(
  params: CreateOfferParams
): Promise<any> {
  console.log("📝 Creating buy offer via Doma API...");
  console.log("Parameters:", params);

  // Validate parameters
  if (!params.nftContract || !params.nftContract.startsWith("0x")) {
    throw new Error("Invalid NFT contract address");
  }
  if (!params.tokenId) {
    throw new Error("Invalid token ID");
  }
  if (!params.paymentToken || !params.paymentToken.startsWith("0x")) {
    throw new Error("Invalid payment token address");
  }
  if (!params.offerAmount || parseFloat(params.offerAmount) <= 0) {
    throw new Error("Invalid offer amount");
  }
  if (!params.offererAddress || !params.offererAddress.startsWith("0x")) {
    throw new Error("Invalid offerer address");
  }

  // Get signer
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // CRITICAL: Use the signer's actual address, not the passed parameter
  const signerAddress = await signer.getAddress();
  console.log("🔑 Signer address from MetaMask:", signerAddress);
  console.log("📝 Offerer address from params:", params.offererAddress);

  if (signerAddress.toLowerCase() !== params.offererAddress.toLowerCase()) {
    console.warn("⚠️ Warning: Signer address doesn't match offerer address!");
    console.warn(
      `Using signer address: ${signerAddress} instead of ${params.offererAddress}`
    );
  }

  // Override the offerer address with the actual signer address
  const updatedParams = {
    ...params,
    offererAddress: signerAddress, // Use the actual signing address
  };

  // Build Seaport order with the correct signer address
  const order = buildSeaportBuyOffer(updatedParams);
  console.log("📋 Built Seaport order:", order);

  // Sign the order
  const signature = await signSeaportOrder(order, signer);

  // Prepare API request
  const apiKey = process.env.NEXT_PUBLIC_DOMA_API_KEY;
  if (!apiKey) {
    throw new Error("DOMA API key not configured");
  }

  const requestBody = {
    orderbook: "DOMA",
    chainId: DOMA_CHAIN_ID,
    parameters: {
      ...order,
      counter: "0", // Include counter in parameters
    },
    signature,
  };

  console.log("🚀 Sending request to Doma API...");
  console.log("Request body:", JSON.stringify(requestBody, null, 2));

  // Call Doma API
  const response = await fetch(`${DOMA_API_BASE_URL}/v1/orderbook/offer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      Accept: "*/*",
    },
    body: JSON.stringify(requestBody),
  });

  console.log("📡 Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ API Error:", errorText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Offer created successfully:", result);

  return result;
}

/**
 * Check if user has sufficient token balance and allowance
 */
export async function checkTokenBalanceAndAllowance(
  tokenAddress: string,
  userAddress: string,
  requiredAmount: string
): Promise<{
  hasBalance: boolean;
  hasAllowance: boolean;
  balance: string;
  allowance: string;
}> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  // Seaport's conduit for token transfers
  const SEAPORT_CONDUIT = "0x1E0049783F008A0085193E00003D00cd54003c71"; // Doma's conduit

  const [balance, allowance, decimals] = await Promise.all([
    tokenContract.balanceOf(userAddress),
    tokenContract.allowance(userAddress, SEAPORT_CONDUIT),
    tokenContract.decimals(),
  ]);

  const required = ethers.parseUnits(requiredAmount, decimals);

  return {
    hasBalance: balance >= required,
    hasAllowance: allowance >= required,
    balance: ethers.formatUnits(balance, decimals),
    allowance: ethers.formatUnits(allowance, decimals),
  };
}

/**
 * Approve token spending for Seaport
 */
export async function approveTokenForSeaport(
  tokenAddress: string,
  amount: string
): Promise<string> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
  ];

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

  // Seaport's conduit for token transfers
  const SEAPORT_CONDUIT = "0x1E0049783F008A0085193E00003D00cd54003c71";

  const decimals = await tokenContract.decimals();
  const amountWei = ethers.parseUnits(amount, decimals);

  console.log(`🔓 Approving ${amount} tokens for Seaport...`);

  const tx = await tokenContract.approve(SEAPORT_CONDUIT, amountWei);
  console.log("⏳ Approval transaction sent:", tx.hash);

  await tx.wait();
  console.log("✅ Token approval successful!");

  return tx.hash;
}
