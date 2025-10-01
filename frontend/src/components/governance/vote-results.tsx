"use client"

import { CheckCircle, XCircle, Minus, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface VoteResultsProps {
  votes: {
    yes: number
    no: number
    abstain: number
  }
}

export function VoteResults({ votes }: VoteResultsProps) {
  const totalVotes = votes.yes + votes.no + votes.abstain
  const yesPercentage = totalVotes > 0 ? (votes.yes / totalVotes) * 100 : 0
  const noPercentage = totalVotes > 0 ? (votes.no / totalVotes) * 100 : 0
  const abstainPercentage = totalVotes > 0 ? (votes.abstain / totalVotes) * 100 : 0

  const getWinningVote = () => {
    if (votes.yes > votes.no && votes.yes > votes.abstain) return 'yes'
    if (votes.no > votes.yes && votes.no > votes.abstain) return 'no'
    if (votes.abstain > votes.yes && votes.abstain > votes.no) return 'abstain'
    return 'tie'
  }

  const winningVote = getWinningVote()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Vote Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="text-center">
          <div className="text-2xl font-bold">{totalVotes}</div>
          <div className="text-sm text-muted-foreground">Total Votes Cast</div>
        </div>

        {/* Vote Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Yes</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{votes.yes}</div>
              <div className="text-xs text-muted-foreground">{yesPercentage.toFixed(1)}%</div>
            </div>
          </div>
          <Progress value={yesPercentage} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">No</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{votes.no}</div>
              <div className="text-xs text-muted-foreground">{noPercentage.toFixed(1)}%</div>
            </div>
          </div>
          <Progress value={noPercentage} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Abstain</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{votes.abstain}</div>
              <div className="text-xs text-muted-foreground">{abstainPercentage.toFixed(1)}%</div>
            </div>
          </div>
          <Progress value={abstainPercentage} className="h-2" />
        </div>

        {/* Winning Vote Indicator */}
        {totalVotes > 0 && winningVote !== 'tie' && (
          <div className="pt-2 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Leading</div>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                winningVote === 'yes'
                  ? 'bg-green-100 text-green-800'
                  : winningVote === 'no'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {winningVote === 'yes' && <CheckCircle className="h-3 w-3" />}
                {winningVote === 'no' && <XCircle className="h-3 w-3" />}
                {winningVote === 'abstain' && <Minus className="h-3 w-3" />}
                {winningVote.charAt(0).toUpperCase() + winningVote.slice(1)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}