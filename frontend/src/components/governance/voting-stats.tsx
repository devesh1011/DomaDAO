"use client"

import { Vote, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function VotingStats() {
  // Mock data - in a real app, this would come from API
  const stats = {
    proposalsVoted: 12,
    participationRate: 85.3,
    averageVotingPower: 156,
    poolsWithGovernance: 5
  }

  const recentVotes = [
    { proposal: "List premium.ai domain", vote: "Yes", date: "2 days ago" },
    { proposal: "Increase revenue distribution", vote: "Yes", date: "1 week ago" },
    { proposal: "Add DEX liquidity", vote: "No", date: "2 weeks ago" }
  ]

  return (
    <div className="space-y-6">
      {/* Voting Stats Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            My Voting Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.proposalsVoted}</div>
              <div className="text-xs text-muted-foreground">Proposals Voted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.participationRate}%</div>
              <div className="text-xs text-muted-foreground">Participation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.averageVotingPower}</div>
              <div className="text-xs text-muted-foreground">Avg Voting Power</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.poolsWithGovernance}</div>
              <div className="text-xs text-muted-foreground">Governance Pools</div>
            </div>
          </div>

          {/* Participation Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Participation Rate</span>
              <span>{stats.participationRate}%</span>
            </div>
            <Progress value={stats.participationRate} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              Above average participation
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Voting Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Votes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentVotes.map((vote, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{vote.proposal}</p>
                  <p className="text-xs text-muted-foreground">{vote.date}</p>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded ${
                  vote.vote === 'Yes'
                    ? 'bg-green-100 text-green-800'
                    : vote.vote === 'No'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {vote.vote}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Governance Pools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Governance Pools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "premium.ai", shares: 150, votingPower: 150 },
              { name: "revenue-pool", shares: 200, votingPower: 200 },
              { name: "dex-liquidity", shares: 89, votingPower: 89 },
              { name: "governance", shares: 75, votingPower: 75 },
              { name: "web3-domains", shares: 120, votingPower: 120 }
            ].map((pool, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{pool.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pool.shares} shares • {pool.votingPower} votes
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Active
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}