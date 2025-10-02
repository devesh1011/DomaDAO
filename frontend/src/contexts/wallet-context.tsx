"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// DOMA Testnet configuration
const DOMA_TESTNET = {
  chainId: "0x17CC4", // 97476 in hex
  chainName: "DOMA Testnet",
  nativeCurrency: {
    name: "DOMA",
    symbol: "DOMA",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-testnet.doma.xyz"],
  blockExplorerUrls: ["https://explorer-testnet.doma.xyz"],
}

interface WalletContextType {
  account: string | null
  chainId: number | null
  isConnected: boolean
  isCorrectNetwork: boolean
  connecting: boolean
  error: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToDomaNetwork: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const DOMA_CHAIN_ID = 97476

  const isConnected = !!account
  const isCorrectNetwork = chainId === DOMA_CHAIN_ID

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection()
    
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (!window.ethereum) return

    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_accounts" 
      })
      
      if (accounts.length > 0) {
        setAccount(accounts[0])
        
        const chainIdHex = await window.ethereum.request({ 
          method: "eth_chainId" 
        })
        setChainId(parseInt(chainIdHex, 16))
      }
    } catch (err) {
      console.error("Error checking connection:", err)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null)
      setError("Please connect to MetaMask")
    } else {
      setAccount(accounts[0])
      setError(null)
    }
  }

  const handleChainChanged = (chainIdHex: string) => {
    setChainId(parseInt(chainIdHex, 16))
    // Reload the page as recommended by MetaMask
    window.location.reload()
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask to use this dApp")
      return
    }

    setConnecting(true)
    setError(null)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      setAccount(accounts[0])

      // Get current chain ID
      const chainIdHex = await window.ethereum.request({ 
        method: "eth_chainId" 
      })
      const currentChainId = parseInt(chainIdHex, 16)
      setChainId(currentChainId)

      // If not on DOMA Testnet, prompt to switch
      if (currentChainId !== DOMA_CHAIN_ID) {
        await switchToDomaNetwork()
      }
    } catch (err: any) {
      console.error("Error connecting wallet:", err)
      
      if (err.code === 4001) {
        setError("Connection rejected by user")
      } else {
        setError("Failed to connect wallet")
      }
    } finally {
      setConnecting(false)
    }
  }

  const switchToDomaNetwork = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask")
      return
    }

    try {
      // Try to switch to DOMA Testnet
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: DOMA_TESTNET.chainId }],
      })
      
      setChainId(DOMA_CHAIN_ID)
      setError(null)
    } catch (err: any) {
      // If the chain hasn't been added to MetaMask
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [DOMA_TESTNET],
          })
          
          setChainId(DOMA_CHAIN_ID)
          setError(null)
        } catch (addErr: any) {
          console.error("Error adding network:", addErr)
          setError("Failed to add DOMA Testnet to MetaMask")
        }
      } else {
        console.error("Error switching network:", err)
        setError("Failed to switch to DOMA Testnet")
      }
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setChainId(null)
    setError(null)
  }

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isConnected,
        isCorrectNetwork,
        connecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToDomaNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

// Extend Window interface
declare global {
  interface Window {
    ethereum?: any
  }
}
