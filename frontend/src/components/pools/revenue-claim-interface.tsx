/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, DollarSign, TrendingUp } from "lucide-react"
import { getRevenueDistributorService, type DistributionInfo, type ClaimStatus } from "@/lib/contracts/revenue-distributor"
import { getTransactionLink } from "@/lib/contracts/addresses"

interface RevenueClaimInterfaceProps {
  poolAddress: string
  fractionTokenAddress: string
  userAddress: string | null
  onClaimSuccess: () => void
}

export function RevenueClaimInterface({
  poolAddress,
  fractionTokenAddress,
  userAddress,
  onClaimSuccess,
}: RevenueClaimInterfaceProps) {
  const [distributions, setDistributions] = useState<DistributionInfo[]>([])
  const [claimStatuses, setClaimStatuses] = useState<ClaimStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load distributions and claim statuses
   */
  const loadDistributions = useCallback(async () => {
    if (!userAddress) return

    try {
      setLoading(true)
      const service = await getRevenueDistributorService()
      
      // Get all distributions
      const dists = await service.getAllDistributions()
      setDistributions(dists)

      // Get claim statuses
      const statuses = await service.getUserClaimStatuses(userAddress)
      setClaimStatuses(statuses)
    } catch (err: any) {
      console.error('Error loading distributions:', err)
      setError(err.message || 'Failed to load distributions')
    } finally {
      setLoading(false)
    }
  }, [userAddress])

  useEffect(() => {
    loadDistributions()
  }, [loadDistributions])

  /**
   * Claim from a single distribution
   */
  const handleClaim = async (distributionId: bigint) => {
    try {
      setClaiming(true)
      setError(null)

      const service = await getRevenueDistributorService()
      const tx = await service.claim(distributionId)
      
      setTxHash(tx.hash)
      await tx.wait()

      onClaimSuccess()
      loadDistributions()
    } catch (err: any) {
      console.error('Error claiming revenue:', err)
      setError(err.message || 'Failed to claim revenue')
    } finally {
      setClaiming(false)
    }
  }

  /**
   * Claim from all unclaimed distributions
   */
  const handleClaimAll = async () => {
    try {
      setClaiming(true)
      setError(null)

      const unclaimedIds = claimStatuses
        .filter(status => !status.hasClaimed)
        .map(status => status.distributionId)

      if (unclaimedIds.length === 0) {
        setError('No unclaimed distributions')
        return
      }

      const service = await getRevenueDistributorService()
      const tx = await service.claimMultiple(unclaimedIds)
      
      setTxHash(tx.hash)
      await tx.wait()

      onClaimSuccess()
      loadDistributions()
    } catch (err: any) {
      console.error('Error claiming all revenue:', err)
      setError(err.message || 'Failed to claim revenue')
    } finally {
      setClaiming(false)
    }
  }

  // Calculate total unclaimed
  const totalUnclaimed = distributions
    .filter((_, index) => !claimStatuses[index]?.hasClaimed)
    .reduce((sum, dist) => sum + Number(dist.totalAmount), 0)

  const unclaimedCount = claimStatuses.filter(s => !s.hasClaimed).length

  if (!userAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Distribution
          </CardTitle>
          <CardDescription>
            Connect your wallet to view and claim revenue distributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Revenue from domain ownership is distributed to fraction token holders.
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
            <DollarSign className="h-5 w-5" />
            Revenue Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
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
                <TrendingUp className="h-5 w-5" />
                Revenue Summary
              </CardTitle>
              <CardDescription>
                {distributions.length} total distribution{distributions.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            {unclaimedCount > 0 && (
              <Button
                onClick={handleClaimAll}
                disabled={claiming}
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                {claiming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Claim All ({unclaimedCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Distributed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${(distributions.reduce((sum, d) => sum + Number(d.totalAmount), 0) / 1e6).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Unclaimed Revenue</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${(totalUnclaimed / 1e6).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distributions List */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution History</CardTitle>
          <CardDescription>All revenue distributions for this pool</CardDescription>
        </CardHeader>
        <CardContent>
          {distributions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No distributions yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Revenue will appear here once distributed by the pool owner
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {distributions.map((dist, index) => {
                const status = claimStatuses[index]
                const hasClaimed = status?.hasClaimed || false
                const amount = Number(dist.totalAmount) / 1e6

                return (
                  <div
                    key={dist.id.toString()}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Distribution #{dist.id.toString()}</span>
                        {hasClaimed ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Claimed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${amount.toFixed(2)} USDC
                        </span>
                        <span>
                          {new Date(Number(dist.timestamp) * 1000).toLocaleDateString()}
                        </span>
                        <span>
                          {((Number(dist.claimedAmount) / Number(dist.totalAmount)) * 100).toFixed(0)}% claimed
                        </span>
                      </div>
                    </div>
                    {!hasClaimed && (
                      <Button
                        onClick={() => handleClaim(dist.id)}
                        disabled={claiming}
                        size="sm"
                        variant="outline"
                        className="ml-4"
                      >
                        {claiming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Claim'
                        )}
                      </Button>
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
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>How it works:</strong> Domain revenue is distributed proportionally to all fraction token holders
              based on their token balance at the time of distribution. You can claim your share at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
