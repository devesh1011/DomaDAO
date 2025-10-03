import {
  ethers,
  BrowserProvider,
  Contract,
  ContractTransactionResponse,
} from "ethers";
import PoolFactoryArtifact from "@/contracts/PoolFactory.json";
import { CONTRACT_ADDRESSES } from "./addresses";
import { getDomaTransactionOptions } from "@/lib/utils/gas";

export interface CreatePoolParams {
  domainName: string;
  nftContract: string;
  tokenId: string;
  totalShares: string;
  pricePerShare: string;
  durationInDays: string;
  paymentToken?: string;
  isDemoMode?: boolean; // Add demo mode flag
}

export interface PoolCreatedEvent {
  poolAddress: string;
  creator: string;
  poolName: string;
  timestamp: number;
  transactionHash: string;
}

/**
 * Pool Factory Service
 * Handles pool creation and management
 */
export class PoolFactoryService {
  private contract: Contract | null = null;
  private provider: BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize the service with MetaMask provider
   */
  async initialize(): Promise<void> {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    this.contract = new Contract(
      CONTRACT_ADDRESSES.PoolFactory,
      PoolFactoryArtifact.abi,
      this.signer
    );
  }

  /**
   * Get a read-only provider for blockchain queries (doesn't require initialization)
   */
  private async getReadOnlyProvider(): Promise<BrowserProvider> {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }
    return new BrowserProvider(window.ethereum);
  }

  /**
   * Ensure contract is initialized
   */
  private ensureInitialized(): Contract {
    if (!this.contract) {
      throw new Error(
        "PoolFactoryService not initialized. Call initialize() first."
      );
    }
    return this.contract;
  }

  /**
   * Create a new investment pool
   */
  async createPool(params: CreatePoolParams): Promise<{
    transaction: ContractTransactionResponse;
    poolAddress: string | null;
  }> {
    const contract = this.ensureInitialized();

    // Default payment token to MockUSDC
    const paymentToken = params.paymentToken || CONTRACT_ADDRESSES.MockUSDC;

    // Calculate timestamps
    const now = Math.floor(Date.now() / 1000);

    // Demo mode: 2 minutes contribution, 1 minute voting, 2 minutes purchase
    // Normal mode: 7 days contribution, 3 days voting, custom purchase duration
    const isDemoMode = params.isDemoMode || false;
    const contributionPeriod = isDemoMode ? 2 * 60 : 7 * 24 * 60 * 60; // 2 min or 7 days
    const votingPeriod = isDemoMode ? 1 * 60 : 3 * 24 * 60 * 60; // 1 min or 3 days

    // Pool timeline: Add 5 minute buffer to ensure timestamps are in future
    // In demo mode, start contribution immediately
    const contributionStart = isDemoMode ? now : now + 5 * 60; // Start immediately in demo mode
    const contributionEnd = contributionStart + contributionPeriod;
    const votingStart = contributionEnd;
    const votingEnd = votingStart + votingPeriod;
    const purchaseWindowStart = votingEnd;
    const purchaseWindowEnd =
      purchaseWindowStart +
      (isDemoMode ? 2 * 60 : Number(params.durationInDays) * 24 * 60 * 60);

    // Calculate target raise: totalShares * pricePerShare
    const targetRaise =
      BigInt(params.totalShares) * BigInt(params.pricePerShare);

    // Minimum contribution: 1% of target or 1 USDC (whichever is higher)
    const minimumContribution = targetRaise / BigInt(100);

    console.log("Creating pool with params:", {
      poolName: params.domainName,
      targetRaise: targetRaise.toString(),
      contributionWindow: `${new Date(
        contributionStart * 1000
      ).toLocaleString()} - ${new Date(
        contributionEnd * 1000
      ).toLocaleString()}`,
      votingWindow: `${new Date(
        votingStart * 1000
      ).toLocaleString()} - ${new Date(votingEnd * 1000).toLocaleString()}`,
      purchaseWindow: `${new Date(
        purchaseWindowStart * 1000
      ).toLocaleString()} - ${new Date(
        purchaseWindowEnd * 1000
      ).toLocaleString()}`,
      fractionalSharesTotal: params.totalShares,
      minimumContribution: minimumContribution.toString(),
      usdcAddress: paymentToken,
    });

    try {
      // Check wallet balance first
      const balance = await this.provider!.getBalance(
        await this.signer!.getAddress()
      );
      console.log("Wallet balance:", balance.toString(), "wei");

      if (balance === BigInt(0)) {
        throw new Error(
          "Insufficient balance: You need DOMA tokens to pay for gas. Please get testnet tokens from the faucet."
        );
      }

      // Estimate gas first to catch any revert errors
      console.log("Estimating gas...");
      const gasEstimate = await contract.createPool.estimateGas(
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
      );

      console.log("Gas estimate:", gasEstimate.toString());

      // Get transaction options for Doma Testnet (legacy gas pricing)
      const txOptions = await getDomaTransactionOptions(
        this.provider!,
        gasEstimate,
        150 // 50% gas buffer
      );
      console.log("Gas price:", txOptions.gasPrice.toString(), "wei");

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
        paymentToken, // usdcAddress
        txOptions
      );

      console.log("Transaction sent:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Extract pool address from PoolCreated event
      let poolAddress: string | null = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });

            if (parsedLog && parsedLog.name === "PoolCreated") {
              poolAddress = parsedLog.args.poolAddress;
              console.log("New pool created at:", poolAddress);
              break;
            }
          } catch {
            // Not a PoolCreated event, skip
            continue;
          }
        }
      }

      return {
        transaction: tx,
        poolAddress,
      };
    } catch (error: any) {
      console.error("Error creating pool:", error);

      // Try to extract revert reason
      let errorMessage = "Failed to create pool";

      // Check for specific error types
      if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage =
          "Insufficient DOMA tokens for gas. Please get testnet tokens from the faucet.";
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        errorMessage =
          "Transaction would fail. This could be due to: invalid timestamps, insufficient allowances, or contract validation errors.";
      } else if (error.code === "CALL_EXCEPTION") {
        errorMessage =
          "Contract execution would fail. Please check all parameters and try again.";
      } else if (error.code === "NETWORK_ERROR") {
        errorMessage =
          "Network error. Please check your connection to DOMA Testnet.";
      } else if (error.code === "UNKNOWN_ERROR" || error.code === -32603) {
        errorMessage =
          "RPC error. This could be due to: insufficient gas funds, network congestion, or invalid transaction parameters.";
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        // Clean up the error message
        errorMessage = error.message.replace(/^.*?:\s*/i, "");
      }

      console.error("Parsed error:", errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all created pools
   */
  async getAllPools(): Promise<string[]> {
    try {
      const provider = await this.getReadOnlyProvider();
      const contract = new Contract(
        CONTRACT_ADDRESSES.PoolFactory,
        PoolFactoryArtifact.abi,
        provider
      );

      // Check if contract exists at the address
      const code = await provider.getCode(CONTRACT_ADDRESSES.PoolFactory);
      if (code === "0x") {
        console.warn(
          "PoolFactory contract not found at address:",
          CONTRACT_ADDRESSES.PoolFactory
        );
        return [];
      }

      const pools = await contract.getAllPools();
      return pools || [];
    } catch (error) {
      console.error("Error fetching pools from PoolFactory:", error);
      // Return empty array instead of throwing to prevent dashboard from breaking
      return [];
    }
  }

  /**
   * Get pool details from blockchain (for newly created pools not yet in backend)
   */
  async getPoolDetailsFromBlockchain(poolAddress: string): Promise<any> {
    const provider = await this.getReadOnlyProvider();

    try {
      // Import FractionPool ABI to read pool data
      const FractionPoolArtifact = await import(
        "@/contracts/FractionPool.json"
      );
      const poolContract = new Contract(
        poolAddress,
        FractionPoolArtifact.abi,
        provider
      );

      // Fetch pool metadata and additional data
      const [metadata, totalRaised] = await Promise.all([
        poolContract.metadata(),
        poolContract.totalRaised(),
      ]);

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
        usdcAddress,
      } = metadata;

      // Determine status based on timestamps
      const now = Math.floor(Date.now() / 1000);
      let status: "ACTIVE" | "COMPLETED" | "CLOSED" | "PENDING" = "ACTIVE";
      if (now < Number(contributionStart)) {
        status = "PENDING";
      } else if (now < Number(contributionEnd)) {
        status = "ACTIVE"; // Pool is active during contribution period
      } else if (now < Number(votingEnd)) {
        status = "ACTIVE"; // Pool is active during voting period
      } else if (now < Number(purchaseEnd)) {
        status = "ACTIVE"; // Pool is active during purchase period
      } else {
        status = "COMPLETED";
      }

      const pricePerShare = Number(targetRaise) / Number(fractionalShares);

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
        status: status as "ACTIVE" | "COMPLETED" | "CLOSED" | "PENDING",
        expirationDate: new Date(Number(purchaseEnd) * 1000).toISOString(),
        revenueGenerated: "0", // Not implemented yet
        progress: (Number(totalRaised) / Number(targetRaise)) * 100,
        createdAt: new Date(Number(contributionStart) * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching pool details from blockchain:", error);
      throw error;
    }
  }

  /**
   * Get all pools with details from blockchain
   */
  async getAllPoolsWithDetails(): Promise<any[]> {
    const poolAddresses = await this.getAllPools();
    const poolDetails = await Promise.all(
      poolAddresses.map((address) => this.getPoolDetailsFromBlockchain(address))
    );
    return poolDetails;
  }

  /**
   * Get pools created by a specific address
   */
  async getPoolsByCreator(creator: string): Promise<string[]> {
    const contract = this.ensureInitialized();
    const pools = await contract.getPoolsByCreator(creator);
    return pools;
  }

  /**
   * Get pool count
   */
  async getPoolCount(): Promise<number> {
    const contract = this.ensureInitialized();
    const count = await contract.poolCount();
    return Number(count);
  }

  /**
   * Listen for PoolCreated events
   */
  onPoolCreated(callback: (event: PoolCreatedEvent) => void): () => void {
    const contract = this.ensureInitialized();

    const filter = contract.filters.PoolCreated();

    const listener = async (...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = args[args.length - 1] as any;
      const poolAddress = args[0] as string;
      const creator = args[1] as string;
      const poolName = args[2] as string;

      callback({
        poolAddress,
        creator,
        poolName,
        timestamp: (await event.getBlock()).timestamp,
        transactionHash: event.log.transactionHash,
      });
    };

    contract.on(filter, listener);

    // Return cleanup function
    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Estimate gas for pool creation
   */
  async estimateCreatePoolGas(params: CreatePoolParams): Promise<bigint> {
    const contract = this.ensureInitialized();

    const paymentToken = params.paymentToken || CONTRACT_ADDRESSES.MockUSDC;

    const gasEstimate = await contract.createPool.estimateGas(
      params.nftContract,
      BigInt(params.tokenId),
      BigInt(params.totalShares),
      BigInt(params.pricePerShare),
      BigInt(params.durationInDays),
      paymentToken
    );

    return gasEstimate;
  }
}

// Singleton instance
let poolFactoryService: PoolFactoryService | null = null;

/**
 * Get or create PoolFactoryService instance (requires MetaMask)
 */
export async function getPoolFactoryService(): Promise<PoolFactoryService> {
  if (!poolFactoryService) {
    poolFactoryService = new PoolFactoryService();
    await poolFactoryService.initialize();
  }
  return poolFactoryService;
}

/**
 * Get read-only blockchain service (doesn't require MetaMask signer)
 */
export async function getReadOnlyPoolFactoryService(): Promise<PoolFactoryService> {
  const service = new PoolFactoryService();
  // Don't call initialize() - read-only operations use getReadOnlyProvider()
  return service;
}
