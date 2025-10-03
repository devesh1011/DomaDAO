/**
 * Poll Events API Client
 * Interfaces for fetching event data from the backend Poll API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface PollEvent {
  id: number;
  event_id: number;
  unique_id: string;
  correlation_id: string | null;
  relay_id: string;
  event_type: string;
  name: string;
  token_id: string;
  network_id: string;
  chain_id: string;
  tx_hash: string;
  block_number: string;
  log_index: number;
  finalized: boolean;
  event_data: Record<string, any>;
  created_at: string;
  processed_at: string | null;
  acknowledged_at: string | null;
  processing_status: string;
  error_message: string | null;
  retry_count: number;
}

export interface PollEventStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  lastAcknowledgedId: number;
  isRunning: boolean;
}

export interface PollEventsResponse {
  success: boolean;
  data: PollEvent[];
  count: number;
  error?: string;
}

export interface PollStatsResponse {
  success: boolean;
  data: PollEventStats;
  error?: string;
}

export interface PollHealthResponse {
  success: boolean;
  data: {
    status: string;
    lastAcknowledgedId: number;
    timestamp: string;
  };
  error?: string;
}

export interface EventFilters {
  event_type?: string;
  name?: string;
  token_id?: string;
  processing_status?: string;
  from_event_id?: number;
  to_event_id?: number;
  limit?: number;
  offset?: number;
}

/**
 * Fetch poll events with optional filters
 */
export async function fetchPollEvents(
  filters: EventFilters = {}
): Promise<PollEvent[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });

  const url = `${API_BASE_URL}/api/poll/events${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const result: PollEventsResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch events");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching poll events:", error);
    throw error;
  }
}

/**
 * Fetch a specific event by unique ID
 */
export async function fetchPollEventByUniqueId(
  uniqueId: string
): Promise<PollEvent | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/poll/events/${uniqueId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }

    const result: { success: boolean; data: PollEvent; error?: string } =
      await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch event");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching poll event:", error);
    throw error;
  }
}

/**
 * Fetch events for a specific domain name
 */
export async function fetchEventsByDomain(
  name: string,
  limit: number = 50
): Promise<PollEvent[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/poll/events/by-name/${encodeURIComponent(
        name
      )}?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch domain events: ${response.statusText}`);
    }

    const result: PollEventsResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch domain events");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching domain events:", error);
    throw error;
  }
}

/**
 * Fetch events for a specific token ID
 */
export async function fetchEventsByToken(
  tokenId: string,
  limit: number = 50
): Promise<PollEvent[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/poll/events/by-token/${encodeURIComponent(
        tokenId
      )}?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch token events: ${response.statusText}`);
    }

    const result: PollEventsResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch token events");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching token events:", error);
    throw error;
  }
}

/**
 * Fetch poll statistics
 */
export async function fetchPollStats(): Promise<PollEventStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/poll/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }

    const result: PollStatsResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch stats");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching poll stats:", error);
    throw error;
  }
}

/**
 * Fetch poll health status
 */
export async function fetchPollHealth(): Promise<PollHealthResponse["data"]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/poll/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch health: ${response.statusText}`);
    }

    const result: PollHealthResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch health");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching poll health:", error);
    throw error;
  }
}

/**
 * Format event type for display
 */
export function formatEventType(eventType: string): string {
  return eventType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get event type color
 */
export function getEventTypeColor(eventType: string): string {
  const colors: Record<string, string> = {
    NAME_TOKEN_MINTED: "text-green-600 bg-green-50",
    NAME_TOKEN_TRANSFERRED: "text-blue-600 bg-blue-50",
    NAME_TOKEN_RENEWED: "text-purple-600 bg-purple-50",
    POOL_CREATED: "text-orange-600 bg-orange-50",
    FRACTIONALIZED: "text-pink-600 bg-pink-50",
    BUYOUT_COMPLETED: "text-red-600 bg-red-50",
  };
  return colors[eventType] || "text-gray-600 bg-gray-50";
}

/**
 * Get event type icon
 */
export function getEventTypeIcon(eventType: string): string {
  const icons: Record<string, string> = {
    NAME_TOKEN_MINTED: "✨",
    NAME_TOKEN_TRANSFERRED: "↔️",
    NAME_TOKEN_RENEWED: "🔄",
    POOL_CREATED: "💧",
    FRACTIONALIZED: "🧩",
    BUYOUT_COMPLETED: "💰",
  };
  return icons[eventType] || "📋";
}

/**
 * Format blockchain explorer link
 */
export function getExplorerLink(txHash: string, chainId: string): string {
  const explorers: Record<string, string> = {
    "97476": "https://testnet-doma.avascan.com", // Doma testnet
    "1": "https://etherscan.io",
    "137": "https://polygonscan.com",
  };

  const baseUrl = explorers[chainId] || explorers["97476"];
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Format relative time
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString();
}

/**
 * Format absolute time
 */
export function formatAbsoluteTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Truncate address for display
 */
export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
