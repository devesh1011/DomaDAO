/**
 * Custom React Hooks for API Data Fetching
 * Using React Query pattern with loading and error states
 */

import { useState, useEffect, useCallback } from "react";
import { poolsApi, domainsApi, portfolioApi } from "@/lib/api";
import type { Pool, Domain, PaginatedResponse } from "@/lib/api-types";
import type { UserPortfolioSummary } from "@/lib/api/portfolio";

// Generic hook for data fetching
function useApiData<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "An error occurred";
      const errorDetails =
        err?.response?.data?.error || err?.response?.statusText || "";
      const fullError = errorDetails
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;

      setError(fullError);
      console.error("API Error Details:", {
        message: errorMessage,
        details: errorDetails,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        fullError: err,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch };
}

/**
 * Hook to fetch all pools
 */
export function usePools(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useApiData(
    () => poolsApi.getPools(params),
    [params?.page, params?.limit, params?.status]
  );
}

/**
 * Hook to fetch a specific pool
 */
export function usePool(address: string | null) {
  const [data, setData] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchPool() {
      try {
        setLoading(true);
        setError(null);
        const result = await poolsApi.getPool(address!);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        const error = err as { message?: string };
        if (mounted) {
          setError(error.message || "Failed to fetch pool");
          console.error("API Error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPool();

    return () => {
      mounted = false;
    };
  }, [address]);

  return { data, loading, error };
}

/**
 * Hook to fetch pool contributions
 */
export function usePoolContributions(
  address: string | null,
  params?: { page?: number; limit?: number }
) {
  const [data, setData] = useState<PaginatedResponse<unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchContributions() {
      try {
        setLoading(true);
        setError(null);
        const result = await poolsApi.getPoolContributions(address!, params);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        const error = err as { message?: string };
        if (mounted) {
          setError(error.message || "Failed to fetch contributions");
          console.error("API Error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchContributions();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, params?.page, params?.limit]);

  return { data, loading, error };
}

/**
 * Hook to search domains
 */
export function useDomainSearch(params: {
  query?: string;
  tld?: string;
  page?: number;
  limit?: number;
  includePricing?: boolean;
}) {
  return useApiData(
    () => domainsApi.searchDomains(params),
    [
      params?.query,
      params?.tld,
      params?.page,
      params?.limit,
      params?.includePricing,
    ]
  );
}

/**
 * Hook to fetch a specific domain
 */
export function useDomain(name: string | null) {
  const [data, setData] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchDomain() {
      try {
        setLoading(true);
        setError(null);
        const result = await domainsApi.getDomain(name!);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        const error = err as { message?: string };
        if (mounted) {
          setError(error.message || "Failed to fetch domain");
          console.error("API Error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchDomain();

    return () => {
      mounted = false;
    };
  }, [name]);

  return { data, loading, error };
}

/**
 * Hook to fetch domain details (alias for useDomain)
 */
export function useDomainDetails(name: string) {
  return useApiData(() => {
    console.log("Fetching domain details for:", name);
    return domainsApi.getDomain(decodeURIComponent(name));
  }, [name]);
}

/**
 * Hook to fetch domain activities
 */
export function useDomainActivities(
  name: string | null,
  params?: { page?: number; limit?: number }
) {
  const [data, setData] = useState<PaginatedResponse<unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);
        const result = await domainsApi.getDomainActivities(name!, params);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        const error = err as { message?: string };
        if (mounted) {
          setError(error.message || "Failed to fetch activities");
          console.error("API Error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchActivities();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, params?.page, params?.limit]);

  return { data, loading, error };
}

/**
 * Hook to fetch domain listings
 */
export function useDomainListings(
  name: string | null,
  params?: { page?: number; limit?: number }
) {
  const [data, setData] = useState<PaginatedResponse<unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchListings() {
      try {
        setLoading(true);
        setError(null);
        const result = await domainsApi.getDomainListings(name!, params);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        const error = err as { message?: string };
        if (mounted) {
          setError(error.message || "Failed to fetch listings");
          console.error("API Error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchListings();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, params?.page, params?.limit]);

  return { data, loading, error };
}

/**
 * Hook to fetch domain offers
 */
export function useDomainOffers(
  name: string | null,
  params?: { page?: number; limit?: number }
) {
  const [data, setData] = useState<PaginatedResponse<unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchOffers() {
      try {
        setLoading(true);
        setError(null);
        const result = await domainsApi.getDomainOffers(name!, params);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        const error = err as { message?: string };
        if (mounted) {
          setError(error.message || "Failed to fetch offers");
          console.error("API Error:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOffers();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, params?.page, params?.limit]);

  return { data, loading, error };
}

/**
 * Hook to fetch user portfolio data
 */
export function useUserPortfolio(userAddress: string | null) {
  const [data, setData] = useState<UserPortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userAddress) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await portfolioApi.getUserPortfolio(userAddress);
      setData(result);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Failed to fetch portfolio");
      console.error("Portfolio API Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
