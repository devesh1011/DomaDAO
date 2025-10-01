"use client"

import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VoteInterface } from "./vote-interface"

interface Proposal {
  id: string
  title: string
  poolName: string
  description: string
  deadline: Date
  votes: {
    yes: number
    no: number
    abstain: number
  }
  totalVotingPower: number
  userVotingPower: number
  userVote: string | null
  proposer: string
  createdAt: Date
}

interface ProposalCardProps {
  proposal: Proposal
  onClick: () => void
}

export function ProposalCard({ proposal, onClick }: ProposalCardProps) {
  const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain
  const yesPercentage = totalVotes > 0 ? (proposal.votes.yes / totalVotes) * 100 : 0
  const noPercentage = totalVotes > 0 ? (proposal.votes.no / totalVotes) * 100 : 0
  const abstainPercentage = totalVotes > 0 ? (proposal.votes.abstain / totalVotes) * 100 : 0

  const timeLeft = proposal.deadline.getTime() - Date.now()
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60))

  const getTimeDisplay = () => {
    if (daysLeft > 1) return `${daysLeft} days left`
    if (hoursLeft > 1) return `${hoursLeft} hours left`
    return "Ending soon"
  }

  const getVoteStatus = () => {
    if (!proposal.userVote) return { text: "Not voted", variant: "outline" as const }
    if (proposal.userVote === "yes") return { text: "Voted Yes", variant: "default" as const }
    if (proposal.userVote === "no") return { text: "Voted No", variant: "destructive" as const }
    return { text: "Abstained", variant: "secondary" as const }
  }

  const voteStatus = getVoteStatus()

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{proposal.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Pool: {proposal.poolName}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {proposal.description}
              </p>
            </div>
            <Badge variant={voteStatus.variant} className="ml-4">
              {voteStatus.text}
            </Badge>
          </div>

          {/* Voting Deadline */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{getTimeDisplay()}</span>
          </div>

          {/* Vote Results */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Yes: {proposal.votes.yes} votes ({yesPercentage.toFixed(1)}%)</span>
              <span>No: {proposal.votes.no} votes ({noPercentage.toFixed(1)}%)</span>
              <span>Abstain: {proposal.votes.abstain} votes ({abstainPercentage.toFixed(1)}%)</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500 flex-shrink-0" />
                <Progress value={yesPercentage} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {yesPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500 flex-shrink-0" />
                <Progress value={noPercentage} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {noPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500 flex-shrink-0" />
                <Progress value={abstainPercentage} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {abstainPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Voting Power & Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Your voting power: <span className="font-medium">{proposal.userVotingPower} shares</span>
            </div>
            <div className="flex gap-2">
              {!proposal.userVote && (
                <VoteInterface proposalId={proposal.id} />
              )}
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}