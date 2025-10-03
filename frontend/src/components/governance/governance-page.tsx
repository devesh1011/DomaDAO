"use client";

import { AlertCircle, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GovernancePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Governance Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">Pool Governance</h2>
        <p className="text-muted-foreground">
          Governance occurs at the pool level during the voting phase
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="h-5 w-5" />
            How Pool Governance Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-blue-900 dark:text-blue-100">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold mb-1">1. Pool Creation</h4>
              <p className="text-sm">
                When a pool is created, it starts in the{" "}
                <strong>Fundraising</strong> state where investors can
                contribute USDC.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">2. Voting Phase</h4>
              <p className="text-sm">
                Once fundraising is complete, the pool enters the{" "}
                <strong>Voting</strong> state. Contributors can propose domain
                candidates and vote on which domain to purchase.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">
                3. Contribution-Weighted Voting
              </h4>
              <p className="text-sm">
                Your voting power equals your contribution amount. For example,
                if you contributed 10 USDC, you have 10 USDC worth of voting
                power.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">4. Domain Purchase</h4>
              <p className="text-sm">
                After voting ends, the winning domain is purchased using the
                pooled funds, and the pool transitions to the{" "}
                <strong>Purchased</strong> state.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">5. Fractionalization</h4>
              <p className="text-sm">
                The purchased domain is fractionalized into ERC-20 tokens,
                giving each contributor ownership shares proportional to their
                contribution.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Participate Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Participate in Governance</CardTitle>
          <CardDescription>
            Follow these steps to participate in pool governance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Join an Active Pool</h4>
                <p className="text-sm text-muted-foreground">
                  Go to &quot;Explore Pools&quot; and contribute USDC to a pool
                  that&apos;s currently in fundraising or voting phase.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">
                  Propose Domain Candidates
                </h4>
                <p className="text-sm text-muted-foreground">
                  During the voting phase, you can propose domains as candidates
                  for the pool to purchase. Include the domain name and a
                  supporting rationale.
                </p>
                <div className="mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/pools">Find Pools to Propose In →</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Cast Your Vote</h4>
                <p className="text-sm text-muted-foreground">
                  Vote for your preferred domain candidate. Your voting power
                  equals your contribution amount. You can only vote once per
                  pool.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">Track Results</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor the voting results in real-time. After the voting
                  window closes, the domain with the most votes will be
                  purchased.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Pools with Active Governance */}
      <Card>
        <CardHeader>
          <CardTitle>Find Pools with Active Governance</CardTitle>
          <CardDescription>
            Check the &quot;Explore Pools&quot; section to find pools in voting
            phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Fundraising Phase</p>
                  <p className="text-sm text-muted-foreground">
                    Contribute USDC to secure voting power for the next phase
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium dark:bg-green-900/20 dark:text-green-400">
                  State: 0
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Voting Phase</p>
                  <p className="text-sm text-muted-foreground">
                    Propose domains and vote on which one to purchase
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900/20 dark:text-blue-400">
                  State: 1
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Purchased Phase</p>
                  <p className="text-sm text-muted-foreground">
                    Voting complete, domain purchased - awaiting
                    fractionalization
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium dark:bg-purple-900/20 dark:text-purple-400">
                  State: 2
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Fractionalized Phase</p>
                  <p className="text-sm text-muted-foreground">
                    Domain ownership distributed as ERC-20 tokens
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium dark:bg-yellow-900/20 dark:text-yellow-400">
                  State: 3
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-amber-900 dark:text-amber-100">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              You must contribute to a pool during the fundraising phase to
              participate in governance
            </li>
            <li>
              Voting power is proportional to your contribution amount (1 USDC =
              1 voting power)
            </li>
            <li>You can only vote once per pool - choose carefully</li>
            <li>
              The voting window has a specific time limit set by the pool
              creator
            </li>
            <li>
              After voting ends, the domain with the most votes will be
              automatically selected
            </li>
            <li>
              All governance happens on-chain via smart contracts - votes are
              immutable
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
