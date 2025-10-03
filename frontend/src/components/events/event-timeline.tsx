"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  Hash,
  User,
  Activity,
} from "lucide-react";
import {
  fetchPollEvents,
  formatEventType,
  formatRelativeTime,
  formatAbsoluteTime,
  getEventTypeColor,
  getEventTypeIcon,
  getExplorerLink,
  truncateAddress,
  type PollEvent,
  type EventFilters,
} from "@/lib/api/poll-events";

interface EventTimelineProps {
  domainFilter?: string;
  tokenFilter?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function EventTimeline({
  domainFilter,
  tokenFilter,
  limit = 50,
  autoRefresh = true,
  refreshInterval = 10000,
}: EventTimelineProps) {
  const [events, setEvents] = useState<PollEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PollEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<EventFilters>({
    limit,
    event_type: "",
    name: domainFilter || "",
    token_id: tokenFilter || "",
  });

  // Fetch events
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPollEvents(filters);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [filters]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadEvents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, filters]);

  // Update filters when props change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      name: domainFilter || "",
      token_id: tokenFilter || "",
    }));
  }, [domainFilter, tokenFilter]);

  const handleFilterChange = (
    key: keyof EventFilters,
    value: string | number
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      limit,
      event_type: "",
      name: domainFilter || "",
      token_id: tokenFilter || "",
    });
  };

  const hasActiveFilters =
    filters.event_type ||
    (filters.name && !domainFilter) ||
    (filters.token_id && !tokenFilter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Event Timeline</h2>
          <p className="text-muted-foreground">
            Real-time events from Doma Protocol
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadEvents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={filters.event_type || ""}
                  onValueChange={(value) =>
                    handleFilterChange("event_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="NAME_TOKEN_MINTED">
                      Name Token Minted
                    </SelectItem>
                    <SelectItem value="NAME_TOKEN_TRANSFERRED">
                      Name Token Transferred
                    </SelectItem>
                    <SelectItem value="NAME_TOKEN_RENEWED">
                      Name Token Renewed
                    </SelectItem>
                    <SelectItem value="POOL_CREATED">Pool Created</SelectItem>
                    <SelectItem value="FRACTIONALIZED">
                      Fractionalized
                    </SelectItem>
                    <SelectItem value="BUYOUT_COMPLETED">
                      Buyout Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Domain Name</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search domain..."
                    value={filters.name || ""}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    className="pl-8"
                    disabled={!!domainFilter}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Token ID</Label>
                <Input
                  placeholder="Token ID..."
                  value={filters.token_id || ""}
                  onChange={(e) =>
                    handleFilterChange("token_id", e.target.value)
                  }
                  disabled={!!tokenFilter}
                />
              </div>

              <div className="space-y-2">
                <Label>Results Limit</Label>
                <Select
                  value={String(filters.limit || 50)}
                  onValueChange={(value) =>
                    handleFilterChange("limit", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardContent className="p-0">
          {loading && events.length === 0 ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadEvents} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Events will appear here as they occur"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <div
                  key={event.unique_id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="text-2xl mt-0.5">
                        {getEventTypeIcon(event.event_type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={getEventTypeColor(event.event_type)}
                          >
                            {formatEventType(event.event_type)}
                          </Badge>
                          <span className="font-mono text-sm text-muted-foreground">
                            #{event.event_id}
                          </span>
                        </div>
                        <div className="font-medium truncate">{event.name}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(event.created_at)}
                          </span>
                          {event.event_data?.owner && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {truncateAddress(event.event_data.owner)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {truncateAddress(event.tx_hash)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          getExplorerLink(event.tx_hash, event.chain_id),
                          "_blank"
                        );
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">
                {selectedEvent && getEventTypeIcon(selectedEvent.event_type)}
              </span>
              Event Details
            </DialogTitle>
            <DialogDescription>
              Full information about this event
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Event Type</Label>
                  <div className="mt-1">
                    <Badge
                      className={getEventTypeColor(selectedEvent.event_type)}
                    >
                      {formatEventType(selectedEvent.event_type)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event ID</Label>
                  <div className="font-mono mt-1">
                    #{selectedEvent.event_id}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Domain Name</Label>
                  <div className="font-medium mt-1">{selectedEvent.name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <div className="mt-1">
                    {formatAbsoluteTime(selectedEvent.created_at)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {selectedEvent.processing_status}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">
                    Transaction Hash
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {selectedEvent.tx_hash}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          getExplorerLink(
                            selectedEvent.tx_hash,
                            selectedEvent.chain_id
                          ),
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Block Number</Label>
                  <div className="font-mono mt-1">
                    {selectedEvent.block_number}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Chain ID</Label>
                  <div className="font-mono mt-1">{selectedEvent.chain_id}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Token ID</Label>
                  <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 break-all">
                    {selectedEvent.token_id}
                  </code>
                </div>
              </div>

              {selectedEvent.event_data &&
                Object.keys(selectedEvent.event_data).length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Event Data</Label>
                    <pre className="mt-1 text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedEvent.event_data, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
