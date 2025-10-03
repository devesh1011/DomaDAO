/**
 * Utility to wrap ETH to WETH in the browser
 * This can be called from the browser console or from React components
 */

import { ethers } from "ethers";

const WETH_ADDRESS = "0x6f898cd313dcEe4D28A87F675BD93C471868B0Ac";
const WETH_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 wad)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

/**
 * Wrap ETH to WETH
 * @param amountETH Amount of ETH to wrap (in ETH units, e.g., "0.001")
 * @returns Transaction hash
 */
export async function wrapETH(amountETH: string): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);

  const amountWei = ethers.parseEther(amountETH);

  console.log(`🔄 Wrapping ${amountETH} ETH to WETH...`);
  const tx = await wethContract.deposit({ value: amountWei });

  console.log(`⏳ Transaction sent: ${tx.hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();

  console.log(`✅ Wrapped ${amountETH} ETH to WETH!`);
  console.log(`Transaction: ${receipt.hash}`);

  return receipt.hash;
}

/**
 * Get WETH balance for an address
 * @param address Address to check balance for
 * @returns Balance in ETH units
 */
export async function getWETHBalance(address: string): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, provider);

  const balance = await wethContract.balanceOf(address);
  return ethers.formatEther(balance);
}

/**
 * Approve WETH spending
 * @param spender Address to approve (Seaport conduit)
 * @param amount Amount to approve in ETH units
 * @returns Transaction hash
 */
export async function approveWETH(
  spender: string,
  amount: string
): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const wethContract = new ethers.Contract(WETH_ADDRESS, WETH_ABI, signer);
  const amountWei = ethers.parseEther(amount);

  console.log(`🔄 Approving ${amount} WETH for ${spender}...`);
  const tx = await wethContract.approve(spender, amountWei);

  console.log(`⏳ Transaction sent: ${tx.hash}`);
  const receipt = await tx.wait();

  console.log(`✅ Approved ${amount} WETH!`);
  return receipt.hash;
}

// Expose functions to window for console access
if (typeof window !== "undefined") {
  (window as any).wrapETH = wrapETH;
  (window as any).getWETHBalance = getWETHBalance;
  (window as any).approveWETH = approveWETH;
}
