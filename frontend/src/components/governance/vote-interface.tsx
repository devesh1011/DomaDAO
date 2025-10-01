"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoteInterfaceProps {
  proposalId: string
}

export function VoteInterface({ proposalId }: VoteInterfaceProps) {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (voteType: 'yes' | 'no' | 'abstain') => {
    setIsVoting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsVoting(false)

    // In a real app, this would show a toast notification
    alert(`Your ${voteType} vote has been recorded for proposal ${proposalId}`)
  }

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => { e.stopPropagation(); handleVote('yes') }}
        disabled={isVoting}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <CheckCircle className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => { e.stopPropagation(); handleVote('no') }}
        disabled={isVoting}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <XCircle className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => { e.stopPropagation(); handleVote('abstain') }}
        disabled={isVoting}
        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  )
}