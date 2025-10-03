/**
 * API Type Definitions
 * TypeScript interfaces for all API responses
 */

// Pool Types
export interface Pool {
  address: string;
  domainName: string;
  totalShares: number;
  pricePerShare: string;
  availableShares?: number;
  investorCount: number;
  totalRaised: string;
  currentAmount?: string;
  targetAmount?: string;
  status: "ACTIVE" | "COMPLETED" | "CLOSED" | "PENDING";
  expirationDate?: string;
  revenueGenerated?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  domainInfo?: Domain;
}

export interface PoolContribution {
  id: string;
  poolAddress: string;
  investor: string;
  shares: number;
  amountPaid: string;
  timestamp: string;
  transactionHash: string;
}

export interface PoolVote {
  id: string;
  poolAddress: string;
  proposalId: string;
  voter: string;
  voteType: "YES" | "NO" | "ABSTAIN";
  votingPower: number;
  timestamp: string;
  transactionHash: string;
}

export interface VotingResults {
  proposalId: string;
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  status: "ACTIVE" | "PASSED" | "FAILED" | "EXECUTED";
  deadline: string;
}

export interface RevenueDistribution {
  id: string;
  poolAddress: string;
  amount: string;
  distributionDate: string;
  shareHolders: number;
  transactionHash: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
}

// Domain Types
export interface Domain {
  name: string;
  tld: string;
  expiresAt: string;
  tokenizedAt?: string;
  registrar: string;
  owner: string;
  tokens: DomainToken[];
  bestOffer?: DomainOffer | null;
}

export interface DomainToken {
  chainId: number;
  chainName: string;
  contractAddress: string;
  tokenId: string;
  tokenStandard: string;
}

export interface DomainActivity {
  id: string;
  domainName: string;
  eventType:
    | "CLAIMED"
    | "RENEWED"
    | "TOKENIZED"
    | "DETOKENIZED"
    | "TRANSFERRED";
  timestamp: string;
  transactionHash: string;
  fromAddress?: string;
  toAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface DomainListing {
  id: string;
  domainName: string;
  price: string;
  currency: {
    symbol: string;
    decimals: number;
    address?: string;
  };
  offererAddress: string;
  orderbook: "OPENSEA" | "BLUR" | "LOOKSRARE" | "X2Y2";
  expiresAt: string;
  status: "ACTIVE" | "FILLED" | "CANCELLED" | "EXPIRED";
}

export interface DomainOffer {
  id: string;
  domainName: string;
  price: string;
  currency: {
    symbol: string;
    decimals: number;
    address?: string;
  };
  offererAddress: string;
  expiresAt: string;
  status: "ACTIVE" | "ACCEPTED" | "REJECTED" | "EXPIRED";
}

// Search & Pagination
export interface SearchParams {
  query?: string;
  tld?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  source?: "database" | "blockchain"; // Indicates where data was fetched from
}

// Health Check
export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    domaApi: boolean;
  };
  version: string;
}
