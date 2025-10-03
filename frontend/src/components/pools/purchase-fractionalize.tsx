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
    | "recording"
    | "fractionalizing"
    | "complete"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Purchase form state
  const [nftContractInput, setNftContractInput] = useState(
    process.env.NEXT_PUBLIC_MOCK_DOMAIN_NFT_ADDRESS || ""
  );
  const [tokenIdInput, setTokenIdInput] = useState("1");
  const [offerAmountInput, setOfferAmountInput] = useState("1000");
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
  const isPurchased = poolInfo.state === 2; // Purchased state
  const isFractionalized = poolInfo.state === 3; // Fractionalized state

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
   * Create a buy offer via Doma Orderbook API
   */
  const handleCreateOffer = async () => {
    if (!nftContractInput || !tokenIdInput || !offerAmountInput) {
      setError("Please fill in all offer details");
      return;
    }

    try {
      setPurchaseStep("creating-offer");
      setError(null);

      const purchaseService = getDomainPurchaseService();
      const paymentTokenAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";

      // Convert offer amount from USDC (6 decimals)
      const offerAmountRaw = (parseFloat(offerAmountInput) * 1e6).toString();

      const result = await purchaseService.createBuyOffer({
        poolAddress,
        domainNftAddress: nftContractInput,
        tokenId: tokenIdInput,
        offerAmount: offerAmountRaw,
        paymentTokenAddress,
      });

      if (result.success && result.orderId) {
        setOrderId(result.orderId);
        setError(null);
      } else {
        setError(result.error || "Failed to create offer");
      }

      setPurchaseStep("idle");
    } catch (err: any) {
      console.error("Error creating offer:", err);
      setError(err.message || "Failed to create buy offer");
      setPurchaseStep("idle");
    }
  };

  /**
   * Record domain purchase on-chain
   * User must provide transaction hash after NFT transfer is complete
   */
  const handleRecordPurchase = async () => {
    if (!nftContractInput || !tokenIdInput || !purchaseTxHashInput) {
      setError("Please fill in all purchase details");
      return;
    }

    try {
      setPurchaseStep("recording");
      setError(null);

      const poolService = await getFractionPoolService(poolAddress);
      const tx = await poolService.recordDomainPurchase(
        nftContractInput,
        tokenIdInput,
        purchaseTxHashInput
      );

      setTxHash(tx.hash);
      await tx.wait();

      setPurchaseStep("idle");
      onSuccess();
    } catch (err: any) {
      console.error("Error recording purchase:", err);
      setError(err.message || "Failed to record purchase");
      setPurchaseStep("idle");
    }
  };

  /**
   * Fractionalize the domain NFT via Doma Fractionalization contract
   * Then record it in the pool contract
   */
  const handleFractionalize = async () => {
    if (!nftContractInput || !tokenIdInput) {
      setError("NFT contract and token ID are required");
      return;
    }

    if (!tokenName || !tokenSymbol) {
      setError("Token name and symbol are required");
      return;
    }

    try {
      setPurchaseStep("fractionalizing");
      setError(null);

      // Step 1: Fractionalize via Doma Fractionalization contract
      console.log("Starting fractionalization...");
      const fractionalizationService = getDomaFractionalizationService();

      // Convert amounts to base units
      const totalSupplyBase = (parseFloat(totalSupply) * 1e18).toString(); // Assuming 18 decimals for fraction tokens
      const minimumBuyoutPriceBase = (
        parseFloat(minimumBuyoutPrice) * 1e6
      ).toString(); // USDC has 6 decimals

      const result = await fractionalizationService.fractionalizeDomain({
        domainNftAddress: nftContractInput,
        tokenId: tokenIdInput,
        tokenInfo: {
          name: tokenName,
          symbol: tokenSymbol,
          totalSupply: totalSupplyBase,
        },
        minimumBuyoutPrice: minimumBuyoutPriceBase,
      });

      if (!result.success || !result.fractionalTokenAddress) {
        throw new Error(result.error || "Fractionalization failed");
      }

      console.log(
        "Fractionalization successful, token address:",
        result.fractionalTokenAddress
      );
      setFractionalTokenAddress(result.fractionalTokenAddress);

      // Step 2: Record fractionalization in pool contract
      console.log("Recording fractionalization in pool contract...");
      const poolService = await getFractionPoolService(poolAddress);
      const recordTx = await poolService.recordFractionalization(
        result.fractionalTokenAddress
      );

      setTxHash(recordTx.hash);
      await recordTx.wait();

      setPurchaseStep("complete");
      onSuccess();
    } catch (err: any) {
      console.error("Error fractionalizing domain:", err);
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
                Total Votes: {Number(winningCandidate.voteCount)} USDC
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
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Option 1: Create Buy Offer (Recommended)</strong>
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
                    <Label htmlFor="offer-amount">Offer Amount (USDC)</Label>
                    <Input
                      id="offer-amount"
                      type="number"
                      placeholder="1000"
                      value={offerAmountInput}
                      onChange={(e) => setOfferAmountInput(e.target.value)}
                    />
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
                      Purchase Transaction Hash
                    </Label>
                    <Input
                      id="purchase-tx"
                      placeholder="0x... (after seller accepts or manual transfer)"
                      value={purchaseTxHashInput}
                      onChange={(e) => setPurchaseTxHashInput(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleRecordPurchase}
                    disabled={purchaseStep === "recording"}
                    className="w-full"
                  >
                    {purchaseStep === "recording" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
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
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  NFT: {poolInfo.domainNFT.slice(0, 10)}... Token ID:{" "}
                  {poolInfo.domainTokenId.toString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fractionalize Domain */}
      {(isPurchased || isFractionalized) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Step 3: Fractionalize Domain
              {isFractionalized && <Badge variant="secondary">Completed</Badge>}
            </CardTitle>
            <CardDescription>
              Fractionalize the domain NFT into ERC-20 tokens via Doma
              Fractionalization Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isFractionalized && (
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
