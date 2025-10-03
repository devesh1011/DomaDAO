/**
 * Portfolio API Service
 * Fetches user-specific portfolio data
 */

import { poolsApi } from "./pools";
import { getFractionPoolService } from "../contracts/fraction-pool";
import type { Pool, PoolContribution } from "../api-types";

export interface UserPortfolioSummary {
  totalInvestmentValue: number;
  activePools: number;
  totalRevenue: number;
  activeInvestments: UserInvestment[];
}

export interface UserInvestment {
  poolAddress: string;
  domain: string;
  shares: string;
  contribution: string;
  contributionRaw: bigint;
  value: string;
  status: string;
  poolInfo?: Pool;
}

export const portfolioApi = {
  /**
   * Get user's portfolio summary by fetching all pools and checking contributions
   */
  async getUserPortfolio(userAddress: string): Promise<UserPortfolioSummary> {
    try {
      // Fetch all pools
      const poolsResponse = await poolsApi.getPools({ limit: 100 });
      const pools = poolsResponse.data || [];

      const activeInvestments: UserInvestment[] = [];
      let totalInvestmentValue = 0;
      let totalRevenue = 0;
      let activePools = 0;

      // Check user's contribution in each pool
      for (const pool of pools) {
        try {
          const poolService = await getFractionPoolService(pool.address);
          const contribution = await poolService.getContribution(userAddress);

          if (contribution.amountRaw > BigInt(0)) {
            const contributionAmount = parseFloat(contribution.amount);

            activeInvestments.push({
              poolAddress: pool.address,
              domain: pool.domainName,
              shares: "0", // Will be calculated when fractionalized
              contribution: contribution.amount,
              contributionRaw: contribution.amountRaw,
              value: contribution.amount, // For now, value = contribution
              status: pool.status,
              poolInfo: pool,
            });

            totalInvestmentValue += contributionAmount;
            activePools++;
          }
        } catch (error) {
          console.warn(
            `Error fetching contribution for pool ${pool.address}:`,
            error
          );
          // Continue to next pool
        }
      }

      return {
        totalInvestmentValue,
        activePools,
        totalRevenue, // TODO: Calculate from revenue distributions
        activeInvestments,
      };
    } catch (error) {
      console.error("Error fetching user portfolio:", error);
      throw error;
    }
  },

  /**
   * Get user's contributions across all pools
   */
  async getUserContributions(userAddress: string): Promise<PoolContribution[]> {
    try {
      const poolsResponse = await poolsApi.getPools({ limit: 100 });
      const pools = poolsResponse.data || [];

      const contributions: PoolContribution[] = [];

      for (const pool of pools) {
        try {
          const poolContributions = await poolsApi.getPoolContributions(
            pool.address,
            { limit: 100 }
          );

          // Filter contributions by user address
          const userContributions =
            poolContributions.data?.filter(
              (c) => c.investor.toLowerCase() === userAddress.toLowerCase()
            ) || [];

          contributions.push(...userContributions);
        } catch (error) {
          console.warn(
            `Error fetching contributions for pool ${pool.address}:`,
            error
          );
        }
      }

      return contributions;
    } catch (error) {
      console.error("Error fetching user contributions:", error);
      return [];
    }
  },
};
