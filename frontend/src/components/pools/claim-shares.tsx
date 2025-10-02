/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Gift } from "lucide-react"
import { getFractionPoolService, type PoolInfo } from "@/lib/contracts/fraction-pool"
import { getTransactionLink } from "@/lib/contracts/addresses"

interface ClaimSharesProps {
  poolAddress: string
  poolInfo: PoolInfo
  userAddress: string | null
  userContribution: string
  onSuccess: () => void
}

export function ClaimShares({
  poolAddress,
  poolInfo,
  userAddress,
  userContribution,
  onSuccess,
}: ClaimSharesProps) {
  const [claimableShares, setClaimableShares] = useState<bigint>(BigInt(0))
  const [hasClaimed, setHasClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isFractionalized = poolInfo.state === 4 // Fractionalized state

  /**
   * Load claimable shares
   */
  const loadClaimableShares = useCallback(async () => {
    if (!userAddress || !isFractionalized) return

    try {
      const poolService = await getFractionPoolService(poolAddress)
      const shares = await poolService.getClaimableShares(userAddress)
      setClaimableShares(shares)

      // Check if user has already claimed
      const claimed = await poolService.hasClaimedShares(userAddress)
      setHasClaimed(claimed)
    } catch (err: any) {
      console.error('Error loading claimable shares:', err)
    }
  }, [poolAddress, userAddress, isFractionalized])

  useEffect(() => {
    loadClaimableShares()
  }, [loadClaimableShares])

  /**
   * Claim fractional shares
   */
  const handleClaimShares = async () => {
    try {
      setClaiming(true)
      setError(null)

      const poolService = await getFractionPoolService(poolAddress)
      const tx = await poolService.claimShares()
      
      setTxHash(tx.hash)
      await tx.wait()

      setHasClaimed(true)
      onSuccess()
    } catch (err: any) {
      console.error('Error claiming shares:', err)
      setError(err.message || 'Failed to claim shares')
    } finally {
      setClaiming(false)
    }
  }

  // If not fractionalized yet, show waiting state
  if (!isFractionalized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Claim Fractional Shares
          </CardTitle>
          <CardDescription>
            Claim your fractional ownership tokens once the domain is fractionalized
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The domain must be purchased and fractionalized before you can claim your shares.
          </p>
        </CardContent>
      </Card>
    )
  }

  // If user hasn't contributed, they can't claim
  if (!userAddress || parseFloat(userContribution) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Claim Fractional Shares
          </CardTitle>
          <CardDescription>
            Only contributors can claim fractional shares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You didn&apos;t contribute to this pool, so you don&apos;t have any shares to claim.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Claim Fractional Shares
          {hasClaimed && <Badge variant="secondary">Claimed</Badge>}
        </CardTitle>
        <CardDescription>
          Claim your proportional share of the fractionalized domain tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Claimable Shares Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Your Contribution:</span>
            <span className="font-medium">{userContribution} USDC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Claimable Shares:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {claimableShares.toString()} tokens
            </span>
          </div>
        </div>

        {/* Token Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
            <strong>Fraction Token Address:</strong>
          </p>
          <code className="text-xs text-blue-600 dark:text-blue-400 break-all">
            {poolInfo.fractionToken}
          </code>
        </div>

        {/* Claim Button or Status */}
        {hasClaimed ? (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">
                You&apos;ve already claimed your shares!
              </p>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-2">
              Check your wallet for the fraction tokens.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleClaimShares}
            disabled={claiming || claimableShares === BigInt(0)}
            className="w-full"
          >
            {claiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Claim {claimableShares.toString()} Tokens
              </>
            )}
          </Button>
        )}

        {/* Instructions */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> Your share allocation is proportional to your contribution. 
            Claiming is a one-time action. Make sure to add the token to your wallet to see your balance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
