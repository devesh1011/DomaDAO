/**
 * Domains API Service
 * All API calls related to domain search and information
 */

import { apiClient } from "../api-client";
import type {
  Domain,
  DomainActivity,
  DomainListing,
  DomainOffer,
  PaginatedResponse,
  SearchParams,
} from "../api-types";

export const domainsApi = {
  /**
   * Search domains by name
   */
  async searchDomains(
    params: SearchParams & { includePricing?: boolean }
  ): Promise<PaginatedResponse<Domain>> {
    // Map frontend params to backend params
    const backendParams: Record<string, string | number> = {};
    if (params.query) backendParams.query = params.query;
    if (params.tld && params.tld !== "All") {
      // Remove the leading dot if present and pass as comma-separated string
      const tldValue = params.tld.startsWith(".")
        ? params.tld.slice(1)
        : params.tld;
      backendParams.tlds = tldValue;
    }

    if (params.page && params.limit) {
      backendParams.skip = (params.page - 1) * params.limit;
      backendParams.take = params.limit;
    } else if (params.limit) {
      backendParams.take = params.limit;
    }

    const response = await apiClient.get<any>(
      "/api/domains/search",
      backendParams
    );

    // Transform DOMA API response format to our expected format
    if (
      response &&
      response.__typename === "PaginatedNamesResponse" &&
      Array.isArray(response.items)
    ) {
      const items = response.items;
      const take = params.limit || 20;
      const currentPage = params.page || 1;

      const transformedData = {
        data: items.map((item: any) => {
          // Extract the domain name parts
          const fullName = item.name;
          const parts = fullName.split(".");
          const tld = parts.length > 1 ? "." + parts.slice(1).join(".") : "";
          const nameWithoutTld = parts.length > 1 ? parts[0] : fullName;

          return {
            name: nameWithoutTld,
            tld: tld,
            expiresAt: item.expiresAt,
            tokenizedAt: item.tokenizedAt,
            registrar: item.registrar?.name || "Unknown",
            owner:
              item.tokens?.[0]?.ownerAddress || item.claimedBy || "Unknown",
            tokens: (item.tokens || []).map((token: any) => ({
              chainId: parseInt(token.networkId.split(":")[1]) || 0,
              chainName: token.networkId.split(":")[0] || "unknown",
              contractAddress: token.ownerAddress?.split(":")[2] || "",
              tokenId: token.tokenId || "",
              tokenStandard: token.type || "ERC721",
            })),
          };
        }),
        pagination: {
          page: currentPage,
          limit: take,
          total: response.totalCount || items.length,
          totalPages: response.totalPages || Math.ceil(items.length / take),
        },
      };

      // Optionally fetch pricing data for each domain
      if (params.includePricing) {
        const pricingPromises = transformedData.data.map(
          async (domain: Domain) => {
            try {
              const bestOffer = await this.getDomainBestOffer(
                `${domain.name}${domain.tld}`
              );
              return { ...domain, bestOffer };
            } catch (error) {
              console.error(
                `Error fetching pricing for ${domain.name}${domain.tld}:`,
                error
              );
              return { ...domain, bestOffer: null };
            }
          }
        );

        transformedData.data = await Promise.all(pricingPromises);
      }

      return transformedData;
    }

    // Fallback to empty response
    return {
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  },

  /**
   * Get specific domain details by name
   */
  async getDomain(name: string): Promise<Domain> {
    try {
      // Ensure the domain name is properly encoded for URL
      const encodedName = encodeURIComponent(name);
      console.log("Fetching domain:", name, "-> Encoded:", encodedName);

      const response = await apiClient.get<any>(`/api/domains/${encodedName}`);

      // Handle DOMA API response format
      if (response && response.name) {
        // Parse domain name and TLD properly (same logic as search)
        const fullName = response.name;
        const parts = fullName.split(".");
        const tld = parts.length > 1 ? "." + parts.slice(1).join(".") : "";
        const nameWithoutTld = parts.length > 1 ? parts[0] : fullName;

        return {
          name: nameWithoutTld,
          tld,
          expiresAt: response.expiresAt,
          tokenizedAt: response.tokenizedAt,
          registrar: response.registrar?.name || "Unknown",
          owner:
            response.tokens?.[0]?.ownerAddress ||
            response.claimedBy ||
            "Unknown",
          tokens: (response.tokens || []).map((token: any) => ({
            chainId: parseInt(token.networkId?.split(":")[1]) || 0,
            chainName: token.networkId?.split(":")[0] || "unknown",
            contractAddress: token.ownerAddress?.split(":")[2] || "",
            tokenId: token.tokenId || "",
            tokenStandard: token.type || "ERC721",
          })),
        };
      }

      throw new Error("Invalid domain response format");
    } catch (error: any) {
      console.error("Error fetching domain:", error);
      throw error;
    }
  },

  /**
   * Get domain activity history
   */
  async getDomainActivities(
    name: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<DomainActivity>> {
    const encodedName = encodeURIComponent(name);
    const backendParams: Record<string, number> = {};

    if (params?.page && params?.limit) {
      backendParams.skip = (params.page - 1) * params.limit;
      backendParams.take = params.limit;
    } else if (params?.limit) {
      backendParams.take = params.limit;
    }

    return apiClient.get<PaginatedResponse<DomainActivity>>(
      `/api/domains/${encodedName}/activities`,
      backendParams
    );
  },

  /**
   * Get active marketplace listings for a domain
   */
  async getDomainListings(
    name: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<DomainListing>> {
    return apiClient.get<PaginatedResponse<DomainListing>>(
      `/api/domains/${name}/listings`,
      params
    );
  },

  /**
   * Get active offers on a domain
   */
  async getDomainOffers(
    name: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<DomainOffer>> {
    return apiClient.get<PaginatedResponse<DomainOffer>>(
      `/api/domains/${name}/offers`,
      params
    );
  },

  /**
   * Get the best offer for a domain (highest price)
   */
  async getDomainBestOffer(name: string): Promise<DomainOffer | null> {
    try {
      const offers = await this.getDomainOffers(name, { limit: 50 });
      if (!offers.data || offers.data.length === 0) {
        return null;
      }

      // Find the offer with the highest price (considering decimals)
      const bestOffer = offers.data.reduce((best, current) => {
        const bestPrice =
          parseFloat(best.price) / Math.pow(10, best.currency.decimals);
        const currentPrice =
          parseFloat(current.price) / Math.pow(10, current.currency.decimals);
        return currentPrice > bestPrice ? current : best;
      });

      return bestOffer;
    } catch (error) {
      console.error("Error fetching best offer for domain:", name, error);
      return null;
    }
  },
};
