"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  TrendingUp,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  fetchPollStats,
  fetchPollHealth,
  formatEventType,
  type PollEventStats,
} from "@/lib/api/poll-events";

interface EventAnalyticsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function EventAnalytics({
  autoRefresh = true,
  refreshInterval = 10000,
}: EventAnalyticsProps) {
  const [stats, setStats] = useState<PollEventStats | null>(null);
  const [health, setHealth] = useState<{
    status: string;
    lastAcknowledgedId: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, healthData] = await Promise.all([
        fetchPollStats(),
        fetchPollHealth(),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const eventTypeEntries = Object.entries(stats.byType).sort(
    (a, b) => b[1] - a[1]
  );
  const statusEntries = Object.entries(stats.byStatus);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.byType).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Different event types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Event ID</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{stats.lastAcknowledgedId}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Latest acknowledged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consumer Status
            </CardTitle>
            {stats.isRunning ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isRunning ? "Running" : "Stopped"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {health?.status || "Unknown"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Event Types Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventTypeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events yet
            </div>
          ) : (
            <div className="space-y-4">
              {eventTypeEntries.map(([type, count]) => {
                const percentage = (count / stats.total) * 100;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{formatEventType(type)}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {count.toLocaleString()} events
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusEntries.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No status data
                </div>
              ) : (
                statusEntries.map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          status === "processed" || status === "acknowledged"
                            ? "bg-green-600"
                            : status === "failed"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        }`}
                      />
                      <span className="text-sm font-medium capitalize">
                        {status}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Event Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Event Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventTypeEntries.slice(0, 5).map(([type, count], index) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm">{formatEventType(type)}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
              {eventTypeEntries.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No events yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Network Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.byType["NAME_TOKEN_MINTED"] || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Domains Minted
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {stats.byType["NAME_TOKEN_TRANSFERRED"] || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Transfers
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.byType["POOL_CREATED"] || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Pools Created
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.byType["FRACTIONALIZED"] || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Fractionalized
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
