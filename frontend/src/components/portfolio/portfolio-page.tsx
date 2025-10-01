"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PortfolioSummary } from "./portfolio-summary"
import { PortfolioChart } from "./portfolio-chart"
import { InvestmentsTable } from "./investments-table"
import { RevenueHistory } from "./revenue-history"
import { GovernanceParticipation } from "./governance-participation"
import { PerformanceAnalytics } from "./performance-analytics"

export function PortfolioPage() {
  const [dateRange, setDateRange] = useState("30d")

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investments and performance across all pools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <PortfolioSummary dateRange={dateRange} />

      {/* Portfolio Value Chart */}
      <PortfolioChart dateRange={dateRange} />

      {/* My Investments Table */}
      <InvestmentsTable />

      {/* Revenue History Section */}
      <RevenueHistory />

      {/* Governance Participation */}
      <GovernanceParticipation />

      {/* Performance Analytics */}
      <PerformanceAnalytics />
    </div>
  )
}