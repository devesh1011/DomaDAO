"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface PortfolioChartProps {
  dateRange: string
}

// Mock data for portfolio value over time
const generateMockData = (days: number) => {
  const data = []
  const baseValue = 10000
  let currentValue = baseValue

  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    // Add some random variation
    const change = (Math.random() - 0.5) * 500
    currentValue += change
    currentValue = Math.max(currentValue, 8000) // Keep it above 8k

    data.push({
      date: date.toISOString().split('T')[0],
      usd: Math.round(currentValue),
      eth: Math.round(currentValue / 2500 * 100) / 100 // Approximate ETH conversion
    })
  }

  return data
}

export function PortfolioChart({ dateRange }: PortfolioChartProps) {
  const [currency, setCurrency] = useState<"usd" | "eth">("usd")

  const getDaysFromRange = (range: string) => {
    switch (range) {
      case "7d": return 7
      case "30d": return 30
      case "90d": return 90
      case "all": return 365
      default: return 30
    }
  }

  const chartData = generateMockData(getDaysFromRange(dateRange))

  const formatCurrency = (value: number, curr: "usd" | "eth") => {
    if (curr === "usd") {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    } else {
      return `${value.toFixed(2)} ETH`
    }
  }

  const formatTooltipValue = (value: number, name: string) => {
    return [formatCurrency(value, currency), name === "usd" ? "USD Value" : "ETH Value"]
  }

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Value Over Time</CardTitle>
          <ToggleGroup type="single" value={currency} onValueChange={(value) => value && setCurrency(value as "usd" | "eth")}>
            <ToggleGroupItem value="usd" aria-label="USD">USD</ToggleGroupItem>
            <ToggleGroupItem value="eth" aria-label="ETH">ETH</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisLabel}
                className="text-xs"
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, currency)}
                className="text-xs"
              />
              <Tooltip
                formatter={formatTooltipValue}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Line
                type="monotone"
                dataKey={currency}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}