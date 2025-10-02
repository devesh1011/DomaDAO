/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Plus, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useWallet } from "@/contexts/wallet-context"
import { getFractionPoolService } from "@/lib/contracts/fraction-pool"
import { getTransactionLink } from "@/lib/contracts/addresses"

interface ProposeCandidateFormProps {
  poolAddress: string
  userContribution: string
  onProposalSuccess?: () => void
}

export function ProposeCandidateForm({ 
  poolAddress, 
  userContribution,
  onProposalSuccess 
}: ProposeCandidateFormProps) {
  const { isConnected, isCorrectNetwork, connectWallet, switchToDomaNetwork } = useWallet()
  
  const [open, setOpen] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ 
    type: null, 
    message: '' 
  })

  const [formData, setFormData] = useState({
    domainName: "",
    domainUrl: "",
    estimatedValue: "",
    nftContract: "0x2D40FE0Ea341d42158a1827c5398f28B783bE803", // TODO: Replace with real domain NFT contract
    tokenId: "",
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message })
    setTimeout(() => setStatus({ type: null, message: '' }), 8000)
  }

  /**
   * Handle candidate proposal
   */
  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      showToast('error', 'Please connect your wallet first')
      await connectWallet()
      return
    }

    if (!isCorrectNetwork) {
      showToast('error', 'Please switch to DOMA Testnet')
      await switchToDomaNetwork()
      return
    }

    if (parseFloat(userContribution) === 0) {
      showToast('error', 'You must contribute to the pool to propose candidates')
      return
    }

    if (!formData.domainName.trim()) {
      showToast('error', 'Please enter a domain name')
      return
    }

    setProposing(true)
    setTxHash(null)

    try {
      const poolService = await getFractionPoolService(poolAddress)

      showToast('success', 'Please confirm the transaction in MetaMask...')
      const tx = await poolService.proposeCandidate(
        formData.domainName,
        formData.nftContract,
        formData.tokenId
      )

      setTxHash(tx.hash)
      showToast('success', `Proposal submitted! Hash: ${tx.hash.slice(0, 10)}...`)

      showToast('success', 'Waiting for confirmation...')
      await tx.wait()

      showToast('success', 'Candidate proposed successfully!')
      
      // Reset form
      setFormData({
        domainName: "",
        domainUrl: "",
        estimatedValue: "",
        nftContract: "0x2D40FE0Ea341d42158a1827c5398f28B783bE803",
        tokenId: "1"
      })

      // Close dialog after success
      setTimeout(() => {
        setOpen(false)
        if (onProposalSuccess) {
          onProposalSuccess()
        }
      }, 2000)
    } catch (error: any) {
      console.error('Error proposing candidate:', error)

      if (error.code === 'ACTION_REJECTED') {
        showToast('error', 'Transaction rejected by user')
      } else {
        showToast('error', error.message || 'Failed to propose candidate')
      }
    } finally {
      setProposing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
          disabled={parseFloat(userContribution) === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Propose Domain
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Propose Domain Candidate</DialogTitle>
        </DialogHeader>

        <form onSubmit={handlePropose} className="space-y-4">
          {/* Status Toast */}
          {status.type && (
            <div className={`p-4 rounded-lg ${
              status.type === 'success' 
                ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {status.message}
            </div>
          )}

          {/* Domain Name */}
          <div className="space-y-2">
            <Label htmlFor="domainName">Domain Name *</Label>
            <Input
              id="domainName"
              placeholder="example.ai"
              value={formData.domainName}
              onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
              required
              disabled={proposing}
            />
            <p className="text-xs text-gray-500">
              The domain name you want the pool to purchase
            </p>
          </div>

          {/* NFT Contract */}
          <div className="space-y-2">
            <Label htmlFor="nftContract">NFT Contract Address *</Label>
            <Input
              id="nftContract"
              placeholder="0x..."
              value={formData.nftContract}
              onChange={(e) => setFormData({ ...formData, nftContract: e.target.value })}
              required
              disabled={proposing}
            />
            <p className="text-xs text-gray-500">
              Using mock contract: 0x2D40...e803
            </p>
          </div>

          {/* Token ID */}
          <div className="space-y-2">
            <Label htmlFor="tokenId">Token ID *</Label>
            <Input
              id="tokenId"
              type="number"
              placeholder="1"
              value={formData.tokenId}
              onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
              required
              disabled={proposing}
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-300">
              💡 Only contributors can propose domain candidates. Your voting power will be proportional to your contribution.
            </p>
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
              <a 
                href={getTransactionLink(txHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={proposing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={proposing || parseFloat(userContribution) === 0}
            >
              {proposing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Proposing...
                </>
              ) : (
                'Propose Candidate'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
