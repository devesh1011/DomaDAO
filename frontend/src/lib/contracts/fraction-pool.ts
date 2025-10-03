/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserProvider, Contract, TransactionResponse } from "ethers";
import FractionPoolABI from "@/contracts/FractionPool.json";
import { getDomaTransactionOptions } from "@/lib/utils/gas";

/**
 * Pool state enum matching Solidity contract
 */
export enum PoolState {
  Fundraising = 0,
  Voting = 1,
  Purchased = 2,
  Fractionalized = 3,
  Closed = 4,
  Disputed = 5,
}

/**
 * Domain candidate interface
 */
export interface DomainCandidate {
  domainName: string;
  voteCount: bigint;
  nftContract?: string; // Not stored in contract
  tokenId?: bigint; // Not stored in contract
  proposer?: string; // Not stored in contract
}

/**
 * Contributor information
 */
export interface Contributor {
  address: string;
  amount: string;
  amountRaw: bigint;
}

/**
 * Pool information from contract
 */
export interface PoolInfo {
  poolAddress: string;
  creator: string;
  poolName: string;
  targetRaise: bigint;
  totalRaised: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  votingStart: bigint;
  votingEnd: bigint;
  purchaseWindowStart: bigint;
  purchaseWindowEnd: bigint;
  paymentToken: string;
  state: PoolState;
  contributorCount: bigint;
  candidateCount: bigint;
  winningDomain: string; // Changed from winningCandidate number to winningDomain string
  domainNFT: string;
  domainTokenId: bigint;
  fractionToken: string;
  minimumContribution: bigint;
}

/**
 * Service class for interacting with FractionPool contracts
 * Handles pool contributions, voting, and share management
 */
export class FractionPoolService {
  private static instances: Map<string, FractionPoolService> = new Map();
  private contract: Contract | null = null;
  private provider: BrowserProvider | null = null;
  private signer: any = null;
  private poolAddress: string;

  private constructor(poolAddress: string) {
    this.poolAddress = poolAddress;
  }

  /**
   * Get or create singleton instance for a specific pool address
   */
  static getInstance(poolAddress: string): FractionPoolService {
    if (!FractionPoolService.instances.has(poolAddress)) {
      FractionPoolService.instances.set(
        poolAddress,
        new FractionPoolService(poolAddress)
      );
    }
    return FractionPoolService.instances.get(poolAddress)!;
  }

  /**
   * Initialize the service with MetaMask provider (for write operations)
   */
  async initialize(): Promise<void> {
    // Always re-initialize with signer for write operations
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new Contract(
      this.poolAddress,
      FractionPoolABI.abi,
      this.signer
    );
  }

  /**
   * Initialize read-only provider (for read operations only)
   */
  async initializeReadOnly(): Promise<void> {
    if (this.contract && !this.signer) return; // Already initialized as read-only

    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask is not installed");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.contract = new Contract(
      this.poolAddress,
      FractionPoolABI.abi,
      this.provider
    );
  }

  /**
   * Ensure contract is initialized
   */
  private ensureInitialized(): Contract {
    if (!this.contract) {
      throw new Error(
        "FractionPoolService not initialized. Call initialize() first."
      );
    }
    return this.contract;
  }

  /**
   * Get comprehensive pool information
   */
  async getPoolInfo(): Promise<PoolInfo> {
    const contract = this.ensureInitialized();

    // Get metadata and contributor/candidate data
    const [
      metadata,
      totalRaised,
      contributors,
      domainCandidates,
      winningCandidate,
      domainNFT,
      domainTokenId,
      fractionToken,
    ] = await Promise.all([
      contract.getMetadata(),
      contract.totalRaised(),
      contract.getContributors(),
      contract.getDomainCandidates(),
      contract.winningDomain(),
      contract.domainNFTAddress(),
      contract.domainTokenId(),
      contract.fractionTokenAddress(),
    ]);

    // Extract metadata fields
    const {
      creator,
      poolName,
      targetRaise,
      startTimestamp,
      endTimestamp,
      votingStart,
      votingEnd,
      purchaseWindowStart: purchaseStart,
      purchaseWindowEnd: purchaseEnd,
      minimumContribution,
      usdcAddress,
      fractionalSharesTotal,
      status, // PoolStatus enum from metadata
    } = metadata;

    return {
      poolAddress: this.poolAddress,
      creator,
      poolName,
      targetRaise,
      totalRaised,
      startTimestamp,
      endTimestamp,
      votingStart,
      votingEnd,
      purchaseWindowStart: purchaseStart,
      purchaseWindowEnd: purchaseEnd,
      paymentToken: usdcAddress,
      state: Number(status) as PoolState,
      contributorCount: contributors.length,
      candidateCount: domainCandidates.length,
      winningDomain: winningCandidate, // This is the winning domain name (string)
      domainNFT,
      domainTokenId,
      fractionToken,
      minimumContribution,
    };
  }

  /**
   * Contribute USDC to the pool
   * @param amount Amount in USDC (e.g., "100" for 100 USDC)
   */
  async contribute(amount: string): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();

    // Convert to smallest unit (6 decimals for USDC)
    const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e6));

    // Estimate gas and get transaction options for Doma Testnet
    const gasEstimate = await contract.contribute.estimateGas(amountRaw);
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate,
      120
    );

    const tx = await contract.contribute(amountRaw, txOptions);
    return tx;
  }

  /**
   * Get user's contribution amount
   */
  async getContribution(
    userAddress: string
  ): Promise<{ amount: string; amountRaw: bigint }> {
    const contract = this.ensureInitialized();
    const amountRaw = await contract.contributions(userAddress);
    const amount = (Number(amountRaw) / 1e6).toFixed(2);

    return { amount, amountRaw };
  }

  /**
   * Get all contributors
   */
  async getContributors(): Promise<Contributor[]> {
    const contract = this.ensureInitialized();
    const contributorAddresses = await contract.getContributors();

    const contributors: Contributor[] = [];
    for (const address of contributorAddresses) {
      const amountRaw = await contract.contributions(address);
      const amount = (Number(amountRaw) / 1e6).toFixed(2);

      contributors.push({
        address,
        amount,
        amountRaw,
      });
    }

    return contributors;
  }
  /**
   * Add a domain candidate (owner only)
   * Note: Contract only allows pool owner to add candidates
   */
  async addDomainCandidate(domainName: string): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const gasEstimate = await contract.addDomainCandidate.estimateGas(
      domainName
    );
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );
    const tx = await contract.addDomainCandidate(domainName, txOptions);
    return tx;
  }

  /**
   * Get domain candidate by index
   */
  async getCandidate(index: number): Promise<DomainCandidate> {
    const contract = this.ensureInitialized();
    const domainNames = await contract.getDomainCandidates();

    if (index >= domainNames.length) {
      throw new Error(`Candidate index ${index} out of bounds`);
    }

    const domainName = domainNames[index];
    const voteCount = await contract.votesPerCandidate(domainName);

    return {
      domainName,
      voteCount: BigInt(voteCount),
      // Note: nftContract, tokenId, and proposer are not stored in the contract
      nftContract: "",
      tokenId: BigInt(0),
      proposer: "",
    };
  }

  /**
   * Get all domain candidates
   */
  async getAllCandidates(): Promise<DomainCandidate[]> {
    const contract = this.ensureInitialized();
    const domainNames = await contract.getDomainCandidates();

    const candidates: DomainCandidate[] = [];
    for (const domainName of domainNames) {
      const voteCount = await contract.votesPerCandidate(domainName);
      candidates.push({
        domainName,
        voteCount: BigInt(voteCount),
        // Note: nftContract, tokenId, and proposer are not stored in the contract
        nftContract: "",
        tokenId: BigInt(0),
        proposer: "",
      });
    }

    return candidates;
  }

  /**
   * Cast vote for a domain candidate by name
   * Note: Contract uses domain name string, not index
   */
  async castVote(domainName: string): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const gasEstimate = await contract.castVote.estimateGas(domainName);
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );
    const tx = await contract.castVote(domainName, txOptions);
    return tx;
  }

  /**
   * Check if user has voted
   */
  async hasVoted(userAddress: string): Promise<boolean> {
    const contract = this.ensureInitialized();
    return await contract.hasVoted(userAddress);
  }

  /**
   * Start voting phase (owner only)
   * Transitions pool from Fundraising to Voting status
   */
  async startVoting(): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const gasEstimate = await contract.startVoting.estimateGas();
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );
    const tx = await contract.startVoting(txOptions);
    return tx;
  }

  /**
   * Finalize voting period
   */
  async finalizeVoting(): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const gasEstimate = await contract.finalizeVoting.estimateGas();
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );
    const tx = await contract.finalizeVoting(txOptions);
    return tx;
  }

  /**
   * Record domain purchase (after acquiring NFT via orderbook)
   * @param nftAddress Address of the domain NFT contract
   * @param tokenId Token ID of the purchased domain
   * @param txHash Transaction hash of the purchase
   */
  async recordDomainPurchase(
    nftAddress: string,
    tokenId: string,
    txHash: string
  ): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();

    // Convert txHash to bytes32 format
    const txHashBytes32 = txHash.startsWith("0x") ? txHash : `0x${txHash}`;

    const gasEstimate = await contract.recordDomainPurchase.estimateGas(
      nftAddress,
      tokenId,
      txHashBytes32
    );
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );

    const tx = await contract.recordDomainPurchase(
      nftAddress,
      tokenId,
      txHashBytes32,
      txOptions
    );
    return tx;
  }
  /**
   * Record fractionalization (after fractionalizing via DOMA API)
   * @param fractionTokenAddress Address of the created fraction token
   */
  async recordFractionalization(
    fractionTokenAddress: string
  ): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const gasEstimate = await contract.recordFractionalization.estimateGas(
      fractionTokenAddress
    );
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );
    const tx = await contract.recordFractionalization(
      fractionTokenAddress,
      txOptions
    );
    return tx;
  }

  /**
   * Claim fractional shares
   */
  async claimShares(): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const gasEstimate = await contract.claimShares.estimateGas();
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );
    const tx = await contract.claimShares(txOptions);
    return tx;
  }

  /**
   * Get claimable shares for a user
   */
  async getClaimableShares(userAddress: string): Promise<bigint> {
    const contract = this.ensureInitialized();
    return await contract.shareEntitlements(userAddress);
  }

  /**
   * Check if user has claimed their shares
   */
  async hasClaimedShares(userAddress: string): Promise<boolean> {
    const contract = this.ensureInitialized();
    return await contract.hasClaimed(userAddress);
  }

  /**
   * Request refund (if pool failed)
   */
  async refund(): Promise<TransactionResponse> {
    const contract = this.ensureInitialized();
    const gasEstimate = await contract.refund.estimateGas();
    const txOptions = await getDomaTransactionOptions(
      this.provider!,
      gasEstimate
    );
    const tx = await contract.refund(txOptions);
    return tx;
  }

  /**
   * Listen for Contribution events
   */
  onContribution(
    callback: (contributor: string, amount: bigint) => void
  ): () => void {
    const contract = this.ensureInitialized();
    const filter = contract.filters.Contribution();

    const listener = async (...args: unknown[]) => {
      const contributor = args[0] as string;
      const amount = args[1] as bigint;
      callback(contributor, amount);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Listen for CandidateProposed events
   */
  onCandidateProposed(
    callback: (
      proposer: string,
      candidateIndex: number,
      domainName: string
    ) => void
  ): () => void {
    const contract = this.ensureInitialized();
    const filter = contract.filters.CandidateProposed();

    const listener = async (...args: unknown[]) => {
      const proposer = args[0] as string;
      const candidateIndex = Number(args[1]);
      const domainName = args[2] as string;
      callback(proposer, candidateIndex, domainName);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Listen for VoteCast events
   */
  onVoteCast(
    callback: (voter: string, candidateIndex: number, weight: bigint) => void
  ): () => void {
    const contract = this.ensureInitialized();
    const filter = contract.filters.VoteCast();

    const listener = async (...args: unknown[]) => {
      const voter = args[0] as string;
      const candidateIndex = Number(args[1]);
      const weight = args[2] as bigint;
      callback(voter, candidateIndex, weight);
    };

    contract.on(filter, listener);

    return () => {
      contract.off(filter, listener);
    };
  }

  /**
   * Estimate gas for contribution
   */
  async estimateContributeGas(amount: string): Promise<bigint> {
    const contract = this.ensureInitialized();
    const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e6));

    return await contract.contribute.estimateGas(amountRaw);
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
   * Get state name
   */
  static getStateName(state: PoolState): string {
    const stateNames = {
      [PoolState.Fundraising]: "Fundraising",
      [PoolState.Voting]: "Voting",
      [PoolState.Purchased]: "Purchased",
      [PoolState.Fractionalized]: "Fractionalized",
      [PoolState.Closed]: "Closed",
      [PoolState.Disputed]: "Disputed",
    };
    return stateNames[state] || "Unknown";
  }
}

/**
 * Helper function to get a FractionPoolService instance
 */
export async function getFractionPoolService(
  poolAddress: string
): Promise<FractionPoolService> {
  const service = FractionPoolService.getInstance(poolAddress);
  await service.initialize();
  return service;
}

/**
 * Get read-only fraction pool service (for viewing pool details without MetaMask signer)
 */
export async function getReadOnlyFractionPoolService(
  poolAddress: string
): Promise<FractionPoolService> {
  const service = FractionPoolService.getInstance(poolAddress);
  await service.initializeReadOnly();
  return service;
}
