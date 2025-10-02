/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Gavel } from "lucide-react"
import { getBuyoutHandlerService } from "@/lib/contracts/buyout-handler"
import { getMockUSDCService } from "@/lib/contracts/usdc"
import { getContractAddress } from "@/lib/contracts/addresses"

interface ProposeBuyoutFormProps {
  poolAddress: string
  userAddress: string | null
  onProposalSuccess: () => void
}

export function ProposeBuyoutForm({
  poolAddress,
  userAddress,
  onProposalSuccess,
}: ProposeBuyoutFormProps) {
  const [open, setOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState("")
  const [daysValid, setDaysValid] = useState("30")
  const [submitting, setSubmitting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [hasApproval, setHasApproval] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Check USDC approval
   */
  const checkApproval = async () => {
    if (!userAddress || !offerAmount) return

    try {
      const usdcService = await getMockUSDCService()
      const buyoutHandlerAddress = getContractAddress('BuyoutHandler')
      const amountRaw = BigInt(Math.floor(parseFloat(offerAmount) * 1e6))
      
      const allowance = await usdcService.allowanceRaw(userAddress, buyoutHandlerAddress)
      setHasApproval(allowance >= amountRaw)
    } catch (err: any) {
      console.error('Error checking approval:', err)
    }
  }

  /**
   * Approve USDC spending
   */
  const handleApproval = async () => {
    try {
      setApproving(true)
      setError(null)

      const usdcService = await getMockUSDCService()
      const buyoutHandlerAddress = getContractAddress('BuyoutHandler')
      const amountRaw = BigInt(Math.floor(parseFloat(offerAmount) * 1e6))
      
      const tx = await usdcService.approve(buyoutHandlerAddress, offerAmount)
      await tx.wait()

      setHasApproval(true)
    } catch (err: any) {
      console.error('Error approving USDC:', err)
      setError(err.message || 'Failed to approve USDC')
    } finally {
      setApproving(false)
    }
  }

  /**
   * Submit buyout proposal
   */
  const handleSubmit = async () => {
    if (!offerAmount || !daysValid) {
      setError('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const service = await getBuyoutHandlerService()
      const amountRaw = BigInt(Math.floor(parseFloat(offerAmount) * 1e6))
      const expirationTime = BigInt(Math.floor(Date.now() / 1000) + (parseInt(daysValid) * 86400))
      
      const tx = await service.proposeBuyout(poolAddress, amountRaw, expirationTime)
      await tx.wait()

      setOpen(false)
      setOfferAmount("")
      setDaysValid("30")
      setHasApproval(false)
      onProposalSuccess()
    } catch (err: any) {
      console.error('Error proposing buyout:', err)
      setError(err.message || 'Failed to propose buyout')
    } finally {
      setSubmitting(false)
    }
  }

  // Check approval when amount changes
  const handleAmountChange = (value: string) => {
    setOfferAmount(value)
    setHasApproval(false)
    if (value && parseFloat(value) > 0) {
      setTimeout(() => checkApproval(), 500)
    }
  }

  if (!userAddress) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Gavel className="mr-2 h-4 w-4" />
          Propose Buyout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Propose Buyout Offer</DialogTitle>
          <DialogDescription>
            Make an offer to buy out the entire fractionalized domain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Offer Amount */}
          <div>
            <Label htmlFor="offer-amount">Offer Amount (USDC)</Label>
            <Input
              id="offer-amount"
              type="number"
              placeholder="1000"
              value={offerAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={submitting || approving}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Amount you&apos;re willing to pay for the entire domain
            </p>
          </div>

          {/* Days Valid */}
          <div>
            <Label htmlFor="days-valid">Offer Valid For (Days)</Label>
            <Input
              id="days-valid"
              type="number"
              placeholder="30"
              value={daysValid}
              onChange={(e) => setDaysValid(e.target.value)}
              disabled={submitting || approving}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              How long the offer remains valid
            </p>
          </div>

          {/* Approval Status */}
          {offerAmount && parseFloat(offerAmount) > 0 && (
            <div className={`p-3 rounded-lg border text-sm ${
              hasApproval 
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
            }`}>
              {hasApproval ? (
                <p className="text-green-800 dark:text-green-200">
                  ✓ USDC approved for buyout
                </p>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    USDC approval required
                  </p>
                  <Button
                    size="sm"
                    onClick={handleApproval}
                    disabled={approving}
                  >
                    {approving ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      'Approve'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Your USDC will be held in escrow until the voting period ends. 
              If accepted and executed, you receive the NFT. If rejected, you can withdraw your funds.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || approving || !hasApproval || !offerAmount || !daysValid}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Proposing...
              </>
            ) : (
              <>
                <Gavel className="mr-2 h-4 w-4" />
                Propose Buyout
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
