/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Plus, Loader2, ExternalLink } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWallet } from "@/contexts/wallet-context";
import { getFractionPoolService } from "@/lib/contracts/fraction-pool";
import { getTransactionLink } from "@/lib/contracts/addresses";

interface ProposeCandidateFormProps {
  poolAddress: string;
  poolCreator: string; // Added: pool creator address
  userContribution: string;
  onProposalSuccess?: () => void;
}

export function ProposeCandidateForm({
  poolAddress,
  poolCreator,
  userContribution,
  onProposalSuccess,
}: ProposeCandidateFormProps) {
  const {
    isConnected,
    isCorrectNetwork,
    account,
    connectWallet,
    switchToDomaNetwork,
  } = useWallet();

  const [open, setOpen] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  const [formData, setFormData] = useState({
    domainName: "",
    domainUrl: "",
    estimatedValue: "",
  });

  // Check if user is pool owner
  const isPoolOwner = account?.toLowerCase() === poolCreator?.toLowerCase();

  const showToast = (type: "success" | "error", message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: "" }), 8000);
  };

  /**
   * Handle candidate proposal
   */
  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!isPoolOwner) {
      showToast("error", "Only pool owner can add domain candidates");
      return;
    }

    if (!formData.domainName.trim()) {
      showToast("error", "Please enter a domain name");
      return;
    }

    setProposing(true);
    setTxHash(null);

    try {
      const poolService = await getFractionPoolService(poolAddress);

      showToast("success", "Please confirm the transaction in MetaMask...");
      const tx = await poolService.addDomainCandidate(formData.domainName);

      setTxHash(tx.hash);
      showToast(
        "success",
        `Proposal submitted! Hash: ${tx.hash.slice(0, 10)}...`
      );

      showToast("success", "Waiting for confirmation...");
      await tx.wait();

      showToast("success", "Candidate proposed successfully!");

      // Reset form
      setFormData({
        domainName: "",
        domainUrl: "",
        estimatedValue: "",
      });

      // Close dialog after success
      setTimeout(() => {
        setOpen(false);
        if (onProposalSuccess) {
          onProposalSuccess();
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error proposing candidate:", error);

      if (error.code === "ACTION_REJECTED") {
        showToast("error", "Transaction rejected by user");
      } else {
        showToast("error", error.message || "Failed to propose candidate");
      }
    } finally {
      setProposing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
          disabled={!isPoolOwner}
        >
          <Plus className="mr-2 h-4 w-4" />
          {isPoolOwner ? "Add Domain Candidate" : "Only Owner Can Add"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Domain Candidate</DialogTitle>
        </DialogHeader>

        {!isPoolOwner ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-300">
              ⚠️ Only the pool owner can add domain candidates. This is an MVP
              limitation. Contributors can suggest domains in Discord/Telegram,
              and the owner will add them for voting.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePropose} className="space-y-4">
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

            {/* Domain Name */}
            <div className="space-y-2">
              <Label htmlFor="domainName">Domain Name *</Label>
              <Input
                id="domainName"
                placeholder="example.ai"
                value={formData.domainName}
                onChange={(e) =>
                  setFormData({ ...formData, domainName: e.target.value })
                }
                required
                disabled={proposing}
              />
              <p className="text-xs text-gray-500">
                The domain name you want the pool to purchase
              </p>
            </div>

            {/* Optional: Domain URL (for reference) */}
            <div className="space-y-2">
              <Label htmlFor="domainUrl">Domain URL (optional)</Label>
              <Input
                id="domainUrl"
                placeholder="https://example.com"
                value={formData.domainUrl}
                onChange={(e) =>
                  setFormData({ ...formData, domainUrl: e.target.value })
                }
                disabled={proposing}
              />
              <p className="text-xs text-gray-500">
                For reference only - not stored on-chain
              </p>
            </div>

            {/* Optional: Estimated Value (for reference) */}
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value (optional)</Label>
              <Input
                id="estimatedValue"
                placeholder="10000 USDC"
                value={formData.estimatedValue}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedValue: e.target.value })
                }
                disabled={proposing}
              />
              <p className="text-xs text-gray-500">
                For reference only - not stored on-chain
              </p>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-300">
                💡 As pool owner, you can add domain candidates for contributors
                to vote on. Contributors will vote with weighted voting based on
                their contributions.
              </p>
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

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={proposing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={proposing}>
                {proposing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Candidate"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
