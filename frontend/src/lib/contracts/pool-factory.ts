import { ethers, BrowserProvider, Contract, ContractTransactionResponse } from 'ethers'
import PoolFactoryArtifact from '@/contracts/PoolFactory.json'
import { CONTRACT_ADDRESSES } from './addresses'

export interface CreatePoolParams {
  domainName: string
  nftContract: string
  tokenId: string
  totalShares: string
  pricePerShare: string
  durationInDays: string
  paymentToken?: string
}

export interface PoolCreatedEvent {
  poolAddress: string
  creator: string
  poolName: string
  timestamp: number
  transactionHash: string
}

/**
 * Pool Factory Service
 * Handles pool creation and management
 */
export class PoolFactoryService {
  private contract: Contract | null = null
  private provider: BrowserProvider | null = null
  private signer: ethers.Signer | null = null

  /**
   * Initialize the service with MetaMask provider
   */
  async initialize(): Promise<void> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    this.provider = new BrowserProvider(window.ethereum)
    this.signer = await this.provider.getSigner()
    
    this.contract = new Contract(
      CONTRACT_ADDRESSES.PoolFactory,
      PoolFactoryArtifact.abi,
      this.signer
    )
  }

  /**
   * Get a read-only provider for blockchain queries (doesn't require initialization)
   */
  private async getReadOnlyProvider(): Promise<BrowserProvider> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }
    return new BrowserProvider(window.ethereum)
  }

  /**
   * Ensure contract is initialized
   */
  private ensureInitialized(): Contract {
    if (!this.contract) {
      throw new Error('PoolFactoryService not initialized. Call initialize() first.')
    }
    return this.contract
  }

  /**
   * Create a new investment pool
   */
  async createPool(params: CreatePoolParams): Promise<{
    transaction: ContractTransactionResponse
    poolAddress: string | null
  }> {
    const contract = this.ensureInitialized()

    // Default payment token to MockUSDC
    const paymentToken = params.paymentToken || CONTRACT_ADDRESSES.MockUSDC

    // Calculate timestamps
    const now = Math.floor(Date.now() / 1000)
    const durationInSeconds = Number(params.durationInDays) * 24 * 60 * 60
    
    // Pool timeline (based on your PRD requirements):
    // 1. Contribution Period: 7 days to raise funds
    // 2. Voting Period: 3 days to vote on domain
    // 3. Purchase Window: 14 days to execute purchase
    const contributionStart = now + 60 // Start in 1 minute
    const contributionEnd = contributionStart + (7 * 24 * 60 * 60) // 7 days
    const votingStart = contributionEnd
    const votingEnd = votingStart + (3 * 24 * 60 * 60) // 3 days
    const purchaseWindowStart = votingEnd
    const purchaseWindowEnd = purchaseWindowStart + durationInSeconds

    // Calculate target raise: totalShares * pricePerShare
    const targetRaise = BigInt(params.totalShares) * BigInt(params.pricePerShare)
    
    // Minimum contribution: 1% of target or 1 USDC (whichever is higher)
    const minimumContribution = targetRaise / BigInt(100)

    console.log('Creating pool with params:', {
      poolName: params.domainName,
      targetRaise: targetRaise.toString(),
      contributionWindow: `${new Date(contributionStart * 1000).toLocaleString()} - ${new Date(contributionEnd * 1000).toLocaleString()}`,
      votingWindow: `${new Date(votingStart * 1000).toLocaleString()} - ${new Date(votingEnd * 1000).toLocaleString()}`,
      purchaseWindow: `${new Date(purchaseWindowStart * 1000).toLocaleString()} - ${new Date(purchaseWindowEnd * 1000).toLocaleString()}`,
      fractionalSharesTotal: params.totalShares,
      minimumContribution: minimumContribution.toString(),
      usdcAddress: paymentToken,
    })

    // Call createPool function with correct parameters
    const tx = await contract.createPool(
      params.domainName, // poolName
      targetRaise, // targetRaise
      contributionStart, // contributionStart
      contributionEnd, // contributionEnd
      votingStart, // votingStart
      votingEnd, // votingEnd
      purchaseWindowStart, // purchaseWindowStart
      purchaseWindowEnd, // purchaseWindowEnd
      BigInt(params.totalShares), // fractionalSharesTotal
      minimumContribution, // minimumContribution
      paymentToken // usdcAddress
    )

    console.log('Transaction sent:', tx.hash)

    // Wait for confirmation
    const receipt = await tx.wait()
    console.log('Transaction confirmed:', receipt)

    // Extract pool address from PoolCreated event
    let poolAddress: string | null = null
    if (receipt && receipt.logs) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          })
          
          if (parsedLog && parsedLog.name === 'PoolCreated') {
            poolAddress = parsedLog.args.poolAddress
            console.log('New pool created at:', poolAddress)
            break
          }
        } catch {
          // Not a PoolCreated event, skip
          continue
        }
      }
    }

    return {
      transaction: tx,
      poolAddress,
    }
  }

  /**
   * Get all created pools
   */
  async getAllPools(): Promise<string[]> {
    const provider = await this.getReadOnlyProvider()
    const contract = new Contract(
      CONTRACT_ADDRESSES.PoolFactory,
      PoolFactoryArtifact.abi,
      provider
    )
    const pools = await contract.getAllPools()
    return pools
  }

  /**
   * Get pool details from blockchain (for newly created pools not yet in backend)
   */
  async getPoolDetailsFromBlockchain(poolAddress: string): Promise<any> {
    const provider = await this.getReadOnlyProvider()

    try {
      // Import FractionPool ABI to read pool data
      const FractionPoolArtifact = await import('@/contracts/FractionPool.json')
      const poolContract = new Contract(
        poolAddress,
        FractionPoolArtifact.abi,
        provider
      )

      // Fetch pool metadata and additional data
      const [metadata, totalRaised] = await Promise.all([
        poolContract.metadata(),
        poolContract.totalRaised()
      ])

      // Extract metadata fields
      const {
        creator,
        poolName,
        targetRaise,
        startTimestamp: contributionStart,
        endTimestamp: contributionEnd,
        votingStart,
        votingEnd,
        purchaseWindowStart: purchaseStart,
        purchaseWindowEnd: purchaseEnd,
        fractionalSharesTotal: fractionalShares,
        minimumContribution,
        usdcAddress
      } = metadata

      // Determine status based on timestamps
      const now = Math.floor(Date.now() / 1000)
      let status: 'ACTIVE' | 'COMPLETED' | 'CLOSED' | 'PENDING' = 'ACTIVE'
      if (now < Number(contributionStart)) {
        status = 'PENDING'
      } else if (now < Number(contributionEnd)) {
        status = 'ACTIVE' // Pool is active during contribution period
      } else if (now < Number(votingEnd)) {
        status = 'ACTIVE' // Pool is active during voting period
      } else if (now < Number(purchaseEnd)) {
        status = 'ACTIVE' // Pool is active during purchase period
      } else {
        status = 'COMPLETED'
      }

      const pricePerShare = Number(targetRaise) / Number(fractionalShares)

      return {
        address: poolAddress,
        domainName: poolName,
        totalShares: Number(fractionalShares),
        pricePerShare: (pricePerShare / 1e6).toFixed(6), // Convert from wei to USDC with 6 decimals
        availableShares: Number(fractionalShares), // All shares available initially
        investorCount: 0, // Will be calculated from contributions
        totalRaised: (Number(totalRaised) / 1e6).toFixed(6), // Convert from wei to USDC
        currentAmount: (Number(totalRaised) / 1e6).toFixed(6),
        targetAmount: (Number(targetRaise) / 1e6).toFixed(6),
        status: status as 'ACTIVE' | 'COMPLETED' | 'CLOSED' | 'PENDING',
        expirationDate: new Date(Number(purchaseEnd) * 1000).toISOString(),
        revenueGenerated: '0', // Not implemented yet
        progress: (Number(totalRaised) / Number(targetRaise)) * 100,
        createdAt: new Date(Number(contributionStart) * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching pool details from blockchain:', error)
      throw error
    }
  }

  /**
   * Get all pools with details from blockchain
   */
  async getAllPoolsWithDetails(): Promise<any[]> {
    const poolAddresses = await this.getAllPools()
    const poolDetails = await Promise.all(
      poolAddresses.map(address => this.getPoolDetailsFromBlockchain(address))
    )
    return poolDetails
  }

  /**
   * Get pools created by a specific address
   */
  async getPoolsByCreator(creator: string): Promise<string[]> {
    const contract = this.ensureInitialized()
    const pools = await contract.getPoolsByCreator(creator)
    return pools
  }

  /**
   * Get pool count
   */
  async getPoolCount(): Promise<number> {
    const contract = this.ensureInitialized()
    const count = await contract.poolCount()
    return Number(count)
  }

  /**
   * Listen for PoolCreated events
   */
  onPoolCreated(callback: (event: PoolCreatedEvent) => void): () => void {
    const contract = this.ensureInitialized()

    const filter = contract.filters.PoolCreated()
    
    const listener = async (...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = args[args.length - 1] as any
      const poolAddress = args[0] as string
      const creator = args[1] as string
      const poolName = args[2] as string
      
      callback({
        poolAddress,
        creator,
        poolName,
        timestamp: (await event.getBlock()).timestamp,
        transactionHash: event.log.transactionHash,
      })
    }

    contract.on(filter, listener)

    // Return cleanup function
    return () => {
      contract.off(filter, listener)
    }
  }

  /**
   * Estimate gas for pool creation
   */
  async estimateCreatePoolGas(params: CreatePoolParams): Promise<bigint> {
    const contract = this.ensureInitialized()
    
    const paymentToken = params.paymentToken || CONTRACT_ADDRESSES.MockUSDC

    const gasEstimate = await contract.createPool.estimateGas(
      params.nftContract,
      BigInt(params.tokenId),
      BigInt(params.totalShares),
      BigInt(params.pricePerShare),
      BigInt(params.durationInDays),
      paymentToken
    )

    return gasEstimate
  }
}

// Singleton instance
let poolFactoryService: PoolFactoryService | null = null

/**
 * Get or create PoolFactoryService instance (requires MetaMask)
 */
export async function getPoolFactoryService(): Promise<PoolFactoryService> {
  if (!poolFactoryService) {
    poolFactoryService = new PoolFactoryService()
    await poolFactoryService.initialize()
  }
  return poolFactoryService
}

/**
 * Get read-only blockchain service (doesn't require MetaMask signer)
 */
export async function getReadOnlyPoolFactoryService(): Promise<PoolFactoryService> {
  const service = new PoolFactoryService()
  // Don't call initialize() - read-only operations use getReadOnlyProvider()
  return service
}
