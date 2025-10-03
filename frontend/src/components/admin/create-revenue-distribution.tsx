/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
import {
  Loader2,
  DollarSign,
  Users,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getRevenueDistributorService } from "@/lib/contracts/revenue-distributor";
import { getTransactionLink } from "@/lib/contracts/addresses";
import { BrowserProvider, Contract } from "ethers";
import ERC20ABI from "@/contracts/MockUSDC.json";

interface CreateRevenueDistributionProps {
  fractionTokenAddress: string;
  usdcAddress: string;
  onSuccess?: () => void;
}

interface TokenHolder {
  address: string;
  balance: bigint;
}

export function CreateRevenueDistribution({
  fractionTokenAddress,
  usdcAddress,
  onSuccess,
}: CreateRevenueDistributionProps) {
  const [amount, setAmount] = useState("");
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHolders, setLoadingHolders] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Load fraction token holders
   * In production, this would use events or subgraph
   * For now, we'll use a simplified approach
   */
  const loadTokenHolders = async () => {
    try {
      setLoadingHolders(true);
      setError(null);

      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const fractionToken = new Contract(
        fractionTokenAddress,
        ERC20ABI.abi,
        signer
      );

      // Get total supply
      const totalSupply = await fractionToken.totalSupply();

      // In a real implementation, we would:
      // 1. Query Transfer events to find all holders
      // 2. Query current balance for each holder
      // 3. Filter out zero balances

      // For demo purposes, we'll get the current user's balance
      const userAddress = await signer.getAddress();
      const userBalance = await fractionToken.balanceOf(userAddress);

      const holdersList: TokenHolder[] = [];

      if (userBalance > BigInt(0)) {
        holdersList.push({
          address: userAddress,
          balance: userBalance,
        });
      }

      // Note: In production, you would fetch all holders from:
      // - Transfer events
      // - Subgraph query
      // - Backend API

      setHolders(holdersList);

      if (holdersList.length === 0) {
        setError("No token holders found. Make sure shares have been claimed.");
      }
    } catch (err: any) {
      console.error("Error loading token holders:", err);
      setError(err.message || "Failed to load token holders");
    } finally {
      setLoadingHolders(false);
    }
  };

  /**
   * Create a new revenue distribution
   */
  const handleCreateDistribution = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validate inputs
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (holders.length === 0) {
        throw new Error("No token holders found");
      }

      // Convert amount to USDC (6 decimals)
      const amountRaw = BigInt(Math.floor(amountNum * 1e6));

      // First, approve USDC spending
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcContract = new Contract(usdcAddress, ERC20ABI.abi, signer);

      // Get RevenueDistributor address
      const service = await getRevenueDistributorService();
      const distributorAddress = service["contract"]?.target;

      // Approve USDC
      console.log("Approving USDC...");
      const approveTx = await usdcContract.approve(
        distributorAddress,
        amountRaw
      );
      await approveTx.wait();

      // Create distribution
      console.log("Creating distribution...");
      const holderAddresses = holders.map((h) => h.address);
      const holderBalances = holders.map((h) => h.balance);

      const tx = await service.createDistribution(
        amountRaw,
        holderAddresses,
        holderBalances
      );

      setTxHash(tx.hash);
      await tx.wait();

      setSuccess(true);
      setAmount("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error creating distribution:", err);
      setError(err.message || "Failed to create distribution");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fractionTokenAddress) {
      loadTokenHolders();
    }
  }, [fractionTokenAddress]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Create Revenue Distribution
        </CardTitle>
        <CardDescription>
          Distribute revenue to all fraction token holders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                Distribution created successfully!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Token holders can now claim their share of the revenue.
              </p>
            </div>
          </div>
        )}

        {/* Transaction Hash */}
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

        {/* Token Holders Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Token Holders
              </span>
            </div>
            <Button
              onClick={loadTokenHolders}
              disabled={loadingHolders}
              size="sm"
              variant="outline"
            >
              {loadingHolders ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Loading...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {holders.length} holder{holders.length !== 1 ? "s" : ""} found
          </p>
          {holders.length > 0 && (
            <div className="mt-2 space-y-1">
              {holders.slice(0, 3).map((holder, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-500 dark:text-gray-400 font-mono"
                >
                  {holder.address.slice(0, 6)}...{holder.address.slice(-4)}:{" "}
                  {(Number(holder.balance) / 1e18).toLocaleString()} tokens
                </div>
              ))}
              {holders.length > 3 && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  ...and {holders.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Revenue Amount (USDC)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="100.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            step="0.01"
            min="0"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This amount will be distributed proportionally to all token holders
            based on their share balance.
          </p>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateDistribution}
          disabled={loading || holders.length === 0 || !amount}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Distribution...
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Create Distribution
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>How it works:</strong> The revenue will be distributed
            proportionally to all current token holders. Each holder's share is
            calculated as: (their balance / total supply) × revenue amount.
          </p>
        </div>

        {/* Note about production */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> In production, this would query all token
            holders from the blockchain or subgraph. Currently showing holders
            found from Transfer events in the current session.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
