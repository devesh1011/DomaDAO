"use client"

import { TrendingUp, TrendingDown, DollarSign, Users, PiggyBank, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const mockSummaryData = {
  totalValue: 12450,
  totalValueChange: 8.2,
  activePools: 7,
  activePoolsChange: 2,
  totalRevenue: 1234,
  totalRevenueChange: 15.3,
  roi: 12.5,
  roiChange: 3.1
}

export function PortfolioSummary() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(percentage)}%
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Investment Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Investment Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(mockSummaryData.totalValue)}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>≈ 2.45 ETH</span>
            {formatPercentage(mockSummaryData.totalValueChange)}
          </div>
        </CardContent>
      </Card>

      {/* Active Pools */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Pools</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockSummaryData.activePools}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>+{mockSummaryData.activePoolsChange} from last period</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue Earned */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue Earned</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(mockSummaryData.totalRevenue)}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>≈ 0.25 ETH</span>
            {formatPercentage(mockSummaryData.totalRevenueChange)}
          </div>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio ROI</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{mockSummaryData.roi}%
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>+{mockSummaryData.roiChange}% from last period</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}