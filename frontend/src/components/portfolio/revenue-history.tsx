"use client"

import { useState } from "react"
import { ExternalLink, CheckCircle, Clock, Coins } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface RevenueEntry {
  id: string
  poolName: string
  amount: number
  date: string
  transactionHash: string
  claimed: boolean
}

const mockRevenueHistory: RevenueEntry[] = [
  {
    id: "1",
    poolName: "crypto.eth",
    amount: 45.50,
    date: "2024-09-28",
    transactionHash: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    claimed: true
  },
  {
    id: "2",
    poolName: "web3.nft",
    amount: 32.25,
    date: "2024-09-25",
    transactionHash: "0x8ba1f109551bD432803012645261768374161972",
    claimed: true
  },
  {
    id: "3",
    poolName: "dao.org",
    amount: 67.80,
    date: "2024-09-20",
    transactionHash: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
    claimed: false
  },
  {
    id: "4",
    poolName: "blockchain.xyz",
    amount: 28.90,
    date: "2024-09-15",
    transactionHash: "0x28C6c06298d514Db089934071355E5743bf21d60",
    claimed: true
  },
  {
    id: "5",
    poolName: "defi.domains",
    amount: 19.75,
    date: "2024-09-10",
    transactionHash: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
    claimed: true
  }
]

export function RevenueHistory() {
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleClaimRevenue = async (entryId: string) => {
    setClaimingId(entryId)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setClaimingId(null)
    // In real app, update the entry status
  }

  const unclaimedEntries = mockRevenueHistory.filter(entry => !entry.claimed)
  const totalUnclaimed = unclaimedEntries.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue History</CardTitle>
          {unclaimedEntries.length > 0 && (
            <Button
              onClick={() => handleClaimRevenue("all")}
              disabled={claimingId === "all"}
              className="bg-green-600 hover:bg-green-700"
            >
              <Coins className="h-4 w-4 mr-2" />
              {claimingId === "all" ? "Claiming..." : `Claim All (${formatCurrency(totalUnclaimed)})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockRevenueHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  entry.claimed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {entry.claimed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{entry.poolName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(entry.date)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(entry.amount)}</div>
                  <div className="text-xs text-muted-foreground">
                    ≈ {(entry.amount / 2500).toFixed(4)} ETH
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={entry.claimed ? "secondary" : "default"}>
                    {entry.claimed ? "Claimed" : "Pending"}
                  </Badge>

                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`https://etherscan.io/tx/${entry.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>

                  {!entry.claimed && (
                    <Button
                      size="sm"
                      onClick={() => handleClaimRevenue(entry.id)}
                      disabled={claimingId === entry.id}
                    >
                      {claimingId === entry.id ? "Claiming..." : "Claim"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {mockRevenueHistory.length === 0 && (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Revenue History</h3>
            <p className="text-muted-foreground">
              You haven&apos;t earned any revenue from your investments yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}