"use client"

import { useState } from "react"
import { Search, Filter, Plus, Copy, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

// Mock data for pools
const mockPools = [
  {
    id: "1",
    domain: "blockchain.ai",
    poolAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    raised: 45000,
    target: 50000,
    pricePerShare: 25,
    investorCount: 42,
    status: "active",
    progress: 90,
    tld: ".ai"
  },
  {
    id: "2",
    domain: "defi.com",
    poolAddress: "0x8ba1f109551bD432803012645ac136ddd64DBA72",
    raised: 75000,
    target: 100000,
    pricePerShare: 50,
    investorCount: 28,
    status: "active",
    progress: 75,
    tld: ".com"
  },
  {
    id: "3",
    domain: "web3.io",
    poolAddress: "0x3c44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    raised: 30000,
    target: 30000,
    pricePerShare: 15,
    investorCount: 67,
    status: "completed",
    progress: 100,
    tld: ".io"
  },
  {
    id: "4",
    domain: "crypto.eth",
    poolAddress: "0x9fB6A1c2D3e4F5678901B2C3D4E5F67890123456",
    raised: 25000,
    target: 40000,
    pricePerShare: 20,
    investorCount: 35,
    status: "active",
    progress: 62.5,
    tld: ".eth"
  },
  {
    id: "5",
    domain: "nft.ai",
    poolAddress: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
    raised: 60000,
    target: 80000,
    pricePerShare: 30,
    investorCount: 55,
    status: "active",
    progress: 75,
    tld: ".ai"
  },
  {
    id: "6",
    domain: "dao.com",
    poolAddress: "0x5f6e7d8c9b0a1234567890abcdef1234567890ab",
    raised: 120000,
    target: 120000,
    pricePerShare: 60,
    investorCount: 89,
    status: "completed",
    progress: 100,
    tld: ".com"
  }
]

interface PoolFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedTLD: string
  onTLDChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  priceRange: number[]
  onPriceRangeChange: (value: number[]) => void
  sortBy: string
  onSortChange: (value: string) => void
  onReset: () => void
}

function PoolFilters({
  searchQuery,
  onSearchChange,
  selectedTLD,
  onTLDChange,
  selectedStatus,
  onStatusChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  onReset
}: PoolFiltersProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTLD} onValueChange={onTLDChange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="TLD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value=".ai">.ai</SelectItem>
                <SelectItem value=".com">.com</SelectItem>
                <SelectItem value=".io">.io</SelectItem>
                <SelectItem value=".eth">.eth</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="roi">Highest ROI</SelectItem>
                <SelectItem value="investors">Most Investors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Price per Share: ${priceRange[0]} - ${priceRange[1]}</label>
          <Slider
            value={priceRange}
            onValueChange={onPriceRangeChange}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface PoolCardProps {
  pool: typeof mockPools[0]
}

function PoolCard({ pool }: PoolCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-purple-100 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-geist font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {pool.domain}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(pool.poolAddress)}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Badge className={getStatusColor(pool.status)}>
            {pool.status.charAt(0).toUpperCase() + pool.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium">{pool.progress}%</span>
          </div>
          <Progress value={pool.progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              ${pool.raised.toLocaleString()} / ${pool.target.toLocaleString()}
            </span>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              ${pool.pricePerShare}/share
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, pool.investorCount))].map((_, i) => (
                <Avatar key={i} className="w-6 h-6 border-2 border-white dark:border-gray-800">
                  <AvatarFallback className="text-xs">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {pool.investorCount > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">+{pool.investorCount - 3}</span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {pool.investorCount} investors
            </span>
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist">
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          onClick={() => onPageChange(page)}
          className={page === currentPage ? "bg-purple-600 hover:bg-purple-700" : ""}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
        <Search className="w-12 h-12 text-purple-500" />
      </div>
      <h3 className="text-xl font-geist font-semibold text-gray-900 dark:text-white mb-2">
        No pools found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Try adjusting your filters or be the first to create an investment pool for a premium domain.
      </p>
      <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist">
        <Plus className="w-4 h-4 mr-2" />
        Create First Pool
      </Button>
    </div>
  )
}

export function PoolExplorer() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTLD, setSelectedTLD] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [priceRange, setPriceRange] = useState([10, 100])
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and sort pools
  const filteredPools = mockPools.filter(pool => {
    const matchesSearch = pool.domain.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTLD = selectedTLD === "all" || pool.tld === selectedTLD
    const matchesStatus = selectedStatus === "all" || pool.status === selectedStatus
    const matchesPrice = pool.pricePerShare >= priceRange[0] && pool.pricePerShare <= priceRange[1]

    return matchesSearch && matchesTLD && matchesStatus && matchesPrice
  }).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.id.localeCompare(a.id)
      case "trending":
        return b.investorCount - a.investorCount
      case "roi":
        return b.progress - a.progress
      case "investors":
        return b.investorCount - a.investorCount
      default:
        return 0
    }
  })

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedTLD("all")
    setSelectedStatus("all")
    setPriceRange([10, 100])
    setSortBy("newest")
    setCurrentPage(1)
  }

  // Pagination
  const poolsPerPage = 6
  const totalPages = Math.ceil(filteredPools.length / poolsPerPage)
  const startIndex = (currentPage - 1) * poolsPerPage
  const paginatedPools = filteredPools.slice(startIndex, startIndex + poolsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-geist font-bold text-gray-900 dark:text-white mb-2">
              Investment Pools
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover and invest in premium domain pools
            </p>
          </div>
          <Button className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist">
            <Plus className="w-4 h-4 mr-2" />
            Create Pool
          </Button>
        </div>

        {/* Filters */}
        <PoolFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTLD={selectedTLD}
          onTLDChange={setSelectedTLD}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={resetFilters}
        />

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {paginatedPools.length} of {filteredPools.length} pools
          </p>
        </div>

        {/* Pool Grid */}
        {paginatedPools.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}