"use client"

import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface Proposal {
  id: string
  title: string
  poolName: string
  description: string
  status?: 'passed' | 'failed' | 'executed'
  votes: {
    yes: number
    no: number
    abstain: number
  }
  totalVotingPower: number
  executedAt?: Date
  createdAt: Date
}

interface ProposalsListProps {
  proposals: Proposal[]
  onProposalClick: (proposal: Proposal) => void
}

export function ProposalsList({ proposals, onProposalClick }: ProposalsListProps) {
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Passed</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'executed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Executed</Badge>
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Active</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No proposals found</h3>
        <p className="text-muted-foreground">
          There are no proposals in this category yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => {
        const totalVotes = proposal.votes.yes + proposal.votes.no + proposal.votes.abstain
        const yesPercentage = totalVotes > 0 ? (proposal.votes.yes / totalVotes) * 100 : 0

        return (
          <Card key={proposal.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{proposal.title}</h4>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pool: {proposal.poolName} • Created: {formatDate(proposal.createdAt)}
                    {proposal.executedAt && ` • Executed: ${formatDate(proposal.executedAt)}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onProposalClick(proposal); }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>

              {/* Vote Results Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yes: {proposal.votes.yes}</span>
                  <span>No: {proposal.votes.no}</span>
                  <span>Abstain: {proposal.votes.abstain}</span>
                </div>
                <Progress value={yesPercentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {yesPercentage.toFixed(1)}% approval • {totalVotes} total votes
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}