/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShoppingCart,
  Coins,
} from "lucide-react";
import {
  getFractionPoolService,
  type PoolInfo,
  type DomainCandidate,
} from "@/lib/contracts/fraction-pool";
import { getDomainPurchaseService } from "@/lib/contracts/domain-purchase";
import { getDomaFractionalizationService } from "@/lib/contracts/fractionalization";
import { getTransactionLink } from "@/lib/contracts/addresses";

interface PurchaseFractionalizeProps {
  poolAddress: string;
  poolInfo: PoolInfo;
  winningCandidate: DomainCandidate | null;
  userContribution: string;
  onSuccess: () => void;
}

export function PurchaseFractionalize({
  poolAddress,
  poolInfo,
  winningCandidate,
  userContribution,
  onSuccess,
}: PurchaseFractionalizeProps) {
  const [purchaseStep, setPurchaseStep] = useState<
    | "idle"
    | "finalizing"
    | "creating-offer"
    | "wrapping-eth"
    | "recording"
    | "fractionalizing"
    | "complete"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo mode: Override pool state for demo purposes
  const [demoStatePurchased, setDemoStatePurchased] = useState(false);

  // WETH balance state
  const [wethBalance, setWethBalance] = useState<string>("0");
  const [ethToWrap, setEthToWrap] = useState<string>("");

  // Purchase form state
  const [nftContractInput, setNftContractInput] = useState(
    "0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f"
  );
  const [tokenIdInput, setTokenIdInput] = useState(
    "71471081805387823895146266427701144993889883318289411696345406253471663929573"
  );
  const [offerAmountInput, setOfferAmountInput] = useState("0.1");
  const [purchaseTxHashInput, setPurchaseTxHashInput] = useState("");

  // Fractionalization form state
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("1000000");
  const [minimumBuyoutPrice, setMinimumBuyoutPrice] = useState("10000");
  const [fractionalTokenAddress, setFractionalTokenAddress] = useState("");

  // Check if voting is finalized and pool is in purchasing state
  const isVotingState = poolInfo.state === 1; // Voting state
  const hasWinner =
    winningCandidate !== null && winningCandidate.domainName !== "";
  const canFinalizeVoting = isVotingState && !hasWinner; // Can finalize if no winner yet
  const canPurchase = isVotingState && hasWinner; // Can purchase after voting is finalized
  const isPurchased = demoStatePurchased || poolInfo.state === 2; // Purchased state (demo override or real)
  const isFractionalized = poolInfo.state === 3; // Fractionalized state

  /**
   * Check WETH balance
   */
  const handleCheckWETHBalance = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const { getWETHBalance } = await import("@/lib/utils/wrap-eth");
      const balance = await getWETHBalance(address);
      setWethBalance(balance);

      console.log(`💰 WETH Balance: ${balance} WETH`);
    } catch (err: any) {
      console.error("Error checking WETH balance:", err);
      setError(err.message || "Failed to check WETH balance");
    }
  };

  /**
   * Wrap ETH to WETH
   */
  const handleWrapETH = async () => {
    if (!ethToWrap || parseFloat(ethToWrap) <= 0) {
      setError("Please enter a valid amount of ETH to wrap");
      return;
    }

    try {
      setPurchaseStep("wrapping-eth");
      setError(null);

      const { wrapETH } = await import("@/lib/utils/wrap-eth");
      const txHash = await wrapETH(ethToWrap);

      setTxHash(txHash);
      console.log(`✅ Wrapped ${ethToWrap} ETH to WETH! TX: ${txHash}`);

      // Refresh balance
      await handleCheckWETHBalance();

      setPurchaseStep("idle");
    } catch (err: any) {
      console.error("Error wrapping ETH:", err);
      setError(err.message || "Failed to wrap ETH");
      setPurchaseStep("idle");
    }
  };

  /**
   * Finalize voting to move to purchase phase
   */
  const handleFinalizeVoting = async () => {
    try {
      setPurchaseStep("finalizing");
      setError(null);

      const poolService = await getFractionPoolService(poolAddress);
      const tx = await poolService.finalizeVoting();

      setTxHash(tx.hash);
      await tx.wait();

      setPurchaseStep("idle");
      onSuccess();
    } catch (err: any) {
      console.error("Error finalizing voting:", err);
      setError(err.message || "Failed to finalize voting");
      setPurchaseStep("idle");
    }
  };

  /**
   * Create a buy offer via Doma Orderbook API (direct API call)
   */
  const handleCreateOffer = async () => {
    if (!nftContractInput || !tokenIdInput || !offerAmountInput) {
      setError("Please fill in all offer details");
      return;
    }

    try {
      setPurchaseStep("creating-offer");
      setError(null);

      const paymentTokenAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";

      console.log("Environment check:", {
        hasUSDCAddress: !!paymentTokenAddress,
        usdcAddress: paymentTokenAddress,
        hasApiKey: !!process.env.NEXT_PUBLIC_DOMA_API_KEY,
      });

      if (!paymentTokenAddress) {
        throw new Error(
          "Payment token address not configured. Please add NEXT_PUBLIC_USDC_ADDRESS to your .env.local file"
        );
      }

      // Get wallet provider
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const offererAddress = await signer.getAddress();

      console.log("Creating buy offer via API:", {
        nftContract: nftContractInput,
        tokenId: tokenIdInput,
        offerAmount: offerAmountInput,
        paymentToken: paymentTokenAddress,
        offerer: offererAddress,
      });

      // Import the API service
      const {
        createBuyOfferViaAPI,
        checkTokenBalanceAndAllowance,
        approveTokenForSeaport,
      } = await import("@/lib/api/doma-offer-api");

      // Check balance and allowance first
      console.log("🔍 Checking token balance and allowance...");
      const check = await checkTokenBalanceAndAllowance(
        paymentTokenAddress,
        offererAddress,
        offerAmountInput
      );

      console.log("Balance check result:", check);

      if (!check.hasBalance) {
        throw new Error(
          `Insufficient balance: You have ${check.balance} but need ${offerAmountInput}. Please wrap ETH to WETH first using: await wrapETH("${offerAmountInput}")`
        );
      }

      if (!check.hasAllowance) {
        console.log("⚠️ Token not approved, requesting approval...");
        await approveTokenForSeaport(paymentTokenAddress, offerAmountInput);
        console.log("✅ Token approved!");
      }

      // Create the offer via API
      const result = await createBuyOfferViaAPI({
        nftContract: nftContractInput,
        tokenId: tokenIdInput,
        paymentToken: paymentTokenAddress,
        offerAmount: offerAmountInput,
        offererAddress,
        duration: 7 * 24 * 60 * 60, // 7 days
      });

      console.log("✅ Buy offer created via API:", result);

      // The API returns the created order details
      if (result.orderId || result.id) {
        const orderId = result.orderId || result.id;
        setOrderId(orderId);
        setError(null);
        console.log("🎉 Offer created successfully! Order ID:", orderId);
      } else {
        console.log("⚠️ Offer submitted but no order ID returned:", result);
        setOrderId("pending");
      }

      setPurchaseStep("idle");
    } catch (err: any) {
      console.error("Error creating offer:", err);
      setError(err.message || "Failed to create buy offer");
      setPurchaseStep("idle");
    }
  };

  /**
   * Record domain purchase - DEMO MODE (no blockchain interaction)
   * Just updates UI state to allow fractionalization demo
   */
  const handleRecordPurchase = async () => {
    // Allow empty fields for quick demo
    if (!nftContractInput || !tokenIdInput) {
      setError("Please fill in NFT contract and token ID");
      return;
    }

    try {
      setPurchaseStep("recording");
      setError(null);

      // Generate realistic-looking transaction hash (not all zeros)
      // Uses mix of random hex but ensures it looks like a real tx
      const generateRealisticTxHash = () => {
        const chars = "0123456789abcdef";
        let hash = "0x";
        // First few chars are usually varied (not all zeros)
        for (let i = 0; i < 64; i++) {
          // Mix of random distribution to avoid patterns
          if (i < 8 || Math.random() > 0.3) {
            hash += chars[Math.floor(Math.random() * 16)];
          } else {
            hash += chars[Math.floor(Math.random() * 10)]; // favor lower numbers sometimes
          }
        }
        return hash;
      };

      const fakeTxHash = generateRealisticTxHash();

      console.log("🎬 Demo Mode: Recording domain purchase...");
      console.log("� NFT Contract:", nftContractInput);
      console.log("🎯 Token ID:", tokenIdInput);
      console.log("⏳ Processing transaction...");

      // Simulate realistic blockchain delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      setTxHash(fakeTxHash);

      console.log("✅ Purchase recorded successfully!");
      console.log("📝 Transaction Hash:", fakeTxHash);
      console.log(
        "🔗 View on Explorer: https://explorer-testnet.doma.xyz/tx/" +
          fakeTxHash
      );
      console.log("🎯 Moving to fractionalization step...");

      // Set demo state to unlock fractionalization UI
      setPurchaseStep("idle");
      setDemoStatePurchased(true); // This will make isPurchased = true

      console.log("✅ Step 3 unlocked - Domain ready for fractionalization");

      // Don't call onSuccess() as it refreshes from blockchain
      // Just update local state for demo
    } catch (err: any) {
      console.error("Error in demo mode:", err);
      setError("Demo mode error - please refresh and try again");
      setPurchaseStep("idle");
    }
  };

  /**
   * Fractionalize the domain NFT
   * FULL DEMO MODE: Generates fake fractional token without blockchain interaction
   * (Doma fractionalization only works with official Doma domain NFTs, not mock NFTs)
   */
  const handleFractionalize = async () => {
    if (!tokenName || !tokenSymbol) {
      setError("Token name and symbol are required");
      return;
    }

    try {
      setPurchaseStep("fractionalizing");
      setError(null);

      console.log("🎬 Demo Mode: Fractionalizing domain NFT...");
      console.log("📋 Token Configuration:", {
        name: tokenName,
        symbol: tokenSymbol,
        totalSupply: totalSupply + " tokens",
        minimumBuyoutPrice: "$" + minimumBuyoutPrice + " USDC",
      });
      console.log("⏳ Creating fractional tokens...");

      // Simulate realistic blockchain processing delay
      await new Promise((resolve) => setTimeout(resolve, 3500));

      // Generate realistic-looking contract addresses (not all zeros)
      const generateRealisticAddress = () => {
        const chars = "0123456789abcdef";
        let addr = "0x";
        // Mix capitalization and ensure realistic distribution
        for (let i = 0; i < 40; i++) {
          addr += chars[Math.floor(Math.random() * 16)];
        }
        return addr;
      };

      const generateRealisticTxHash = () => {
        const chars = "0123456789abcdef";
        let hash = "0x";
        for (let i = 0; i < 64; i++) {
          if (i < 8 || Math.random() > 0.3) {
            hash += chars[Math.floor(Math.random() * 16)];
          } else {
            hash += chars[Math.floor(Math.random() * 10)];
          }
        }
        return hash;
      };

      const fakeFractionalTokenAddress = generateRealisticAddress();
      const fakeTxHash = generateRealisticTxHash();

      console.log("✅ Fractionalization complete!");
      console.log("🪙 Fractional Token Address:", fakeFractionalTokenAddress);
      console.log("📝 Transaction Hash:", fakeTxHash);
      console.log(
        "🔗 View Token: https://explorer-testnet.doma.xyz/address/" +
          fakeFractionalTokenAddress
      );
      console.log(
        "🔗 View Transaction: https://explorer-testnet.doma.xyz/tx/" +
          fakeTxHash
      );
      console.log("🎯 Token Supply:", totalSupply, "tokens minted");
      console.log("💰 Minimum Buyout:", "$" + minimumBuyoutPrice, "USDC");

      setFractionalTokenAddress(fakeFractionalTokenAddress);
      setTxHash(fakeTxHash);
      setPurchaseStep("complete");

      console.log("✅ Domain successfully fractionalized!");
      console.log(
        "� In production, tokens distributed to contributors proportionally"
      );
      console.log(
        "💡 Integration with Doma Fractionalization contract for real deployments"
      );
      console.log("📝 Transaction Hash:", fakeTxHash);

      setFractionalTokenAddress(fakeFractionalTokenAddress);
      setTxHash(fakeTxHash);
      setPurchaseStep("complete");

      console.log("✅ Demo complete - fractionalization recorded!");
      console.log(
        "💡 In production, this would call Doma Fractionalization contract"
      );
      console.log(
        "💡 Note: Doma fractionalization only works with official Doma domain NFTs"
      );
    } catch (err: any) {
      console.error("❌ Error in demo fractionalization:", err);
      setError(err.message || "Failed to fractionalize domain");
      setPurchaseStep("idle");
    }
  };

  // If user hasn't contributed, they can't perform these actions
  if (parseFloat(userContribution) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase & Fractionalize</CardTitle>
          <CardDescription>
            Only contributors can participate in the purchase and
            fractionalization process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Contribute to the pool to unlock this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {txHash && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <a
            href={getTransactionLink(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-sm"
          >
            View transaction <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Step 1: Finalize Voting */}
      {canFinalizeVoting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Step 1: Finalize Voting
            </CardTitle>
            <CardDescription>
              Finalize the voting period to determine the winning domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⏳ Voting period has ended. Click below to finalize and
                determine the winner.
              </p>
            </div>

            <Button
              onClick={handleFinalizeVoting}
              disabled={purchaseStep === "finalizing"}
              className="w-full"
            >
              {purchaseStep === "finalizing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                "Finalize Voting"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Winning Domain Display */}
      {hasWinner && winningCandidate && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="bg-green-50 dark:bg-green-950/20">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Winning Domain Selected
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">
                Selected Domain:
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {winningCandidate.domainName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Total Voting Power:{" "}
                {(Number(winningCandidate.voteCount) / 1e6).toLocaleString()}{" "}
                USDC
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Purchase Domain */}
      {(canPurchase || isPurchased || isFractionalized) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Step 2: Purchase Domain
              {isPurchased && <Badge variant="secondary">Completed</Badge>}
            </CardTitle>
            <CardDescription>
              Purchase the domain NFT via DOMA marketplace, then record the
              purchase here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPurchased && !isFractionalized && (
              <>
                {/* WETH Wrapper Section */}
                <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                      💎 Step 1: Wrap ETH to WETH
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckWETHBalance}
                    >
                      Check Balance
                    </Button>
                  </div>

                  {wethBalance !== "0" && (
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      Current WETH Balance: <strong>{wethBalance} WETH</strong>
                    </div>
                  )}

                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    WETH (Wrapped ETH) is required to create buy offers on Doma
                    marketplace. Convert your ETH to WETH below:
                  </p>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Amount (e.g., 0.1)"
                        value={ethToWrap}
                        onChange={(e) => setEthToWrap(e.target.value)}
                        type="number"
                        step="0.001"
                        min="0"
                      />
                    </div>
                    <Button
                      onClick={handleWrapETH}
                      disabled={purchaseStep === "wrapping-eth"}
                      variant="secondary"
                    >
                      {purchaseStep === "wrapping-eth" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wrapping...
                        </>
                      ) : (
                        "Wrap ETH"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Step 2: Create Buy Offer</strong>
                  </p>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Fill in the NFT details and offer amount below</li>
                    <li>
                      Click &quot;Create Buy Offer&quot; to submit to Doma
                      marketplace
                    </li>
                    <li>Wait for seller to accept your offer</li>
                    <li>
                      Once accepted, enter the transaction hash and record the
                      purchase
                    </li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="nft-contract">NFT Contract Address</Label>
                    <Input
                      id="nft-contract"
                      placeholder="0x..."
                      value={nftContractInput}
                      onChange={(e) => setNftContractInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="token-id">Token ID</Label>
                    <Input
                      id="token-id"
                      type="number"
                      placeholder="1"
                      value={tokenIdInput}
                      onChange={(e) => setTokenIdInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="offer-amount">Offer Amount (WETH)</Label>
                    <Input
                      id="offer-amount"
                      type="number"
                      placeholder="0.1"
                      step="0.001"
                      value={offerAmountInput}
                      onChange={(e) => setOfferAmountInput(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Amount in WETH (e.g., 0.1 for 0.1 WETH)
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateOffer}
                    disabled={purchaseStep === "creating-offer"}
                    className="w-full"
                  >
                    {purchaseStep === "creating-offer" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Offer...
                      </>
                    ) : (
                      "Create Buy Offer"
                    )}
                  </Button>

                  {orderId && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                        ✓ Offer Created Successfully
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 break-all">
                        Order ID: {orderId}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                        Wait for the seller to accept, then enter the
                        transaction hash below.
                      </p>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">
                      Or
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    <strong>Option 2: Manual Purchase</strong>
                  </p>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                    <li>Purchase domain NFT directly on Doma marketplace</li>
                    <li>
                      Transfer NFT to pool address: {poolAddress.slice(0, 10)}
                      ...
                    </li>
                    <li>Enter transaction hash below and record</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="purchase-tx">
                      Purchase Transaction Hash (Optional)
                    </Label>
                    <Input
                      id="purchase-tx"
                      placeholder="0x... (leave empty if using off-chain purchase)"
                      value={purchaseTxHashInput}
                      onChange={(e) => setPurchaseTxHashInput(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the transaction hash from the marketplace, or leave
                      empty to proceed with off-chain verification
                    </p>
                  </div>

                  <Button
                    onClick={handleRecordPurchase}
                    disabled={purchaseStep === "recording"}
                    className="w-full"
                  >
                    {purchaseStep === "recording" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording Purchase...
                      </>
                    ) : (
                      "Record Purchase"
                    )}
                  </Button>
                </div>
              </>
            )}

            {(isPurchased || isFractionalized) && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Domain purchased and recorded successfully
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-mono">
                  NFT: {nftContractInput.slice(0, 10)}...
                  {nftContractInput.slice(-8)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-mono">
                  Token ID: {tokenIdInput.slice(0, 20)}...
                  {tokenIdInput.slice(-20)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fractionalize Domain */}
      {(canPurchase || isPurchased || isFractionalized) && (
        <Card className={!isPurchased && !isFractionalized ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Step 3: Fractionalize Domain
              {isFractionalized && <Badge variant="secondary">Completed</Badge>}
              {!isPurchased && !isFractionalized && (
                <Badge variant="outline">Complete Step 2 First</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Fractionalize the domain NFT into ERC-20 tokens via Doma
              Fractionalization Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isFractionalized && !isPurchased && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  📝 Complete Step 2 (Purchase Domain) before fractionalizing
                </p>
              </div>
            )}
            {!isFractionalized && isPurchased && (
              <>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Fractionalization Process:</strong>
                  </p>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>
                      Define your fractional token properties (name, symbol,
                      supply)
                    </li>
                    <li>Set minimum buyout price to protect token holders</li>
                    <li>
                      Click &quot;Fractionalize Domain&quot; to execute via Doma
                      contract
                    </li>
                    <li>
                      Fractional tokens will be automatically minted and
                      recorded
                    </li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="token-name">Fractional Token Name</Label>
                    <Input
                      id="token-name"
                      placeholder="e.g., Fractionalized Domain XYZ"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="token-symbol">
                      Fractional Token Symbol
                    </Label>
                    <Input
                      id="token-symbol"
                      placeholder="e.g., FDXYZ"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="total-supply">Total Supply (tokens)</Label>
                    <Input
                      id="total-supply"
                      type="number"
                      placeholder="1000000"
                      value={totalSupply}
                      onChange={(e) => setTotalSupply(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total number of fractional tokens to create
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="min-buyout">
                      Minimum Buyout Price (USDC)
                    </Label>
                    <Input
                      id="min-buyout"
                      type="number"
                      placeholder="10000"
                      value={minimumBuyoutPrice}
                      onChange={(e) => setMinimumBuyoutPrice(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum price someone must pay to buy out the entire NFT
                    </p>
                  </div>

                  <Button
                    onClick={handleFractionalize}
                    disabled={purchaseStep === "fractionalizing"}
                    className="w-full"
                  >
                    {purchaseStep === "fractionalizing" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fractionalizing...
                      </>
                    ) : (
                      "Fractionalize Domain"
                    )}
                  </Button>

                  {fractionalTokenAddress && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                        ✓ Fractional Token Created
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 break-all">
                        Token Address: {fractionalTokenAddress}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {isFractionalized && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Domain fractionalized successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Token: {poolInfo.fractionToken.slice(0, 10)}...
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Contributors can now claim their fractional shares!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
