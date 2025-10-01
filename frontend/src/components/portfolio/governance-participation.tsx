"use client"

import { Vote, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface Proposal {
  id: string
  title: string
  poolName: string
  status: "Active" | "Passed" | "Failed" | "Executed"
  voted: boolean
  vote?: "Yes" | "No" | "Abstain"
  deadline?: string
  totalVotes: number
  yourVotes: number
}

interface VotingHistory {
  id: string
  proposalTitle: string
  poolName: string
  vote: "Yes" | "No" | "Abstain"
  date: string
  outcome: "Passed" | "Failed"
}

const mockActiveProposals: Proposal[] = [
  {
    id: "1",
    title: "List premium.ai for 100 ETH",
    poolName: "crypto.eth",
    status: "Active",
    voted: false,
    deadline: "2024-10-05",
    totalVotes: 1250,
    yourVotes: 150
  },
  {
    id: "2",
    title: "Extend funding period by 30 days",
    poolName: "web3.nft",
    status: "Active",
    voted: true,
    vote: "Yes",
    deadline: "2024-10-08",
    totalVotes: 890,
    yourVotes: 234
  }
]

const mockVotingHistory: VotingHistory[] = [
  {
    id: "1",
    proposalTitle: "Update revenue distribution formula",
    poolName: "dao.org",
    vote: "Yes",
    date: "2024-09-15",
    outcome: "Passed"
  },
  {
    id: "2",
    proposalTitle: "Add new domain to portfolio",
    poolName: "blockchain.xyz",
    vote: "No",
    date: "2024-09-08",
    outcome: "Failed"
  },
  {
    id: "3",
    proposalTitle: "Increase minimum investment",
    poolName: "defi.domains",
    vote: "Abstain",
    date: "2024-09-01",
    outcome: "Passed"
  }
]

export function GovernanceParticipation() {
  const totalProposals = mockVotingHistory.length + mockActiveProposals.length
  const votedProposals = mockVotingHistory.length + mockActiveProposals.filter(p => p.voted).length
  const participationRate = totalProposals > 0 ? Math.round((votedProposals / totalProposals) * 100) : 0

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case "Yes": return "text-green-600 bg-green-50"
      case "No": return "text-red-600 bg-red-50"
      case "Abstain": return "text-yellow-600 bg-yellow-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const getOutcomeColor = (outcome: string) => {
    return outcome === "Passed" ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Proposals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Active Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActiveProposals.map((proposal) => (
              <div key={proposal.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{proposal.title}</h4>
                    <p className="text-sm text-muted-foreground">{proposal.poolName}</p>
                  </div>
                  <Badge variant={proposal.voted ? "secondary" : "default"}>
                    {proposal.voted ? "Voted" : "Pending"}
                  </Badge>
                </div>

                {proposal.voted && proposal.vote && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">Your vote:</span>
                    <Badge className={getVoteColor(proposal.vote)}>
                      {proposal.vote}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span>Your voting power: {proposal.yourVotes} votes</span>
                  {proposal.deadline && (
                    <span className="text-muted-foreground">
                      Ends: {new Date(proposal.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {!proposal.voted && (
                  <Button className="w-full mt-3" size="sm">
                    Cast Your Vote
                  </Button>
                )}
              </div>
            ))}

            {mockActiveProposals.length === 0 && (
              <div className="text-center py-8">
                <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Proposals</h3>
                <p className="text-muted-foreground">
                  There are no proposals requiring your vote at this time.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voting History & Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Voting History & Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Participation Stats */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Participation Rate</span>
              <span className="text-sm text-muted-foreground">{participationRate}%</span>
            </div>
            <Progress value={participationRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{votedProposals} voted</span>
              <span>{totalProposals} total</span>
            </div>
          </div>

          {/* Voting History */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Votes
            </h4>

            {mockVotingHistory.map((history) => (
              <div key={history.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{history.proposalTitle}</div>
                  <div className="text-xs text-muted-foreground">
                    {history.poolName} • {new Date(history.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getVoteColor(history.vote)}>
                    {history.vote}
                  </Badge>
                  <span className={`text-xs ${getOutcomeColor(history.outcome)}`}>
                    {history.outcome}
                  </span>
                </div>
              </div>
            ))}

            {mockVotingHistory.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No voting history yet.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}