"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Globe,
  Vote,
  TrendingUp,
  DollarSign,
  Users,
  Bell,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PoolExplorer } from "@/components/dashboard/pool-explorer";
import { DomainSearch } from "@/components/domains/domain-search";
import { PortfolioPage } from "@/components/portfolio/portfolio-page";
import { GovernancePage } from "@/components/governance/governance-page";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { RecentEventsWidget } from "@/components/events/recent-events-widget";
import { EventsPage } from "@/components/events/events-page";
import { useWallet } from "@/contexts/wallet-context";
import { useUserPortfolio } from "@/hooks/use-api";

// Removed hardcoded mock data - portfolio cards now generated from real data

const governanceAlerts = [
  {
    title: "Vote on crypto.eth revenue distribution",
    description: "Proposal ends in 24 hours",
    type: "urgent",
    time: "23h 45m left",
  },
  {
    title: "New governance proposal: Domain acquisition strategy",
    description: "Voting starts tomorrow",
    type: "info",
    time: "18h until voting",
  },
];

export function DomaDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account, isConnected } = useWallet();
  const [userName] = useState("dev.eth");

  // Fetch real portfolio data
  const {
    data: portfolioData,
    loading: portfolioLoading,
    refetch: refetchPortfolio,
  } = useUserPortfolio(account);

  // Generate portfolio cards with real data
  const portfolioCards = useMemo(() => {
    if (!portfolioData) {
      return [
        {
          title: "Total Investment Value",
          value: isConnected ? "..." : "$0",
          change: "+0%",
          icon: DollarSign,
          color: "text-green-600",
        },
        {
          title: "Active Pools",
          value: isConnected ? "..." : "0",
          change: "+0",
          icon: Users,
          color: "text-blue-600",
        },
        {
          title: "Total Revenue Earned",
          value: isConnected ? "..." : "$0",
          change: "+0%",
          icon: TrendingUp,
          color: "text-purple-600",
        },
      ];
    }

    return [
      {
        title: "Total Investment Value",
        value: `$${portfolioData.totalInvestmentValue.toFixed(2)}`,
        change: "+0%", // TODO: Calculate change from historical data
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        title: "Active Pools",
        value: portfolioData.activePools.toString(),
        change: "+0",
        icon: Users,
        color: "text-blue-600",
      },
      {
        title: "Total Revenue Earned",
        value: `$${portfolioData.totalRevenue.toFixed(2)}`,
        change: "+0%",
        icon: TrendingUp,
        color: "text-purple-600",
      },
    ];
  }, [portfolioData, isConnected]);

  // Get active investments from portfolio data
  const activeInvestments = useMemo(() => {
    if (!portfolioData) return [];

    return portfolioData.activeInvestments.map((inv) => ({
      domain: inv.domain,
      shares: inv.shares || "0",
      value: `$${parseFloat(inv.value).toFixed(2)}`,
      roi: "+0%", // TODO: Calculate ROI
      status: inv.status,
    }));
  }, [portfolioData]);

  // Get current view from URL search params, default to "dashboard"
  const currentView = searchParams.get("view") || "dashboard";

  const setCurrentView = (view: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("view", view);
    router.push(`/dashboard?${newSearchParams.toString()}`, { scroll: false });
  };

  const getPageTitle = () => {
    switch (currentView) {
      case "dashboard":
        return "Dashboard";
      case "pools":
        return "Investment Pools";
      case "domains":
        return "Domain Search";
      case "portfolio":
        return "My Portfolio";
      case "governance":
        return "Governance";
      case "events":
        return "Network Events";
      default:
        return "Dashboard";
    }
  };

  const getPageDescription = () => {
    switch (currentView) {
      case "dashboard":
        return `Welcome back, ${userName} • Last login: 2 hours ago`;
      case "pools":
        return "Discover and invest in premium domain pools";
      case "domains":
        return "Search and explore available domains";
      case "portfolio":
        return "Track your investments and earnings";
      case "governance":
        return "Participate in DAO governance";
      case "events":
        return "Real-time events from Doma Protocol";
      default:
        return `Welcome back, ${userName} • Last login: 2 hours ago`;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
              <p className="text-sm text-muted-foreground">
                {getPageDescription()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="flex-1">
          {currentView === "dashboard" && (
            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {portfolioCards.map((card, index) => (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {card.title}
                      </CardTitle>
                      <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{card.value}</div>
                      <p className="text-xs text-muted-foreground">
                        <span
                          className={
                            card.change.startsWith("+")
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {card.change}
                        </span>{" "}
                        from last month
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                      onClick={() => setCurrentView("pools")}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Browse Pools
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentView("domains")}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Search Domains
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentView("governance")}
                    >
                      <Vote className="h-4 w-4 mr-2" />
                      View Proposals
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Active Investments Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Active Investments</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentView("pools")}
                    >
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {portfolioLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Loading investments...
                        </span>
                      </div>
                    ) : !isConnected ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect your wallet to view your investments
                        </p>
                        <WalletConnect />
                      </div>
                    ) : activeInvestments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">
                          No active investments yet
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setCurrentView("pools")}
                          className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                        >
                          Browse Pools
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeInvestments
                          .slice(0, 5)
                          .map((investment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              onClick={() =>
                                router.push(
                                  `/pools/${
                                    portfolioData?.activeInvestments[index]
                                      ?.poolAddress || ""
                                  }`
                                )
                              }
                            >
                              <div className="flex-1">
                                <div className="font-medium">
                                  {investment.domain}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Contributed: {investment.value}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    investment.status === "ACTIVE"
                                      ? "default"
                                      : investment.status === "Voting"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {investment.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Events Widget */}
                <RecentEventsWidget
                  limit={5}
                  autoRefresh
                  refreshInterval={15000}
                  onViewAll={() => setCurrentView("events")}
                />
              </div>

              {/* Governance Alerts */}
              {governanceAlerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Governance Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {governanceAlerts.map((alert, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <AlertCircle
                            className={`h-5 w-5 mt-0.5 ${
                              alert.type === "urgent"
                                ? "text-red-500"
                                : "text-blue-500"
                            }`}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {alert.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.time}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={
                              alert.type === "urgent" ? "default" : "outline"
                            }
                          >
                            {alert.type === "urgent"
                              ? "Vote Now"
                              : "View Details"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentView === "pools" && (
            <div className="h-full">
              <PoolExplorer />
            </div>
          )}

          {currentView === "domains" && (
            <div className="h-full">
              <DomainSearch />
            </div>
          )}

          {currentView === "portfolio" && (
            <div className="h-full">
              <PortfolioPage />
            </div>
          )}

          {currentView === "governance" && (
            <div className="h-full">
              <GovernancePage />
            </div>
          )}

          {currentView === "events" && (
            <div className="p-6">
              <EventsPage />
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
