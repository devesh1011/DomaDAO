/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserProvider, Contract, TransactionResponse } from "ethers";
import BuyoutHandlerABI from "@/contracts/BuyoutHandler.json";
import { getContractAddress } from "./addresses";

/**
 * Buyout status enum matching Solidity contract
 */
export enum BuyoutStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
  Executed = 3,
  Expired = 4,
  Cancelled = 5,
}

/**
 * Buyout offer information
 */
export interface BuyoutOffer {
  offerId: bigint;
  buyer: string;
  poolAddress: string;
  offerAmount: bigint;
  timestamp: bigint;
  expirationTime: bigint;
  status: BuyoutStatus;
  acceptanceVotes: bigint;
  rejectionVotes: bigint;
  votingDeadline: bigint;
}

/**
 * Vote information
 */
export interface VoteInfo {
  hasVoted: boolean;
  voteChoice: boolean; // true = accept, false = reject
}

/**
 * Service class for interacting with BuyoutHandler contract
 * Handles buyout proposals, voting, and execution
 */
export class BuyoutHandlerService {
  private static instance: BuyoutHandlerService | null = null;
  private contract: Contract | null = null;
  private provider: BrowserProvider | null = null;
  private signer: any = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BuyoutHandlerService {
    if (!BuyoutHandlerService.instance) {
      BuyoutHandlerService.instance = new BuyoutHandlerService();
    }
    return BuyoutHandlerService.instance;
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

    const contractAddress = getContractAddress("BuyoutHandler");
    this.contract = new Contract(
      contractAddress,
      BuyoutHandlerABI.abi,
      this.signer
    );
  }

  /**
   * Ensure contract is initialized
   */
  private ensureInitialized(): Contract {
    if (!this.contract) {
      throw new Error(
        "BuyoutHandlerService not initialized. Call initialize() first."
      );
    }
    return this.contract;
  }

  /**
   * Get total number of buyout offers
   */
  async getOfferCount(): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.offerCount();
  }

  /**
   * Get buyout offer details by ID
   */
  async getBuyoutOffer(offerId: bigint): Promise<BuyoutOffer> {
    const contract = this.ensureInitialized();
    const offer = await contract.buyoutOffers(offerId);

    return {
      offerId: offer.offerId,
      buyer: offer.buyer,
      poolAddress: offer.poolAddress,
      offerAmount: offer.offerAmount,
      timestamp: offer.timestamp,
      expirationTime: offer.expirationTime,
      status: Number(offer.status),
      acceptanceVotes: offer.acceptanceVotes,
      rejectionVotes: offer.rejectionVotes,
      votingDeadline: offer.votingDeadline,
    };
  }

  /**
   * Get all buyout offers for a pool
   */
  async getPoolOffers(poolAddress: string): Promise<BuyoutOffer[]> {
    const contract = this.ensureInitialized();
    const offerIds = await contract.getPoolOffers(poolAddress);

    const offers: BuyoutOffer[] = [];
    for (const id of offerIds) {
      const offer = await this.getBuyoutOffer(id);
      offers.push(offer);
    }

    return offers;
  }

  /**
   * Get all buyout offers
   */
  async getAllOffers(): Promise<BuyoutOffer[]> {
    const count = await this.getOfferCount();
    const offers: BuyoutOffer[] = [];

    for (let i = 0; i < Number(count); i++) {
      const offer = await this.getBuyoutOffer(BigInt(i));
      offers.push(offer);
    }

    return offers;
  }

  /**
   * Check if user has voted on an offer
   */
  async hasVoted(offerId: bigint, userAddress: string): Promise<boolean> {
    const contract = this.ensureInitialized();
    const offer = await contract.buyoutOffers(offerId);
    return await offer.hasVoted(userAddress);
  }

  /**
   * Get user's vote choice on an offer
   */
  async getVoteChoice(offerId: bigint, userAddress: string): Promise<boolean> {
    const contract = this.ensureInitialized();
    const offer = await contract.buyoutOffers(offerId);
    return await offer.voteChoice(userAddress);
  }

  /**
   * Propose a buyout offer
   */
  async proposeBuyout(
    poolAddress: string,
    offerAmount: bigint,
    expirationTime: bigint
  ): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.proposeBuyout(
      poolAddress,
      offerAmount,
      expirationTime
    );
    return tx;
  }

  /**
   * Vote on a buyout offer
   */
  async voteOnBuyout(
    offerId: bigint,
    accept: boolean,
    voteWeight: bigint
  ): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.voteOnBuyout(offerId, accept, voteWeight);
    return tx;
  }

  /**
   * Finalize voting on a buyout offer
   */
  async finalizeVoting(offerId: bigint): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.finalizeVoting(offerId);
    return tx;
  }

  /**
   * Execute an accepted buyout (owner only)
   */
  async executeBuyout(
    offerId: bigint,
    domainNFTAddress: string,
    tokenId: bigint
  ): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.executeBuyout(offerId, domainNFTAddress, tokenId);
    return tx;
  }

  /**
   * Cancel a pending buyout offer
   */
  async cancelBuyout(offerId: bigint): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.cancelBuyout(offerId);
    return tx;
  }

  /**
   * Withdraw rejected buyout funds
   */
  async withdrawFunds(offerId: bigint): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const tx = await contract.withdrawFunds(offerId);
    return tx;
  }

  /**
   * Get voting period duration
   */
  async getVotingPeriod(): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.votingPeriod();
  }

  /**
   * Get acceptance threshold (in basis points, 6000 = 60%)
   */
  async getAcceptanceThreshold(): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.acceptanceThreshold();
  }

  /**
   * Listen for BuyoutProposed events
   */
  onBuyoutProposed(
    callback: (
      offerId: bigint,
      buyer: string,
      poolAddress: string,
      amount: bigint
    ) => void
  ): () => void {
    const contract = this.ensureInitialized();

    const filter = contract.filters.BuyoutProposed();
    const listener = (
      offerId: bigint,
      buyer: string,
      poolAddress: string,
      amount: bigint,
      votingDeadline: bigint
    ) => {
      callback(offerId, buyer, poolAddress, amount);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Listen for BuyoutVoteCast events
   */
  onBuyoutVoteCast(
    callback: (
      offerId: bigint,
      voter: string,
      accept: boolean,
      weight: bigint
    ) => void
  ): () => void {
    const contract = this.ensureInitialized();

    const filter = contract.filters.BuyoutVoteCast();
    const listener = (
      offerId: bigint,
      voter: string,
      accept: boolean,
      weight: bigint
    ) => {
      callback(offerId, voter, accept, weight);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Listen for BuyoutAccepted events
   */
  onBuyoutAccepted(
    callback: (offerId: bigint, totalVotes: bigint) => void
  ): () => void {
    const contract = this.ensureInitialized();

    const filter = contract.filters.BuyoutAccepted();
    const listener = (offerId: bigint, totalVotes: bigint) => {
      callback(offerId, totalVotes);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Listen for BuyoutExecuted events
   */
  onBuyoutExecuted(
    callback: (offerId: bigint, buyer: string, poolAddress: string) => void
  ): () => void {
    const contract = this.ensureInitialized();

    const filter = contract.filters.BuyoutExecuted();
    const listener = (offerId: bigint, buyer: string, poolAddress: string) => {
      callback(offerId, buyer, poolAddress);
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

  /**
   * Get status name
   */
  static getStatusName(status: BuyoutStatus): string {
    const statusNames = {
      [BuyoutStatus.Pending]: "Pending",
      [BuyoutStatus.Accepted]: "Accepted",
      [BuyoutStatus.Rejected]: "Rejected",
      [BuyoutStatus.Executed]: "Executed",
      [BuyoutStatus.Expired]: "Expired",
      [BuyoutStatus.Cancelled]: "Cancelled",
    };
    return statusNames[status] || "Unknown";
  }

  /**
   * Calculate vote percentage
   */
  static calculateVotePercentage(
    acceptVotes: bigint,
    rejectVotes: bigint
  ): number {
    const total = Number(acceptVotes) + Number(rejectVotes);
    if (total === 0) return 0;
    return (Number(acceptVotes) / total) * 100;
  }
}

/**
 * Helper function to get a BuyoutHandlerService instance
 */
export async function getBuyoutHandlerService(): Promise<BuyoutHandlerService> {
  const service = BuyoutHandlerService.getInstance();
  await service.initialize();
  return service;
}
