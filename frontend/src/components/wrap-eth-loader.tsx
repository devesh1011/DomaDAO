"use client";

import { useEffect } from "react";

/**
 * Component that loads wrap-eth utilities and API functions into the browser window
 * This makes wrapETH, getWETHBalance, and createBuyOfferViaAPI available in the console
 */
export function WrapETHLoader() {
  useEffect(() => {
    // Import and expose the utilities
    Promise.all([
      import("@/lib/utils/wrap-eth"),
      import("@/lib/api/doma-offer-api"),
    ]).then(([wethModule, apiModule]) => {
      if (typeof window !== "undefined") {
        // WETH utilities
        (window as any).wrapETH = wethModule.wrapETH;
        (window as any).getWETHBalance = wethModule.getWETHBalance;
        (window as any).approveWETH = wethModule.approveWETH;

        // Doma API utilities
        (window as any).createBuyOfferViaAPI = apiModule.createBuyOfferViaAPI;
        (window as any).checkTokenBalanceAndAllowance =
          apiModule.checkTokenBalanceAndAllowance;
        (window as any).approveTokenForSeaport =
          apiModule.approveTokenForSeaport;

        console.log("✅ WETH & Doma API utilities loaded!");
        console.log("Available commands:");
        console.log("");
        console.log("📦 WETH Functions:");
        console.log('  wrapETH("0.001") - Wrap 0.001 ETH to WETH');
        console.log('  getWETHBalance("0x...") - Check WETH balance');
        console.log('  approveWETH("0x...", "0.001") - Approve WETH spending');
        console.log("");
        console.log("🛒 Doma Offer API Functions:");
        console.log(
          "  createBuyOfferViaAPI({nftContract, tokenId, paymentToken, offerAmount, offererAddress}) - Create buy offer"
        );
        console.log(
          "  checkTokenBalanceAndAllowance(tokenAddress, userAddress, amount) - Check balance & allowance"
        );
        console.log(
          "  approveTokenForSeaport(tokenAddress, amount) - Approve tokens for Seaport"
        );
      }
    });
  }, []);

  return null;
}
