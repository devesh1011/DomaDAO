/**
 * Blockchain Event Types for Fractionalization Contracts
 */

// Event types from our smart contracts
export enum ContractEventType {
  POOL_CREATED = 'POOL_CREATED',
  CONTRIBUTION_MADE = 'CONTRIBUTION_MADE',
  VOTE_CAST = 'VOTE_CAST',
  REVENUE_DISTRIBUTED = 'REVENUE_DISTRIBUTED',
  BUYOUT_INITIATED = 'BUYOUT_INITIATED',
  BUYOUT_COMPLETED = 'BUYOUT_COMPLETED',
}

export interface TransactionInfo {
  hash: string;
  blockNumber: number;
  logIndex: number;
  timestamp?: number;
}

export interface BaseBlockchainEvent {
  uniqueId: string;
  type: ContractEventType;
  networkId: string;
  tx: TransactionInfo;
  finalized: boolean;
  name?: string;
  tokenId?: string;
}

export interface PoolCreatedEvent extends BaseBlockchainEvent {
  type: ContractEventType.POOL_CREATED;
  data: {
    poolAddress: string;
    ownerAddress: string;
    targetAmount: string;
    contributionWindowEnd: number;
    votingWindowStart: number;
    votingWindowEnd: number;
    purchaseWindowStart: number;
    usdcAddress: string;
  };
}

export interface ContributionMadeEvent extends BaseBlockchainEvent {
  type: ContractEventType.CONTRIBUTION_MADE;
  data: {
    poolAddress: string;
    contributor: string;
    amount: string;
    totalContributed: string;
  };
}

export interface VoteCastEvent extends BaseBlockchainEvent {
  type: ContractEventType.VOTE_CAST;
  data: {
    poolAddress: string;
    voter: string;
    support: boolean;
    weight: string;
  };
}

export interface RevenueDistributedEvent extends BaseBlockchainEvent {
  type: ContractEventType.REVENUE_DISTRIBUTED;
  data: {
    poolAddress: string;
    distributionId: string;
    amount: string;
    totalAmount: string;
    timestamp: number;
    snapshotTimestamp: number;
  };
}

export interface BuyoutInitiatedEvent extends BaseBlockchainEvent {
  type: ContractEventType.BUYOUT_INITIATED;
  data: {
    poolAddress: string;
    buyer: string;
    buyoutPrice: string;
  };
}

export interface BuyoutCompletedEvent extends BaseBlockchainEvent {
  type: ContractEventType.BUYOUT_COMPLETED;
  data: {
    poolAddress: string;
    buyer: string;
    finalPrice: string;
  };
}

export type BlockchainEvent =
  | PoolCreatedEvent
  | ContributionMadeEvent
  | VoteCastEvent
  | RevenueDistributedEvent
  | BuyoutInitiatedEvent
  | BuyoutCompletedEvent;
