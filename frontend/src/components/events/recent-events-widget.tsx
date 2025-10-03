"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ArrowRight, ExternalLink } from "lucide-react";
import {
  fetchPollEvents,
  formatEventType,
  formatRelativeTime,
  getEventTypeColor,
  getEventTypeIcon,
  getExplorerLink,
  truncateAddress,
  type PollEvent,
} from "@/lib/api/poll-events";

interface RecentEventsWidgetProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onViewAll?: () => void;
}

export function RecentEventsWidget({
  limit = 5,
  autoRefresh = true,
  refreshInterval = 15000,
  onViewAll,
}: RecentEventsWidgetProps) {
  const [events, setEvents] = useState<PollEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setError(null);
      const data = await fetchPollEvents({ limit });
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [limit]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadEvents();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Events
        </CardTitle>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="h-8 text-xs"
          >
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No events yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.unique_id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="text-xl shrink-0">
                  {getEventTypeIcon(event.event_type)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${getEventTypeColor(
                        event.event_type
                      )} text-xs`}
                    >
                      {formatEventType(event.event_type)}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium truncate">
                    {event.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(event.created_at)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={() =>
                    window.open(
                      getExplorerLink(event.tx_hash, event.chain_id),
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
