/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserProvider, Contract, TransactionResponse } from "ethers";
import RevenueDistributorABI from "@/contracts/RevenueDistributor.json";
import { getContractAddress } from "./addresses";

/**
 * Distribution information
 */
export interface DistributionInfo {
  id: bigint;
  totalAmount: bigint;
  timestamp: bigint;
  claimedAmount: bigint;
  totalSupplyAtSnapshot: bigint;
}

/**
 * User claim status for a distribution
 */
export interface ClaimStatus {
  distributionId: bigint;
  hasClaimed: boolean;
  claimableAmount: bigint;
  userBalanceAtSnapshot: bigint;
}

/**
 * Service class for interacting with RevenueDistributor contract
 * Handles revenue distribution and claiming
 */
export class RevenueDistributorService {
  private static instance: RevenueDistributorService | null = null;
  private contract: Contract | null = null;
  private provider: BrowserProvider | null = null;
  private signer: any = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): RevenueDistributorService {
    if (!RevenueDistributorService.instance) {
      RevenueDistributorService.instance = new RevenueDistributorService();
    }
    return RevenueDistributorService.instance;
  }

  /**
   * Initialize the service with MetaMask provider
   */
  async initialize(): Promise<void> {
    if (this.contract) return; // Already initialized

    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    const contractAddress = getContractAddress("RevenueDistributor");
    this.contract = new Contract(
      contractAddress,
      RevenueDistributorABI.abi,
      this.signer
    );
  }

  /**
   * Ensure contract is initialized
   */
  private ensureInitialized(): Contract {
    if (!this.contract) {
      throw new Error(
        "RevenueDistributorService not initialized. Call initialize() first."
      );
    }
    return this.contract;
  }

  /**
   * Get total number of distributions
   */
  async getDistributionCount(): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.distributionCount();
  }

  /**
   * Get distribution information by ID
   */
  async getDistribution(distributionId: bigint): Promise<DistributionInfo> {
    const contract = this.ensureInitialized();
    const dist = await contract.distributions(distributionId);

    return {
      id: dist.id,
      totalAmount: dist.totalAmount,
      timestamp: dist.timestamp,
      claimedAmount: dist.claimedAmount,
      totalSupplyAtSnapshot: dist.totalSupplyAtSnapshot,
    };
  }

  /**
   * Get all distributions
   */
  async getAllDistributions(): Promise<DistributionInfo[]> {
    const count = await this.getDistributionCount();
    const distributions: DistributionInfo[] = [];

    for (let i = 0; i < Number(count); i++) {
      const dist = await this.getDistribution(BigInt(i));
      distributions.push(dist);
    }

    return distributions;
  }

  /**
   * Check if user has claimed a distribution
   */
  async hasClaimed(
    distributionId: bigint,
    userAddress: string
  ): Promise<boolean> {
    const contract = this.ensureInitialized();
    return await contract.hasClaimed(distributionId, userAddress);
  }

  /**
   * Get user's balance at snapshot for a distribution
   */
  async getUserBalanceAtSnapshot(
    distributionId: bigint,
    userAddress: string
  ): Promise<bigint> {
    const contract = this.ensureInitialized();
    const dist = await contract.distributions(distributionId);
    return await dist.balanceSnapshot(userAddress);
  }

  /**
   * Calculate claimable amount for a user in a distribution
   */
  async getClaimableAmount(
    distributionId: bigint,
    userAddress: string
  ): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.getClaimableAmount(distributionId, userAddress);
  }

  /**
   * Get total claimable amount across all distributions
   */
  async getTotalClaimableAmount(userAddress: string): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.getTotalClaimableAmount(userAddress);
  }

  /**
   * Get user's balance at snapshot for a distribution
   */
  async getSnapshotBalance(
    distributionId: bigint,
    userAddress: string
  ): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.getSnapshotBalance(distributionId, userAddress);
  }

  /**
   * Get all claim statuses for a user
   */
  async getUserClaimStatuses(userAddress: string): Promise<ClaimStatus[]> {
    const distributions = await this.getAllDistributions();
    const statuses: ClaimStatus[] = [];

    for (const dist of distributions) {
      const hasClaimed = await this.hasClaimed(dist.id, userAddress);
      const claimableAmount = await this.getClaimableAmount(
        dist.id,
        userAddress
      );
      const userBalanceAtSnapshot = await this.getSnapshotBalance(
        dist.id,
        userAddress
      );

      statuses.push({
        distributionId: dist.id,
        hasClaimed,
        claimableAmount,
        userBalanceAtSnapshot,
      });
    }

    return statuses;
  }

  /**
   * Claim revenue from a distribution
   */
  async claim(distributionId: bigint): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.claim(distributionId);
    return tx;
  }

  /**
   * Claim from multiple distributions at once
   */
  async claimMultiple(distributionIds: bigint[]): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.claimMultiple(distributionIds);
    return tx;
  }

  /**
   * Create a new distribution (owner only)
   */
  async createDistribution(
    amount: bigint,
    holders: string[],
    balances: bigint[]
  ): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.createDistribution(amount, holders, balances);
    return tx;
  }

  /**
   * Listen for DistributionCreated events
   */
  onDistributionCreated(
    callback: (id: bigint, amount: bigint, timestamp: bigint) => void
  ): () => void {
    const contract = this.ensureInitialized();

    const filter = contract.filters.DistributionCreated();
    const listener = (
      id: bigint,
      amount: bigint,
      distId: bigint,
      timestamp: bigint
    ) => {
      callback(id, amount, timestamp);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Listen for Claimed events
   */
  onClaimed(
    callback: (user: string, distributionId: bigint, amount: bigint) => void
  ): () => void {
    const contract = this.ensureInitialized();

    const filter = contract.filters.Claimed();
    const listener = (user: string, distributionId: bigint, amount: bigint) => {
      callback(user, distributionId, amount);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Format USDC amount for display
   */
  static formatAmount(amountRaw: bigint): string {
    return (Number(amountRaw) / 1e6).toFixed(2) + " USDC";
  }

  /**
   * Parse USDC amount from string
   */
  static parseAmount(amount: string): bigint {
    return BigInt(Math.floor(parseFloat(amount) * 1e6));
  }
}

/**
 * Helper function to get a RevenueDistributorService instance
 */
export async function getRevenueDistributorService(): Promise<RevenueDistributorService> {
  const service = RevenueDistributorService.getInstance();
  await service.initialize();
  return service;
}
