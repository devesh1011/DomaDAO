"use client"

import { useState } from "react"
import { Plus, Vote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProposalCard } from "./proposal-card"
import { ProposalsList } from "./proposals-list"
import { VotingStats } from "./voting-stats"
import { CreateProposalModal } from "./create-proposal-modal"
import { ProposalModal } from "./proposal-modal"

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
  proposer?: string
  createdAt: Date
  executedAt?: Date
}

// Mock data for proposals
const mockActiveProposals = [
  {
    id: "1",
    title: "List premium.ai domain for 100 ETH",
    poolName: "premium.ai",
    description: "Proposal to list the premium.ai domain in our marketplace with an initial valuation of 100 ETH. This domain has high commercial value and strong brand recognition.",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    votes: {
      yes: 1250,
      no: 340,
      abstain: 89
    },
    totalVotingPower: 1679,
    userVotingPower: 150,
    userVote: null, // null, 'yes', 'no', 'abstain'
    proposer: "0x742d...a9f2",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: "2",
    title: "Increase revenue distribution to 80%",
    poolName: "revenue-pool",
    description: "Proposal to increase the revenue distribution percentage from 70% to 80% for all pool participants. This would provide higher returns to investors.",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    votes: {
      yes: 890,
      no: 567,
      abstain: 123
    },
    totalVotingPower: 1580,
    userVotingPower: 200,
    userVote: "yes",
    proposer: "0x8b2d...c4f1",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
]

const mockAllProposals = [
  ...mockActiveProposals,
  {
    id: "3",
    title: "Add liquidity to DEX pool",
    poolName: "dex-liquidity",
    description: "Proposal to add $50,000 in liquidity to the DEX pool to improve trading efficiency.",
    status: "passed",
    votes: { yes: 1200, no: 300, abstain: 50 },
    totalVotingPower: 1550,
    executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  },
  {
    id: "4",
    title: "Update governance parameters",
    poolName: "governance",
    description: "Proposal to update voting quorum requirements from 51% to 60%.",
    status: "failed",
    votes: { yes: 400, no: 800, abstain: 100 },
    totalVotingPower: 1300,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  }
]

export function GovernancePage() {
  const [filter, setFilter] = useState("all") // "all" or "your-pools"
  const [activeTab, setActiveTab] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [showProposalModal, setShowProposalModal] = useState(false)

  const handleProposalClick = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setShowProposalModal(true)
  }

  const filteredProposals = mockActiveProposals.filter(proposal => {
    if (filter === "your-pools") {
      // In a real app, this would check if the user has shares in this pool
      return proposal.userVotingPower > 0
    }
    return true
  })

  const getFilteredProposals = (status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mockAllProposals as any[]).filter((proposal) => {
      if (status === "all") return true
      return proposal.status === status
    })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Governance Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Governance</h2>
          <p className="text-muted-foreground">
            Participate in DAO governance and vote on proposals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pools</SelectItem>
              <SelectItem value="your-pools">Your Pools</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Proposals Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Active Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProposals.length > 0 ? (
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onClick={() => handleProposalClick(proposal)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active proposals</h3>
                  <p className="text-muted-foreground mb-4">
                    There are currently no active proposals to vote on.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Proposal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voting History Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="passed">Passed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                  <TabsTrigger value="executed">Executed</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <ProposalsList
                    proposals={getFilteredProposals("all")}
                    onProposalClick={handleProposalClick}
                  />
                </TabsContent>

                <TabsContent value="passed" className="mt-6">
                  <ProposalsList
                    proposals={getFilteredProposals("passed")}
                    onProposalClick={handleProposalClick}
                  />
                </TabsContent>

                <TabsContent value="failed" className="mt-6">
                  <ProposalsList
                    proposals={getFilteredProposals("failed")}
                    onProposalClick={handleProposalClick}
                  />
                </TabsContent>

                <TabsContent value="executed" className="mt-6">
                  <ProposalsList
                    proposals={getFilteredProposals("executed")}
                    onProposalClick={handleProposalClick}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <VotingStats />
        </div>
      </div>

      {/* Modals */}
      <CreateProposalModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      <ProposalModal
        proposal={selectedProposal}
        open={showProposalModal}
        onOpenChange={setShowProposalModal}
      />
    </div>
  )
}