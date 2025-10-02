/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, ShoppingCart, Coins } from "lucide-react"
import { getFractionPoolService, type PoolInfo, type DomainCandidate } from "@/lib/contracts/fraction-pool"
import { getTransactionLink } from "@/lib/contracts/addresses"

interface PurchaseFractionalizeProps {
  poolAddress: string
  poolInfo: PoolInfo
  winningCandidate: DomainCandidate | null
  userContribution: string
  onSuccess: () => void
}

export function PurchaseFractionalize({
  poolAddress,
  poolInfo,
  winningCandidate,
  userContribution,
  onSuccess,
}: PurchaseFractionalizeProps) {
  const [purchaseStep, setPurchaseStep] = useState<'idle' | 'purchasing' | 'recording' | 'fractionalizing' | 'complete'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Purchase form state
  const [orderIdInput, setOrderIdInput] = useState("")
  const [nftContractInput, setNftContractInput] = useState("")
  const [tokenIdInput, setTokenIdInput] = useState("")
  const [purchaseTxHashInput, setPurchaseTxHashInput] = useState("")

  // Fractionalization form state
  const [fractionTokenName, setFractionTokenName] = useState("")
  const [fractionTokenSymbol, setFractionTokenSymbol] = useState("")
  const [fractionTokenAddress, setFractionTokenAddress] = useState("")

  // Check if voting is finalized and pool is in purchasing state
  const canPurchase = poolInfo.state === 1 // Voting state - needs finalization
  const isPurchasing = poolInfo.state === 2 // Purchasing state
  const isPurchased = poolInfo.state === 3 // Purchased state  
  const isFractionalized = poolInfo.state === 4 // Fractionalized state

  /**
   * Finalize voting to move to purchase phase
   */
  const handleFinalizeVoting = async () => {
    try {
      setPurchaseStep('recording')
      setError(null)

      const poolService = await getFractionPoolService(poolAddress)
      const tx = await poolService.finalizeVoting()
      
      setTxHash(tx.hash)
      await tx.wait()

      setPurchaseStep('idle')
      onSuccess()
    } catch (err: any) {
      console.error('Error finalizing voting:', err)
      setError(err.message || 'Failed to finalize voting')
      setPurchaseStep('idle')
    }
  }

  /**
   * Record domain purchase on-chain
   * User must first purchase the domain via DOMA Orderbook API/marketplace
   */
  const handleRecordPurchase = async () => {
    if (!nftContractInput || !tokenIdInput || !purchaseTxHashInput) {
      setError('Please fill in all purchase details')
      return
    }

    try {
      setPurchaseStep('recording')
      setError(null)

      const poolService = await getFractionPoolService(poolAddress)
      const tx = await poolService.recordPurchase(
        purchaseTxHashInput,
        nftContractInput,
        BigInt(tokenIdInput)
      )
      
      setTxHash(tx.hash)
      await tx.wait()

      setPurchaseStep('idle')
      onSuccess()
    } catch (err: any) {
      console.error('Error recording purchase:', err)
      setError(err.message || 'Failed to record purchase')
      setPurchaseStep('idle')
    }
  }

  /**
   * Record fractionalization on-chain
   * User must first fractionalize via DOMA Fractionalization API
   */
  const handleRecordFractionalization = async () => {
    if (!fractionTokenAddress) {
      setError('Please enter the fraction token address')
      return
    }

    try {
      setPurchaseStep('fractionalizing')
      setError(null)

      const poolService = await getFractionPoolService(poolAddress)
      const tx = await poolService.recordFractionalization(fractionTokenAddress)
      
      setTxHash(tx.hash)
      await tx.wait()

      setPurchaseStep('complete')
      onSuccess()
    } catch (err: any) {
      console.error('Error recording fractionalization:', err)
      setError(err.message || 'Failed to record fractionalization')
      setPurchaseStep('idle')
    }
  }

  // If user hasn't contributed, they can't perform these actions
  if (parseFloat(userContribution) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase & Fractionalize</CardTitle>
          <CardDescription>
            Only contributors can participate in the purchase and fractionalization process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Contribute to the pool to unlock this feature.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

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

      {/* Step 1: Finalize Voting */}
      {canPurchase && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Step 1: Finalize Voting
            </CardTitle>
            <CardDescription>
              Finalize the voting period to determine the winning domain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {winningCandidate && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm font-medium mb-1">Winning Domain:</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {winningCandidate.domainName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {Number(winningCandidate.voteCount)} votes
                </p>
              </div>
            )}

            <Button
              onClick={handleFinalizeVoting}
              disabled={purchaseStep === 'recording'}
              className="w-full"
            >
              {purchaseStep === 'recording' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                'Finalize Voting'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Purchase Domain */}
      {(isPurchasing || isPurchased || isFractionalized) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Step 2: Purchase Domain
              {isPurchased && <Badge variant="secondary">Completed</Badge>}
            </CardTitle>
            <CardDescription>
              Purchase the domain NFT via DOMA marketplace, then record the purchase here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPurchased && !isFractionalized && (
              <>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    <strong>Instructions:</strong>
                  </p>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                    <li>Go to DOMA marketplace and purchase the domain NFT</li>
                    <li>Transfer the NFT to this pool address: {poolAddress.slice(0, 10)}...</li>
                    <li>Enter the purchase details below and record the transaction</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="nft-contract">NFT Contract Address</Label>
                    <Input
                      id="nft-contract"
                      placeholder="0x..."
                      value={nftContractInput}
                      onChange={(e) => setNftContractInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="token-id">Token ID</Label>
                    <Input
                      id="token-id"
                      type="number"
                      placeholder="123"
                      value={tokenIdInput}
                      onChange={(e) => setTokenIdInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchase-tx">Purchase Transaction Hash</Label>
                    <Input
                      id="purchase-tx"
                      placeholder="0x..."
                      value={purchaseTxHashInput}
                      onChange={(e) => setPurchaseTxHashInput(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleRecordPurchase}
                    disabled={purchaseStep === 'recording'}
                    className="w-full"
                  >
                    {purchaseStep === 'recording' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      'Record Purchase'
                    )}
                  </Button>
                </div>
              </>
            )}

            {(isPurchased || isFractionalized) && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Domain purchased and recorded successfully
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  NFT: {poolInfo.domainNFT.slice(0, 10)}... Token ID: {poolInfo.domainTokenId.toString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fractionalize Domain */}
      {(isPurchased || isFractionalized) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Step 3: Fractionalize Domain
              {isFractionalized && <Badge variant="secondary">Completed</Badge>}
            </CardTitle>
            <CardDescription>
              Fractionalize the domain NFT into ERC-20 tokens via DOMA Fractionalization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isFractionalized && (
              <>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    <strong>Instructions:</strong>
                  </p>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                    <li>Use DOMA Fractionalization API to fractionalize the NFT</li>
                    <li>Create fractional tokens with custom name and symbol</li>
                    <li>Enter the fraction token address below</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fraction-token">Fraction Token Address</Label>
                    <Input
                      id="fraction-token"
                      placeholder="0x..."
                      value={fractionTokenAddress}
                      onChange={(e) => setFractionTokenAddress(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleRecordFractionalization}
                    disabled={purchaseStep === 'fractionalizing'}
                    className="w-full"
                  >
                    {purchaseStep === 'fractionalizing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      'Record Fractionalization'
                    )}
                  </Button>
                </div>
              </>
            )}

            {isFractionalized && (
              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Domain fractionalized successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Token: {poolInfo.fractionToken.slice(0, 10)}...
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Contributors can now claim their fractional shares!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
