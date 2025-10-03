/**
 * Pools API Service
 * All API calls related to fractionalization pools
 */

import { apiClient } from "../api-client";
import type {
  Pool,
  PoolContribution,
  PoolVote,
  VotingResults,
  RevenueDistribution,
  PaginatedResponse,
} from "../api-types";
import { getReadOnlyPoolFactoryService } from "../contracts/pool-factory";

export const poolsApi = {
  /**
   * Get all fractionalization pools
   */
  async getPools(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
  }): Promise<PaginatedResponse<Pool>> {
    try {
      // Try backend API first
      const response = await apiClient.get<PaginatedResponse<Pool>>(
        "/api/pools",
        params
      );

      // If backend returns pools, mark as from database
      if (response.data && response.data.length > 0) {
        return {
          ...response,
          source: "database",
        };
      }

      // If backend returns empty, fallback to blockchain
      console.log("No pools in backend, fetching from blockchain...");
      return await this.getPoolsFromBlockchain(params);
    } catch (error) {
      console.warn("Backend API failed, falling back to blockchain:", error);
      // Fallback to blockchain if backend fails
      return await this.getPoolsFromBlockchain(params);
    }
  },

  /**
   * Fetch pools directly from blockchain (fallback)
   */
  async getPoolsFromBlockchain(params?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
  }): Promise<PaginatedResponse<Pool>> {
    try {
      const poolFactory = await getReadOnlyPoolFactoryService();
      const pools = await poolFactory.getAllPoolsWithDetails();

      // Apply filtering
      let filteredPools = pools;
      if (params?.status) {
        filteredPools = pools.filter((p) => p.status === params.status);
      }

      // Apply pagination
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPools = filteredPools.slice(startIndex, endIndex);

      return {
        data: paginatedPools as Pool[],
        pagination: {
          page,
          limit,
          total: filteredPools.length,
          totalPages: Math.ceil(filteredPools.length / limit),
        },
        source: "blockchain",
      };
    } catch (error) {
      console.error("Error fetching pools from blockchain:", error);
      // Return empty result if blockchain fetch fails
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
        source: "blockchain",
      };
    }
  },

  /**
   * Get specific pool details by address
   */
  async getPool(address: string): Promise<Pool> {
    return apiClient.get<Pool>(`/api/pools/${address}`);
  },

  /**
   * Get all contributions to a pool
   */
  async getPoolContributions(
    address: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<PoolContribution>> {
    return apiClient.get<PaginatedResponse<PoolContribution>>(
      `/api/pools/${address}/contributions`,
      params
    );
  },

  /**
   * Get all votes for a pool
   */
  async getPoolVotes(
    address: string,
    params?: { page?: number; limit?: number; proposalId?: string }
  ): Promise<PaginatedResponse<PoolVote>> {
    return apiClient.get<PaginatedResponse<PoolVote>>(
      `/api/pools/${address}/votes`,
      params
    );
  },

  /**
   * Get voting results for a pool
   */
  async getVotingResults(
    address: string,
    proposalId?: string
  ): Promise<VotingResults[]> {
    const params = proposalId ? { proposalId } : undefined;
    return apiClient.get<VotingResults[]>(
      `/api/pools/${address}/voting-results`,
      params
    );
  },

  /**
   * Get revenue distributions for a pool
   */
  async getDistributions(
    address: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<RevenueDistribution>> {
    return apiClient.get<PaginatedResponse<RevenueDistribution>>(
      `/api/pools/${address}/distributions`,
      params
    );
  },
};
