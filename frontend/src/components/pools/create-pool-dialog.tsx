"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { getPoolFactoryService } from "@/lib/contracts/pool-factory"
import { getMockUSDCService } from "@/lib/contracts/usdc"
import { getTransactionLink, getContractAddress } from "@/lib/contracts/addresses"

interface CreatePoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

export function CreatePoolDialog({ open, onOpenChange, onSuccess }: CreatePoolDialogProps) {
  const { account, isConnected, isCorrectNetwork, connectWallet, switchToDomaNetwork } = useWallet()
  const [loading, setLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null)
  const [poolAddress, setPoolAddress] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const [hasApproval, setHasApproval] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  
  const [formData, setFormData] = useState({
    domainName: "",
    domainNFTAddress: "0x2D40FE0Ea341d42158a1827c5398f28B783bE803", // Mock domain NFT contract for demo
    tokenId: "1",
    totalShares: "10000000", // 10 million shares
    pricePerShare: "10", // 10 USDC per share (will be converted to 10000000 with 6 decimals)
    duration: "30", // 30 days for purchase window
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message })
    setTimeout(() => setStatus({ type: null, message: '' }), 8000)
  }

  /**
   * Check USDC balance and approval when dialog opens
   */
  const checkUSDCStatus = useCallback(async () => {
    if (!account || !isConnected) return

    try {
      const usdcService = await getMockUSDCService()
      const poolFactoryAddress = getContractAddress('PoolFactory')

      // Get balance
      const balance = await usdcService.balanceOf(account)
      setUsdcBalance(balance)

      // Check approval - no specific amount needed yet, just check if > 0
      const allowance = await usdcService.allowanceRaw(account, poolFactoryAddress)
      setHasApproval(allowance > BigInt(0))
    } catch (error) {
      console.error('Error checking USDC status:', error)
    }
  }, [account, isConnected])

  // Check USDC status when dialog opens or account changes
  useEffect(() => {
    if (open && account && isConnected) {
      checkUSDCStatus()
    }
  }, [open, account, isConnected, checkUSDCStatus])

  /**
   * Handle USDC approval
   */
  const handleApproval = async () => {
    if (!account) return

    setApprovalLoading(true)
    setApprovalTxHash(null)

    try {
      const usdcService = await getMockUSDCService()
      const poolFactoryAddress = getContractAddress('PoolFactory')

      // Approve a reasonable amount for pool creation (1000 USDC)
      // This covers the initial pool contribution
      showToast('success', 'Opening MetaMask for approval...')
      const tx = await usdcService.approve(poolFactoryAddress, '1000')
      
      setApprovalTxHash(tx.hash)
      showToast('success', `Approval transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`)

      // Wait for confirmation
      showToast('success', 'Waiting for approval confirmation (this may take a few seconds)...')
      const receipt = await tx.wait()

      if (receipt && receipt.status === 1) {
        setHasApproval(true)
        showToast('success', '✅ USDC spending approved! You can now create a pool.')
      } else {
        throw new Error('Approval transaction failed')
      }
      
      // Refresh balance
      await checkUSDCStatus()
    } catch (error: any) {
      console.error('Error approving USDC:', error)
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        showToast('error', '❌ Approval rejected. Please try again and confirm in MetaMask.')
      } else if (error.message?.includes('user rejected')) {
        showToast('error', '❌ Transaction rejected by user. Please approve to continue.')
      } else {
        showToast('error', error.message || 'Failed to approve USDC')
      }
      
      // Reset approval state on error
      setHasApproval(false)
      setApprovalTxHash(null)
    } finally {
      setApprovalLoading(false)
    }
  }

  /**
   * Handle minting test USDC (for mock contract only)
   */
  const handleMintUSDC = async () => {
    if (!account) return

    setLoading(true)

    try {
      const usdcService = await getMockUSDCService()

      showToast('success', 'Minting 1000 test USDC...')
      const tx = await usdcService.mint(account, '1000')
      
      showToast('success', 'Waiting for mint confirmation...')
      await tx.wait()

      showToast('success', '1000 USDC minted successfully!')
      
      // Refresh balance
      await checkUSDCStatus()
    } catch (error: any) {
      console.error('Error minting USDC:', error)
      showToast('error', error.message || 'Failed to mint USDC')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check wallet connection
    if (!isConnected) {
      showToast('error', 'Please connect your wallet first')
      await connectWallet()
      return
    }

    // Check network
    if (!isCorrectNetwork) {
      showToast('error', 'Please switch to DOMA Testnet')
      await switchToDomaNetwork()
      return
    }

    // Check USDC approval
    if (!hasApproval) {
      showToast('error', '❌ Please approve USDC spending first by clicking "Approve USDC" button above')
      return
    }

    setLoading(true)
    setStatus({ type: null, message: '' })
    setTxHash(null)
    setPoolAddress(null)

    try {
      showToast('success', 'Initializing contract...')

      // Get PoolFactory service
      const poolFactory = await getPoolFactoryService()

      showToast('success', '📝 Opening MetaMask to create pool...')

      // Create pool
      const { transaction, poolAddress: newPoolAddress } = await poolFactory.createPool({
        domainName: formData.domainName,
        nftContract: formData.domainNFTAddress,
        tokenId: formData.tokenId,
        totalShares: formData.totalShares,
        pricePerShare: (BigInt(Math.floor(parseFloat(formData.pricePerShare) * 1e6))).toString(), // Convert to USDC with 6 decimals
        durationInDays: formData.duration,
      })

      setTxHash(transaction.hash)
      showToast('success', `✅ Transaction submitted! Hash: ${transaction.hash.slice(0, 10)}...`)

      // Wait for confirmation
      showToast('success', '⏳ Waiting for confirmation (this may take a few seconds)...')
      const receipt = await transaction.wait()

      if (receipt && receipt.status === 1) {
        setPoolAddress(newPoolAddress)
        showToast('success', `🎉 Pool created successfully! Address: ${newPoolAddress?.slice(0, 10)}...`)
        
        // Reset form after a delay
        setTimeout(() => {
          onOpenChange(false)
          setFormData({
            domainName: "",
            domainNFTAddress: "0x2D40FE0Ea341d42158a1827c5398f28B783bE803",
            tokenId: "1",
            totalShares: "10000000",
            pricePerShare: "10",
            duration: "30",
          })
          setTxHash(null)
          setPoolAddress(null)
        }, 2000)

        // Call success callback
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
          }, 1500)
        }
      } else {
        throw new Error('Transaction failed')
      }

    } catch (error: any) {
      console.error('Error creating pool:', error)
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        showToast('error', '❌ Transaction rejected. Please try again and confirm in MetaMask.')
      } else if (error.message?.includes('user rejected') || error.message?.includes('user denied')) {
        showToast('error', '❌ Transaction rejected by user. Please confirm to create the pool.')
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        showToast('error', '❌ Insufficient funds for gas fees')
      } else if (error.message?.includes('insufficient allowance')) {
        showToast('error', '❌ Insufficient USDC approval. Please approve USDC again.')
        setHasApproval(false)
      } else if (error.message) {
        showToast('error', error.message)
      } else {
        showToast('error', 'Failed to create pool')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Investment Pool</DialogTitle>
          <DialogDescription>
            Create a new fractionalized investment pool for a domain NFT
          </DialogDescription>
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">📋 Demo Mode</p>
            <p className="text-blue-700 dark:text-blue-300 text-xs">
              For this demo, you can enter any domain name. In production, you'd need to own the actual domain NFT.
              The mock NFT contract (0x2D40...e803) is pre-configured for testing.
            </p>
          </div>
        </DialogHeader>
        
        {status.type && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            status.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
            'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span className="text-sm">{status.message}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domainName">Domain Name</Label>
              <Input
                id="domainName"
                placeholder="example.ai"
                value={formData.domainName}
                onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="domainNFTAddress">Domain NFT Contract Address</Label>
              <Input
                id="domainNFTAddress"
                placeholder="0x..."
                value={formData.domainNFTAddress}
                onChange={(e) => setFormData({ ...formData, domainNFTAddress: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Using mock contract: 0x2D40FE0Ea341d42158a1827c5398f28B783bE803
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tokenId">Token ID</Label>
              <Input
                id="tokenId"
                placeholder="1"
                type="number"
                value={formData.tokenId}
                onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalShares">Total Shares</Label>
                <Input
                  id="totalShares"
                  placeholder="1000"
                  type="number"
                  value={formData.totalShares}
                  onChange={(e) => setFormData({ ...formData, totalShares: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pricePerShare">Price per Share (USDC)</Label>
                <Input
                  id="pricePerShare"
                  placeholder="100"
                  type="number"
                  step="0.01"
                  value={formData.pricePerShare}
                  onChange={(e) => setFormData({ ...formData, pricePerShare: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (Days)</Label>
              <Input
                id="duration"
                placeholder="30"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Pool Details:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Total Value: {(parseFloat(formData.totalShares) * parseFloat(formData.pricePerShare || "0")).toFixed(2)} USDC</li>
                <li>• Shares: {parseInt(formData.totalShares).toLocaleString()} shares @ {parseFloat(formData.pricePerShare).toFixed(2)} USDC each</li>
                <li>• Network: DOMA Testnet</li>
                <li>• Payment Token: USDC (Mock)</li>
                <li>• Timeline: 7d contribute + 3d vote + {formData.duration}d purchase</li>
                {usdcBalance && (
                  <li className="flex items-center justify-between">
                    <span>• Your USDC Balance: {parseFloat(usdcBalance).toFixed(2)} USDC</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleMintUSDC}
                      disabled={loading || approvalLoading}
                      className="h-6 text-xs"
                    >
                      Mint 1000 USDC
                    </Button>
                  </li>
                )}
              </ul>
            </div>

            {/* USDC Approval Section */}
            {isConnected && (
              <div className={`p-4 rounded-lg text-sm border ${
                hasApproval 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                  : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {hasApproval ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium">USDC Approved</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="font-medium">USDC Approval Required</span>
                      </>
                    )}
                  </div>
                  {!hasApproval && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApproval}
                      disabled={approvalLoading}
                    >
                      {approvalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        'Approve USDC'
                      )}
                    </Button>
                  )}
                </div>
                {!hasApproval && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You need to approve USDC spending before creating a pool
                  </p>
                )}
                {approvalTxHash && (
                  <div className="mt-2 text-xs">
                    <a 
                      href={getTransactionLink(approvalTxHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      View approval transaction <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Transaction Status */}
            {txHash && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                <p className="font-medium mb-2">Transaction Details:</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Tx Hash: </span>
                    <a 
                      href={getTransactionLink(txHash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </a>
                  </div>
                  {poolAddress && (
                    <div>
                      <span className="text-muted-foreground">Pool Address: </span>
                      <span className="font-mono text-xs">
                        {poolAddress.slice(0, 10)}...{poolAddress.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || approvalLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || approvalLoading || !hasApproval}
              title={!hasApproval ? "Please approve USDC first" : ""}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Pool...
                </>
              ) : (
                "Create Pool"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
