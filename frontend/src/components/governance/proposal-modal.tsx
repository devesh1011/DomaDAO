"use client"

import { X, ExternalLink, CheckCircle, XCircle, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VoteInterface } from "./vote-interface"
import { VoteResults } from "./vote-results"

interface Proposal {
  id: string
  title: string
  poolName: string
  description: string
  deadline?: Date
  status?: 'passed' | 'failed' | 'executed'
  votes: {
    yes: number
    no: number
    abstain: number
  }
  totalVotingPower: number
  userVotingPower?: number
  userVote?: string | null
  proposer: string
  createdAt: Date
  executedAt?: Date
}

interface ProposalModalProps {
  proposal: Proposal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProposalModal({ proposal, open, onOpenChange }: ProposalModalProps) {
  if (!open || !proposal) return null

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isActive = !proposal.status
  const timeLeft = proposal.deadline ? proposal.deadline.getTime() - Date.now() : 0
  const daysLeft = timeLeft > 0 ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(proposal.status)}
                <span className="text-sm text-muted-foreground">
                  Pool: {proposal.poolName}
                </span>
              </div>
              {isActive && daysLeft > 0 && (
                <p className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {daysLeft} days remaining
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Proposal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {proposal.description}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Proposer</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {proposal.proposer}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(proposal.createdAt)}
                  </span>
                </div>
                {proposal.executedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Executed</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(proposal.executedAt)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Voting Power</span>
                  <span className="text-sm text-muted-foreground">
                    {proposal.totalVotingPower} shares
                  </span>
                </div>
              </div>
            </div>

            {/* Voting Section */}
            <div className="space-y-4">
              <VoteResults votes={proposal.votes} />

              {isActive && proposal.userVotingPower && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Voting Power</span>
                    <span className="text-sm text-muted-foreground">
                      {proposal.userVotingPower} shares
                    </span>
                  </div>

                  {!proposal.userVote && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Cast your vote:</p>
                      <VoteInterface proposalId={proposal.id} />
                    </div>
                  )}

                  {proposal.userVote && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Your Vote:</span>
                      <Badge variant={
                        proposal.userVote === 'yes' ? 'default' :
                        proposal.userVote === 'no' ? 'destructive' : 'secondary'
                      }>
                        {proposal.userVote === 'yes' ? 'Yes' :
                         proposal.userVote === 'no' ? 'No' : 'Abstain'}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Discussion Section (placeholder) */}
          <div>
            <h3 className="font-semibold mb-3">Discussion</h3>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Discussion feature coming soon. For now, proposals are discussed on Discord.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                <ExternalLink className="h-4 w-4 mr-1" />
                Join Discord Discussion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}