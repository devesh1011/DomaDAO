"use client"

import { useState } from "react"
import { Wallet, LogOut, AlertCircle, CheckCircle2, Copy, ExternalLink } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function WalletConnect() {
  const {
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToDomaNetwork,
  } = useWallet()

  const [copied, setCopied] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openExplorer = () => {
    if (account) {
      window.open(
        `https://explorer-testnet.doma.xyz/address/${account}`,
        "_blank"
      )
    }
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={connectWallet}
          disabled={connecting}
          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist"
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Button
          onClick={switchToDomaNetwork}
          variant="destructive"
          className="font-geist"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Switch to DOMA Testnet
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Connected to wrong network (Chain ID: {chainId})</span>
        </div>
      </div>
    )
  }

  // Connected and correct network
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 font-geist border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="hidden sm:inline">{formatAddress(account!)}</span>
            <span className="sm:hidden">
              {account!.slice(0, 4)}...{account!.slice(-2)}
            </span>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            DOMA
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-geist">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Connected</span>
          </div>
          <div className="flex items-center justify-between text-sm font-normal text-gray-600 dark:text-gray-400">
            <span>DOMA Testnet</span>
            <Badge variant="outline" className="text-xs">
              Chain: {chainId}
            </Badge>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="font-mono text-sm">
          <div className="flex flex-col gap-1 w-full">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Wallet Address
            </span>
            <span className="break-all">{account}</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              <span>Copy Address</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={openExplorer} className="cursor-pointer">
          <ExternalLink className="w-4 h-4 mr-2" />
          <span>View on Explorer</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={disconnectWallet}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
