/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Vote, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@/contexts/wallet-context";
import {
  getFractionPoolService,
  type DomainCandidate,
} from "@/lib/contracts/fraction-pool";
import { getTransactionLink } from "@/lib/contracts/addresses";

interface VotingInterfaceProps {
  poolAddress: string;
  candidates: DomainCandidate[];
  userHasVoted: boolean;
  userContribution: string;
  votingStart: bigint;
  votingEnd: bigint;
  poolState: number;
  onVoteSuccess?: () => void;
}

export function VotingInterface({
  poolAddress,
  candidates,
  userHasVoted,
  userContribution,
  votingStart,
  votingEnd,
  poolState,
  onVoteSuccess,
}: VotingInterfaceProps) {
  const { isConnected, isCorrectNetwork, connectWallet, switchToDomaNetwork } =
    useWallet();

  const [voting, setVoting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  const showToast = (type: "success" | "error", message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: "" }), 8000);
  };

  /**
   * Handle voting for a candidate by domain name
   */
  const handleVote = async (candidateIndex: number) => {
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

    // Check if pool is in voting state (state 1 = Voting)
    if (poolState !== 1) {
      showToast(
        "error",
        "Pool is not in voting phase yet. Voting starts after fundraising ends."
      );
      return;
    }

    // Check if voting window is open
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now < votingStart) {
      const timeUntil = Number(votingStart - now);
      const hours = Math.floor(timeUntil / 3600);
      showToast(
        "error",
        `Voting hasn't started yet. Starts in ${hours} hours.`
      );
      return;
    }

    if (now > votingEnd) {
      showToast("error", "Voting period has ended");
      return;
    }

    if (userHasVoted) {
      showToast("error", "You have already voted");
      return;
    }

    if (parseFloat(userContribution) === 0) {
      showToast("error", "You must contribute to the pool to vote");
      return;
    }

    const candidate = candidates[candidateIndex];
    if (!candidate) {
      showToast("error", "Invalid candidate");
      return;
    }

    setVoting(true);
    setTxHash(null);

    try {
      const poolService = await getFractionPoolService(poolAddress);

      showToast("success", "Please confirm the transaction in MetaMask...");
      // Vote by domain name string, not index
      const tx = await poolService.castVote(candidate.domainName);

      setTxHash(tx.hash);
      showToast("success", `Vote submitted! Hash: ${tx.hash.slice(0, 10)}...`);

      showToast("success", "Waiting for confirmation...");
      await tx.wait();

      showToast("success", "Vote confirmed!");

      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (error: any) {
      console.error("Error voting:", error);

      if (error.code === "ACTION_REJECTED") {
        showToast("error", "Transaction rejected by user");
      } else {
        showToast("error", error.message || "Failed to vote");
      }
    } finally {
      setVoting(false);
    }
  };

  // Calculate total votes
  const totalVotes = candidates.reduce(
    (sum, c) => sum + Number(c.voteCount),
    0
  );

  // Check voting window status
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isVotingOpen =
    poolState === 1 && now >= votingStart && now <= votingEnd;
  const votingNotStarted = now < votingStart;
  const votingEnded = now > votingEnd;

  return (
    <div className="space-y-4">
      {/* Voting Status Banner */}
      {!isVotingOpen && (
        <div
          className={`p-4 rounded-lg border ${
            votingNotStarted
              ? "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              : "bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
          }`}
        >
          {poolState !== 1 ? (
            <p className="text-sm font-medium">
              ⏳ Voting phase hasn&apos;t started yet. Complete fundraising
              first.
            </p>
          ) : votingNotStarted ? (
            <p className="text-sm font-medium">
              ⏳ Voting starts on{" "}
              {new Date(Number(votingStart) * 1000).toLocaleString()}
            </p>
          ) : (
            <p className="text-sm font-medium">
              🔒 Voting period has ended on{" "}
              {new Date(Number(votingEnd) * 1000).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Status Toast */}
      {status.type && (
        <div
          className={`p-4 rounded-lg ${
            status.type === "success"
              ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {status.message}
        </div>
      )}

      {/* User Voting Status */}
      {userHasVoted && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-300">
            You have already voted
          </span>
        </div>
      )}

      {/* Candidates List */}
      <div className="space-y-3">
        {candidates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                No candidates proposed yet
              </div>
            </CardContent>
          </Card>
        ) : (
          candidates.map((candidate, index) => {
            const votePercentage =
              totalVotes > 0
                ? (Number(candidate.voteCount) / totalVotes) * 100
                : 0;

            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Candidate Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {candidate.domainName}
                        </h3>
                        <div className="space-y-1">
                          {candidate.nftContract && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">NFT Contract:</span>{" "}
                              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                                {candidate.nftContract.slice(0, 10)}...
                              </code>
                            </div>
                          )}
                          {candidate.tokenId && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Token ID:</span>{" "}
                              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                                {candidate.tokenId.toString()}
                              </code>
                            </div>
                          )}
                          {candidate.proposer && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Proposed by:</span>{" "}
                              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                                {candidate.proposer.slice(0, 6)}...
                                {candidate.proposer.slice(-4)}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {votePercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {(Number(candidate.voteCount) / 1e6).toLocaleString()}{" "}
                          USDC voting power
                        </div>
                      </div>
                    </div>

                    {/* Vote Progress Bar */}
                    <div className="space-y-1">
                      <Progress value={votePercentage} className="h-2" />
                    </div>

                    {/* Vote Button */}
                    <Button
                      className="w-full"
                      onClick={() => handleVote(index)}
                      disabled={
                        voting ||
                        userHasVoted ||
                        parseFloat(userContribution) === 0 ||
                        !isVotingOpen
                      }
                    >
                      {voting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Voting...
                        </>
                      ) : (
                        <>
                          <Vote className="mr-2 h-4 w-4" />
                          Vote for this Domain
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
    </div>
  );
}
