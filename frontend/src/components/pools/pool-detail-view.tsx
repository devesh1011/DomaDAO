/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/contexts/wallet-context";
import {
  getReadOnlyFractionPoolService,
  getFractionPoolService,
  PoolInfo,
  Contributor,
  DomainCandidate,
  PoolState,
} from "@/lib/contracts/fraction-pool";
import { getMockUSDCService } from "@/lib/contracts/usdc";
import { ethers } from "ethers";
import { getTransactionLink } from "@/lib/contracts/addresses";
import { VotingInterface } from "./voting-interface";
import { ProposeCandidateForm } from "./propose-candidate-form";
import { PurchaseFractionalize } from "./purchase-fractionalize";
import { ClaimShares } from "./claim-shares";
import { RevenueClaimInterface } from "./revenue-claim-interface";
import { BuyoutInterface } from "./buyout-interface";

interface PoolDetailViewProps {
  poolAddress: string;
}

export function PoolDetailView({ poolAddress }: PoolDetailViewProps) {
  const router = useRouter();
  const {
    account,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    switchToDomaNetwork,
  } = useWallet();

  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [candidates, setCandidates] = useState<DomainCandidate[]>([]);
  const [userContribution, setUserContribution] = useState<string>("0");
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [hasApproval, setHasApproval] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState<bigint>(BigInt(0));

  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [startingVoting, setStartingVoting] = useState(false);

  const [contributionAmount, setContributionAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const showToast = (type: "success" | "error", message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: "" }), 8000);
  };

  /**
   * Load pool information from contract
   */
  const loadPoolInfo = useCallback(async () => {
    try {
      console.log("🔄 Loading pool info for:", poolAddress);
      const poolService = await getReadOnlyFractionPoolService(poolAddress);
      const info = await poolService.getPoolInfo();
      console.log("📊 Pool info loaded:", {
        state: info.state,
        winningDomain: info.winningDomain,
        poolName: info.poolName,
      });
      setPoolInfo(info);

      // Load contributors
      const contributorsList = await poolService.getContributors();
      setContributors(contributorsList);

      // Load candidates
      const candidatesList = await poolService.getAllCandidates();
      setCandidates(candidatesList);
      console.log("✅ Pool info refresh complete");

      // Load user contribution and voting status if connected
      if (account) {
        const contribution = await poolService.getContribution(account);
        setUserContribution(contribution.amount);

        const hasVoted = await poolService.hasVoted(account);
        setUserHasVoted(hasVoted);

        // Load user's fraction token balance if pool is fractionalized
        if (
          info.state === PoolState.Fractionalized &&
          info.fractionToken !== ethers.ZeroAddress
        ) {
          try {
            const provider = new ethers.BrowserProvider(
              (window as any).ethereum
            );
            const tokenContract = new ethers.Contract(
              info.fractionToken,
              ["function balanceOf(address) view returns (uint256)"],
              provider
            );
            const balance = await tokenContract.balanceOf(account);
            setUserTokenBalance(BigInt(balance.toString()));
          } catch (error) {
            console.error("Error loading token balance:", error);
            setUserTokenBalance(BigInt(0));
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading pool info:", error);
      showToast("error", "Failed to load pool information");
    } finally {
      setLoading(false);
    }
  }, [poolAddress, account]);

  /**
   * Check USDC balance and approval
   */
  const checkUSDCStatus = useCallback(async () => {
    if (!account || !isConnected) return;

    try {
      const usdcService = await getMockUSDCService();

      // Get balance
      const balance = await usdcService.balanceOf(account);
      setUsdcBalance(balance);

      // Check approval
      const allowance = await usdcService.allowanceRaw(account, poolAddress);
      setHasApproval(allowance > BigInt(0));
    } catch (error) {
      console.error("Error checking USDC status:", error);
    }
  }, [account, isConnected, poolAddress]);

  useEffect(() => {
    loadPoolInfo();
  }, [loadPoolInfo]);

  useEffect(() => {
    if (account && isConnected) {
      checkUSDCStatus();
    }
  }, [account, isConnected, checkUSDCStatus]);

  // Auto-refresh timer for countdown (update every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Handle USDC approval
   */
  const handleApproval = async () => {
    if (!account) return;

    setApproving(true);

    try {
      const usdcService = await getMockUSDCService();

      // Approve a reasonable amount for contributions (1000 USDC)
      showToast("success", "Please approve USDC spending in MetaMask...");
      const tx = await usdcService.approve(poolAddress, "1000");

      showToast(
        "success",
        `Approval submitted! Hash: ${tx.hash.slice(0, 10)}...`
      );
      await tx.wait();

      setHasApproval(true);
      showToast("success", "USDC spending approved!");
      await checkUSDCStatus();
    } catch (error: any) {
      console.error("Error approving USDC:", error);

      if (error.code === "ACTION_REJECTED") {
        showToast("error", "Approval rejected by user");
      } else {
        showToast("error", error.message || "Failed to approve USDC");
      }
    } finally {
      setApproving(false);
    }
  };

  /**
   * Handle contribution
   */
  const handleContribute = async () => {
    if (!isConnected) {
      showToast("error", "Please connect your wallet first");
      await connectWallet();
      return;
    }

    if (!isCorrectNetwork) {
      showToast("error", "Please switch to DOMA Testnet");
      await switchToDomaNetwork();
      return;
    }

    if (!hasApproval) {
      showToast("error", "Please approve USDC first");
      return;
    }

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("error", "Please enter a valid amount");
      return;
    }

    // Check minimum contribution
    if (!poolInfo) {
      showToast("error", "Pool information not loaded");
      return;
    }
    const minContribution = Number(poolInfo.minimumContribution) / 1e6; // Convert from smallest unit
    if (amount < minContribution) {
      showToast("error", `Minimum contribution is ${minContribution} USDC`);
      return;
    }

    setContributing(true);
    setTxHash(null);

    try {
      const poolService = await getFractionPoolService(poolAddress);

      showToast("success", "Please confirm the transaction in MetaMask...");
      const tx = await poolService.contribute(contributionAmount);

      setTxHash(tx.hash);
      showToast(
        "success",
        `Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`
      );

      showToast("success", "Waiting for confirmation...");
      await tx.wait();

      showToast("success", "Contribution successful!");
      setContributionAmount("");

      // Reload pool info
      await loadPoolInfo();
      await checkUSDCStatus();
    } catch (error: any) {
      console.error("Error contributing:", error);

      if (error.code === "ACTION_REJECTED") {
        showToast("error", "Transaction rejected by user");
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        showToast("error", "Insufficient funds for gas");
      } else if (error.code === -32603 || error.code === "UNKNOWN_ERROR") {
        showToast(
          "error",
          "Network error - please check your connection and try again"
        );
      } else if (error.message?.includes("Below minimum contribution")) {
        showToast("error", "Contribution amount is below the minimum required");
      } else if (error.message?.includes("execution reverted")) {
        showToast(
          "error",
          "Transaction failed - please check your USDC balance and approval"
        );
      } else {
        showToast("error", error.message || "Failed to contribute");
      }
    } finally {
      setContributing(false);
    }
  };

  /**
   * Handle starting voting phase (owner only)
   */
  const handleStartVoting = async () => {
    if (!isConnected) {
      showToast("error", "Please connect your wallet first");
      await connectWallet();
      return;
    }

    if (!isCorrectNetwork) {
      showToast("error", "Please switch to DOMA Testnet");
      await switchToDomaNetwork();
      return;
    }

    setStartingVoting(true);

    try {
      const poolService = await getFractionPoolService(poolAddress);

      showToast("success", "Please confirm the transaction in MetaMask...");
      const tx = await poolService.startVoting();

      showToast(
        "success",
        `Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`
      );

      showToast("success", "Waiting for confirmation...");
      await tx.wait();

      showToast("success", "Voting phase started! Contributors can now vote.");

      // Reload pool info
      await loadPoolInfo();
    } catch (error: any) {
      console.error("Error starting voting:", error);

      if (error.code === "ACTION_REJECTED") {
        showToast("error", "Transaction rejected by user");
      } else if (error.message?.includes("Contribution window not ended")) {
        showToast(
          "error",
          "Cannot start voting - contribution window is still active"
        );
      } else if (error.message?.includes("Invalid status")) {
        showToast("error", "Pool is not in fundraising status");
      } else {
        showToast("error", error.message || "Failed to start voting");
      }
    } finally {
      setStartingVoting(false);
    }
  };

  /**
   * Mint test USDC
   */
  const handleMintUSDC = async () => {
    if (!account) return;

    setContributing(true);

    try {
      const usdcService = await getMockUSDCService();

      showToast("success", "Minting 1000 test USDC...");
      const tx = await usdcService.mint(account, "1000");

      showToast("success", "Waiting for mint confirmation...");
      await tx.wait();

      showToast("success", "1000 USDC minted successfully!");
      await checkUSDCStatus();
    } catch (error: any) {
      console.error("Error minting USDC:", error);
      showToast("error", error.message || "Failed to mint USDC");
    } finally {
      setContributing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!poolInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Pool not found
          </h2>
          <Button onClick={() => router.back()}>Back</Button>
        </div>
      </div>
    );
  }

  const progress =
    poolInfo.totalRaised > 0
      ? (Number(poolInfo.totalRaised) / Number(poolInfo.targetRaise)) * 100
      : 0;

  // Calculate time remaining based on pool state
  let targetTimestamp: bigint;
  if (poolInfo.state === PoolState.Fundraising) {
    targetTimestamp = poolInfo.endTimestamp;
  } else if (poolInfo.state === PoolState.Voting) {
    targetTimestamp = poolInfo.votingEnd;
  } else {
    targetTimestamp = poolInfo.purchaseWindowEnd;
  }

  const timeRemaining = Math.max(0, Number(targetTimestamp) - currentTime);
  const daysRemaining = Math.max(0, Math.floor(timeRemaining / 86400));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {poolInfo.poolName}
            </h1>
            <div className="flex items-center gap-4">
              <code className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                {poolAddress.slice(0, 10)}...{poolAddress.slice(-8)}
              </code>
              <Badge
                className={
                  poolInfo.state === PoolState.Fundraising
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : poolInfo.state === PoolState.Voting
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : poolInfo.state === PoolState.Purchased
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                    : poolInfo.state === PoolState.Fractionalized
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                }
              >
                {poolInfo.state === PoolState.Fundraising && "Fundraising"}
                {poolInfo.state === PoolState.Voting && "Voting"}
                {poolInfo.state === PoolState.Purchased && "Purchased"}
                {poolInfo.state === PoolState.Fractionalized &&
                  "Fractionalized"}
                {poolInfo.state === PoolState.Closed && "Closed"}
                {poolInfo.state === PoolState.Disputed && "Disputed"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3">
            {/* Start Voting Button (Owner only, Fundraising state) */}
            {account &&
              poolInfo.creator.toLowerCase() === account.toLowerCase() &&
              poolInfo.state === PoolState.Fundraising &&
              timeRemaining <= 0 && (
                <Button
                  onClick={handleStartVoting}
                  disabled={startingVoting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {startingVoting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Voting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Start Voting Phase
                    </>
                  )}
                </Button>
              )}

            {/* Admin Button for Pool Owner */}
            {account &&
              poolInfo.creator.toLowerCase() === account.toLowerCase() && (
                <Button
                  onClick={() => router.push(`/pools/${poolAddress}/admin`)}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-950"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Status Toast */}
      {status.type && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            status.type === "success"
              ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle>Funding Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {(Number(poolInfo.totalRaised) / 1e6).toFixed(2)} USDC
                    raised
                  </span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">
                    {(Number(poolInfo.targetRaise) / 1e6).toFixed(2)} USDC
                    target
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Number(poolInfo.contributorCount)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Contributors
                  </div>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {timeRemaining > 0
                      ? timeRemaining > 86400
                        ? `${daysRemaining}d`
                        : timeRemaining > 3600
                        ? `${Math.floor(timeRemaining / 3600)}h ${Math.floor(
                            (timeRemaining % 3600) / 60
                          )}m`
                        : `${Math.floor(timeRemaining / 60)}m ${
                            timeRemaining % 60
                          }s`
                      : "0"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {poolInfo.state === PoolState.Fundraising
                      ? "Until Voting"
                      : poolInfo.state === PoolState.Voting
                      ? "Until Purchase"
                      : "Time Left"}
                  </div>
                </div>
                <div className="text-center">
                  <Target className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Number(poolInfo.candidateCount)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Candidates
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contributors and Voting Tabs */}
          <Tabs defaultValue="contributors" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="contributors">Contributors</TabsTrigger>
              <TabsTrigger value="voting">
                Voting ({Number(poolInfo.candidateCount)})
              </TabsTrigger>
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
              <TabsTrigger value="claim">Claim Shares</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="buyout">Buyout</TabsTrigger>
            </TabsList>

            <TabsContent value="contributors">
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                  <CardDescription>
                    Largest contributions to this pool
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contributors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No contributions yet. Be the first!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contributors.slice(0, 10).map((contributor, index) => (
                        <div
                          key={contributor.address}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                              {index + 1}
                            </div>
                            <code className="text-sm">
                              {contributor.address.slice(0, 6)}...
                              {contributor.address.slice(-4)}
                            </code>
                          </div>
                          <div className="font-medium text-purple-600 dark:text-purple-400">
                            {contributor.amount} USDC
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voting">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Domain Voting</CardTitle>
                      <CardDescription>
                        Vote for your preferred domain
                      </CardDescription>
                    </div>
                    <ProposeCandidateForm
                      poolAddress={poolAddress}
                      poolCreator={poolInfo.creator}
                      userContribution={userContribution}
                      onProposalSuccess={loadPoolInfo}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <VotingInterface
                    poolAddress={poolAddress}
                    candidates={candidates}
                    userHasVoted={userHasVoted}
                    userContribution={userContribution}
                    votingStart={poolInfo.votingStart}
                    votingEnd={poolInfo.votingEnd}
                    poolState={poolInfo.state}
                    onVoteSuccess={loadPoolInfo}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchase">
              <PurchaseFractionalize
                poolAddress={poolAddress}
                poolInfo={poolInfo}
                winningCandidate={
                  poolInfo.winningDomain
                    ? candidates.find(
                        (c) => c.domainName === poolInfo.winningDomain
                      ) || null
                    : null
                }
                userContribution={userContribution}
                onSuccess={loadPoolInfo}
              />
            </TabsContent>

            <TabsContent value="claim">
              <ClaimShares
                poolAddress={poolAddress}
                poolInfo={poolInfo}
                userAddress={account}
                userContribution={userContribution}
                onSuccess={loadPoolInfo}
              />
            </TabsContent>

            <TabsContent value="revenue">
              <RevenueClaimInterface
                poolAddress={poolAddress}
                fractionTokenAddress={poolInfo.fractionToken}
                userAddress={account}
                onClaimSuccess={loadPoolInfo}
              />
            </TabsContent>

            <TabsContent value="buyout">
              <BuyoutInterface
                poolAddress={poolAddress}
                fractionTokenAddress={poolInfo.fractionToken}
                userAddress={account}
                userTokenBalance={userTokenBalance}
                onBuyoutUpdate={loadPoolInfo}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contribution Card */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardTitle>Contribute to Pool</CardTitle>
              <CardDescription>Invest in this domain pool</CardDescription>
              {poolInfo.state === PoolState.Fundraising && (
                <div className="mt-2 text-xs font-medium">
                  {timeRemaining > 0 ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ Contribution Window Open
                    </span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400">
                      ⏳ Contribution Window Ended - Owner must start voting
                    </span>
                  )}
                </div>
              )}
              {poolInfo.state === PoolState.Voting && (
                <div className="mt-2 text-xs font-medium">
                  {poolInfo.winningDomain ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✅ Winner Selected: {poolInfo.winningDomain} - Ready for
                      Purchase
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400">
                      🗳️ Voting Phase Active
                    </span>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* USDC Balance */}
              {usdcBalance && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Your Balance
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {parseFloat(usdcBalance).toFixed(2)} USDC
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleMintUSDC}
                      disabled={contributing || approving}
                      className="h-6 text-xs"
                    >
                      Mint Test USDC
                    </Button>
                  </div>
                </div>
              )}

              {/* Your Contribution */}
              {parseFloat(userContribution) > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">
                    You&apos;ve contributed{" "}
                    <strong>{userContribution} USDC</strong>
                  </span>
                </div>
              )}

              {/* Approval Status */}
              {isConnected && (
                <div
                  className={`p-3 rounded-lg text-sm border ${
                    hasApproval
                      ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                      : "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasApproval ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="font-medium">USDC Approved</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">
                            USDC Approval Required
                          </span>
                        </>
                      )}
                    </div>
                    {!hasApproval && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApproval}
                        disabled={approving}
                      >
                        {approving ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Contribution Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDC)</Label>
                {poolInfo && (
                  <p className="text-xs text-gray-500">
                    Minimum contribution:{" "}
                    {Number(poolInfo.minimumContribution) / 1e6} USDC
                  </p>
                )}
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  disabled={contributing || approving || !hasApproval}
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                onClick={handleContribute}
                disabled={
                  contributing ||
                  approving ||
                  !hasApproval ||
                  !isConnected ||
                  poolInfo.state !== PoolState.Fundraising ||
                  timeRemaining <= 0
                }
              >
                {contributing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Contributing...
                  </>
                ) : poolInfo.state !== PoolState.Fundraising ? (
                  "Contribution Phase Ended"
                ) : timeRemaining <= 0 ? (
                  "Contribution Window Closed"
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Contribute
                  </>
                )}
              </Button>

              {/* Transaction Hash */}
              {txHash && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                  <a
                    href={getTransactionLink(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pool Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pool Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Creator
                </span>
                <code className="text-xs">
                  {poolInfo.creator.slice(0, 6)}...{poolInfo.creator.slice(-4)}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Start Date
                </span>
                <span>
                  {new Date(
                    Number(poolInfo.startTimestamp) * 1000
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  End Date
                </span>
                <span>
                  {new Date(
                    Number(poolInfo.endTimestamp) * 1000
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Payment Token
                </span>
                <span>USDC</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
