"use client";

import { useState, useEffect } from "react";
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

const portfolioCards = [
  {
    title: "Total Investment Value",
    value: "$12,450",
    change: "+8.2%",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Active Pools",
    value: "7",
    change: "+2",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Total Revenue Earned",
    value: "$1,234",
    change: "+15.3%",
    icon: TrendingUp,
    color: "text-purple-600",
  },
];

const activeInvestments = [
  {
    domain: "crypto.eth",
    shares: "150",
    value: "$2,340",
    roi: "+12.5%",
    status: "Active",
  },
  {
    domain: "defi.domains",
    shares: "89",
    value: "$1,567",
    roi: "+8.9%",
    status: "Active",
  },
  {
    domain: "web3.nft",
    shares: "234",
    value: "$3,421",
    roi: "+22.1%",
    status: "Voting",
  },
  {
    domain: "blockchain.xyz",
    shares: "67",
    value: "$987",
    roi: "+5.4%",
    status: "Active",
  },
  {
    domain: "dao.org",
    shares: "123",
    value: "$1,890",
    roi: "+18.7%",
    status: "Claim Available",
  },
];

const recentActivities = [
  {
    type: "investment",
    title: "Invested in crypto.eth pool",
    amount: "$500",
    time: "2 hours ago",
    icon: DollarSign,
  },
  {
    type: "vote",
    title: "Voted on defi.domains proposal",
    amount: "89 shares",
    time: "5 hours ago",
    icon: Vote,
  },
  {
    type: "claim",
    title: "Claimed revenue from web3.nft",
    amount: "$45.67",
    time: "1 day ago",
    icon: CheckCircle,
  },
  {
    type: "investment",
    title: "Joined blockchain.xyz pool",
    amount: "$200",
    time: "2 days ago",
    icon: DollarSign,
  },
];

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
  const [userName] = useState("dev.eth");

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
      case "settings":
        return "Settings";
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
      case "settings":
        return "Manage your account settings";
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
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeInvestments.map((investment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {investment.domain}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {investment.shares} shares • {investment.value}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-medium ${
                                investment.roi.startsWith("+")
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {investment.roi}
                            </div>
                            <Badge
                              variant={
                                investment.status === "Active"
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

          {currentView === "settings" && (
            <div className="flex items-center justify-center h-full p-6">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Settings panel coming soon...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
