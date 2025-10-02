/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Gavel, ThumbsUp, ThumbsDown, XCircle } from "lucide-react"
import { getBuyoutHandlerService, BuyoutStatus, type BuyoutOffer } from "@/lib/contracts/buyout-handler"
import { getTransactionLink } from "@/lib/contracts/addresses"
import { ProposeBuyoutForm } from "./propose-buyout-form"

interface BuyoutInterfaceProps {
  poolAddress: string
  fractionTokenAddress: string
  userAddress: string | null
  userTokenBalance: bigint
  onBuyoutUpdate: () => void
}

export function BuyoutInterface({
  poolAddress,
  fractionTokenAddress,
  userAddress,
  userTokenBalance,
  onBuyoutUpdate,
}: BuyoutInterfaceProps) {
  const [buyouts, setBuyouts] = useState<BuyoutOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load buyout offers for this pool
   */
  const loadBuyouts = useCallback(async () => {
    try {
      setLoading(true)
      const service = await getBuyoutHandlerService()
      
      // Get all offers for this pool
      const offers = await service.getPoolOffers(poolAddress)
      setBuyouts(offers)
    } catch (err: any) {
      console.error('Error loading buyouts:', err)
      setError(err.message || 'Failed to load buyout offers')
    } finally {
      setLoading(false)
    }
  }, [poolAddress])

  useEffect(() => {
    loadBuyouts()
  }, [loadBuyouts])

  /**
   * Vote on a buyout offer
   */
  const handleVote = async (offerId: bigint, accept: boolean) => {
    if (userTokenBalance === BigInt(0)) {
      setError('You need fraction tokens to vote')
      return
    }

    try {
      setVoting(true)
      setError(null)

      const service = await getBuyoutHandlerService()
      const tx = await service.voteOnBuyout(offerId, accept, userTokenBalance)
      
      setTxHash(tx.hash)
      await tx.wait()

      onBuyoutUpdate()
      loadBuyouts()
    } catch (err: any) {
      console.error('Error voting on buyout:', err)
      setError(err.message || 'Failed to vote on buyout')
    } finally {
      setVoting(false)
    }
  }

  /**
   * Finalize voting on an offer
   */
  const handleFinalizeVoting = async (offerId: bigint) => {
    try {
      setVoting(true)
      setError(null)

      const service = await getBuyoutHandlerService()
      const tx = await service.finalizeVoting(offerId)
      
      setTxHash(tx.hash)
      await tx.wait()

      onBuyoutUpdate()
      loadBuyouts()
    } catch (err: any) {
      console.error('Error finalizing voting:', err)
      setError(err.message || 'Failed to finalize voting')
    } finally {
      setVoting(false)
    }
  }

  const pendingBuyouts = buyouts.filter(b => b.status === BuyoutStatus.Pending)
  const acceptedBuyouts = buyouts.filter(b => b.status === BuyoutStatus.Accepted)
  const completedBuyouts = buyouts.filter(b => 
    b.status === BuyoutStatus.Executed || 
    b.status === BuyoutStatus.Rejected ||
    b.status === BuyoutStatus.Cancelled
  )

  if (!userAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Buyout Offers
          </CardTitle>
          <CardDescription>
            Connect your wallet to view and vote on buyout offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Token holders can propose and vote on buyout offers to return the domain to single ownership.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Buyout Offers
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  const getBuyoutStatusBadge = (status: BuyoutStatus) => {
    const statusConfig = {
      [BuyoutStatus.Pending]: { label: 'Voting', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      [BuyoutStatus.Accepted]: { label: 'Accepted', variant: 'secondary' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      [BuyoutStatus.Rejected]: { label: 'Rejected', variant: 'secondary' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      [BuyoutStatus.Executed]: { label: 'Executed', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      [BuyoutStatus.Expired]: { label: 'Expired', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      [BuyoutStatus.Cancelled]: { label: 'Cancelled', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    }

    const config = statusConfig[status]
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Transaction Hash */}
      {txHash && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <a 
            href={getTransactionLink(txHash)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 text-sm"
          >
            View transaction <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Buyout Offers
              </CardTitle>
              <CardDescription>
                {buyouts.length} total offer{buyouts.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <ProposeBuyoutForm 
              poolAddress={poolAddress}
              userAddress={userAddress}
              onProposalSuccess={() => {
                loadBuyouts()
                onBuyoutUpdate()
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {pendingBuyouts.length}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-300 mb-1">Accepted</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {acceptedBuyouts.length}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {completedBuyouts.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buyout Offers List */}
      <Card>
        <CardHeader>
          <CardTitle>Active & Historical Offers</CardTitle>
          <CardDescription>All buyout proposals for this pool</CardDescription>
        </CardHeader>
        <CardContent>
          {buyouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gavel className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No buyout offers yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Propose a buyout to purchase the entire domain
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {buyouts.map((buyout) => {
                const totalVotes = Number(buyout.acceptanceVotes) + Number(buyout.rejectionVotes)
                const acceptPercentage = totalVotes > 0 
                  ? (Number(buyout.acceptanceVotes) / totalVotes) * 100 
                  : 0
                const votingEnded = Date.now() / 1000 > Number(buyout.votingDeadline)
                const canVote = buyout.status === BuyoutStatus.Pending && !votingEnded && userTokenBalance > BigInt(0)
                const canFinalize = buyout.status === BuyoutStatus.Pending && votingEnded

                return (
                  <div
                    key={buyout.offerId.toString()}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Offer #{buyout.offerId.toString()}</span>
                          {getBuyoutStatusBadge(buyout.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-bold text-green-600 dark:text-green-400">
                            ${(Number(buyout.offerAmount) / 1e6).toFixed(2)} USDC
                          </span>
                          <span>•</span>
                          <span>
                            By {buyout.buyer.slice(0, 6)}...{buyout.buyer.slice(-4)}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(Number(buyout.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Voting Progress */}
                    {buyout.status === BuyoutStatus.Pending && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            Voting Progress: {acceptPercentage.toFixed(1)}% Accept
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {votingEnded ? 'Voting Ended' : `Ends ${new Date(Number(buyout.votingDeadline) * 1000).toLocaleDateString()}`}
                          </span>
                        </div>
                        <Progress value={acceptPercentage} className="h-2" />
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-green-600 dark:text-green-400">
                            <ThumbsUp className="inline h-3 w-3 mr-1" />
                            {buyout.acceptanceVotes.toString()} Accept
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            <ThumbsDown className="inline h-3 w-3 mr-1" />
                            {buyout.rejectionVotes.toString()} Reject
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Voting Buttons */}
                    {canVote && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVote(buyout.offerId, true)}
                          disabled={voting}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {voting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleVote(buyout.offerId, false)}
                          disabled={voting}
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          {voting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ThumbsDown className="mr-2 h-4 w-4" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Finalize Button */}
                    {canFinalize && (
                      <Button
                        onClick={() => handleFinalizeVoting(buyout.offerId)}
                        disabled={voting}
                        className="w-full"
                      >
                        {voting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Finalizing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Finalize Voting
                          </>
                        )}
                      </Button>
                    )}

                    {/* Result Message */}
                    {buyout.status !== BuyoutStatus.Pending && (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        buyout.status === BuyoutStatus.Executed 
                          ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                          : buyout.status === BuyoutStatus.Accepted
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      }`}>
                        <p className="text-sm">
                          {buyout.status === BuyoutStatus.Executed && (
                            <span className="text-blue-800 dark:text-blue-200">
                              ✓ Buyout executed successfully. Domain transferred to buyer.
                            </span>
                          )}
                          {buyout.status === BuyoutStatus.Accepted && (
                            <span className="text-green-800 dark:text-green-200">
                              ✓ Buyout accepted by token holders. Awaiting execution.
                            </span>
                          )}
                          {buyout.status === BuyoutStatus.Rejected && (
                            <span className="text-red-800 dark:text-red-200">
                              ✗ Buyout rejected by token holders.
                            </span>
                          )}
                          {buyout.status === BuyoutStatus.Cancelled && (
                            <span className="text-gray-800 dark:text-gray-200">
                              ⊘ Buyout cancelled by proposer.
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>How buyouts work:</strong>
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Anyone can propose a buyout offer with USDC</li>
              <li>Token holders vote to accept or reject (weighted by tokens owned)</li>
              <li>60% acceptance required for buyout to pass</li>
              <li>If accepted, domain NFT transfers to buyer, USDC distributed to token holders</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
