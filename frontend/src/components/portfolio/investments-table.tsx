"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, ExternalLink, Vote, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Investment {
  id: string
  domain: string
  shares: number
  initialInvestment: number
  currentValue: number
  roi: number
  revenueEarned: number
  status: "Active" | "Completed" | "Voting" | "Claim Available"
}

const mockInvestments: Investment[] = [
  {
    id: "1",
    domain: "crypto.eth",
    shares: 150,
    initialInvestment: 2340,
    currentValue: 2550,
    roi: 8.97,
    revenueEarned: 210,
    status: "Active"
  },
  {
    id: "2",
    domain: "defi.domains",
    shares: 89,
    initialInvestment: 1567,
    currentValue: 1420,
    roi: -9.38,
    revenueEarned: 95,
    status: "Active"
  },
  {
    id: "3",
    domain: "web3.nft",
    shares: 234,
    initialInvestment: 3421,
    currentValue: 3890,
    roi: 13.71,
    revenueEarned: 469,
    status: "Voting"
  },
  {
    id: "4",
    domain: "blockchain.xyz",
    shares: 67,
    initialInvestment: 987,
    currentValue: 1120,
    roi: 13.47,
    revenueEarned: 133,
    status: "Active"
  },
  {
    id: "5",
    domain: "dao.org",
    shares: 123,
    initialInvestment: 1890,
    currentValue: 2100,
    roi: 11.11,
    revenueEarned: 210,
    status: "Claim Available"
  }
]

type SortField = keyof Investment
type SortDirection = "asc" | "desc"

export function InvestmentsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("domain")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const filteredAndSortedInvestments = useMemo(() => {
    const filtered = mockInvestments.filter(investment =>
      investment.domain.toLowerCase().includes(searchQuery.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [searchQuery, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800"
      case "Completed": return "bg-blue-100 text-blue-800"
      case "Voting": return "bg-purple-100 text-purple-800"
      case "Claim Available": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const exportToCSV = () => {
    const headers = ["Domain", "Shares", "Initial Investment", "Current Value", "ROI %", "Revenue Earned", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedInvestments.map(investment => [
        investment.domain,
        investment.shares,
        investment.initialInvestment,
        investment.currentValue,
        investment.roi,
        investment.revenueEarned,
        investment.status
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "portfolio-investments.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Investments</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search investments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("domain")} className="h-auto p-0 font-semibold">
                    Pool/Domain {getSortIcon("domain")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("shares")} className="h-auto p-0 font-semibold">
                    Shares {getSortIcon("shares")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("initialInvestment")} className="h-auto p-0 font-semibold">
                    Initial Investment {getSortIcon("initialInvestment")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("currentValue")} className="h-auto p-0 font-semibold">
                    Current Value {getSortIcon("currentValue")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("roi")} className="h-auto p-0 font-semibold">
                    ROI % {getSortIcon("roi")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("revenueEarned")} className="h-auto p-0 font-semibold">
                    Revenue Earned {getSortIcon("revenueEarned")}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedInvestments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {investment.domain}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>{investment.shares.toLocaleString()}</TableCell>
                  <TableCell>
                    <div>
                      <div>{formatCurrency(investment.initialInvestment)}</div>
                      <div className="text-xs text-muted-foreground">
                        ≈ {(investment.initialInvestment / 2500).toFixed(2)} ETH
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{formatCurrency(investment.currentValue)}</div>
                      <div className="text-xs text-muted-foreground">
                        ≈ {(investment.currentValue / 2500).toFixed(2)} ETH
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={investment.roi >= 0 ? "text-green-600" : "text-red-600"}>
                      {investment.roi >= 0 ? "+" : ""}{investment.roi.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(investment.revenueEarned)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(investment.status)}>
                      {investment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Pool
                        </DropdownMenuItem>
                        {investment.status === "Claim Available" && (
                          <DropdownMenuItem>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Claim Revenue
                          </DropdownMenuItem>
                        )}
                        {investment.status === "Voting" && (
                          <DropdownMenuItem>
                            <Vote className="h-4 w-4 mr-2" />
                            Vote on Proposals
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}