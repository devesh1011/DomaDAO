"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Plus, Copy, Eye, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { usePools } from "@/hooks/use-api"
import type { Pool } from "@/lib/api-types"
import { CreatePoolDialog } from "@/components/pools/create-pool-dialog"

// Helper function to extract TLD from domain name
function getTLD(domain: string): string {
  const parts = domain.split('.')
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
}

// Helper function to parse ETH value
function parseEthValue(value: string): number {
  const match = value.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

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
  pool: Pool
}

function PoolCard({ pool }: PoolCardProps) {
  const router = useRouter()
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const handleViewDetails = () => {
    router.push(`/pools/${pool.address}`)
  }

  // Parse values from API response
  const progress = pool.progress || 0
  // const raised = parseEthValue(pool.totalRaised || '0')
  // const pricePerShare = parseEthValue(pool.pricePerShare || '0')
  // const tld = getTLD(pool.domainName || '')


  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-purple-100 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-geist font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {pool.domainName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(pool.address)}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <Badge className={getStatusColor(pool.status)}>
            {pool.status.charAt(0).toUpperCase() + pool.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {pool.totalRaised}
            </span>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              {pool.pricePerShare}/share
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

        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist"
          onClick={handleViewDetails}
        >
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

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
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
      <Button 
        onClick={onCreateClick}
        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist"
      >
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Fetch pools from API
  const poolsPerPage = 9
  const { data: poolsResponse, loading, error, refetch } = usePools({
    page: currentPage,
    limit: poolsPerPage,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined
  })

  // Client-side filtering and sorting
  const filteredAndSortedPools = useMemo(() => {
    if (!poolsResponse?.data) return []

    const filtered = poolsResponse.data.filter((pool: Pool) => {
      const matchesSearch = pool.domainName?.toLowerCase().includes(searchQuery.toLowerCase())
      const tld = getTLD(pool.domainName || '')
      const matchesTLD = selectedTLD === "all" || tld === selectedTLD
      const matchesStatus = selectedStatus === "all" || pool.status.toLowerCase() === selectedStatus.toLowerCase()
      const pricePerShare = parseEthValue(pool.pricePerShare || '0')
      const matchesPrice = pricePerShare >= priceRange[0] && pricePerShare <= priceRange[1]

      return matchesSearch && matchesTLD && matchesStatus && matchesPrice
    })

    // Sort pools
    filtered.sort((a: Pool, b: Pool) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "trending":
          return (b.investorCount || 0) - (a.investorCount || 0)
        case "roi":
          return (b.progress || 0) - (a.progress || 0)
        case "investors":
          return (b.investorCount || 0) - (a.investorCount || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [poolsResponse, searchQuery, selectedTLD, selectedStatus, priceRange, sortBy])

  const resetFilters = () => {
    setSearchQuery("")
    setSelectedTLD("all")
    setSelectedStatus("all")
    setPriceRange([10, 100])
    setSortBy("newest")
    setCurrentPage(1)
  }

  // Pagination
  const totalPages = poolsResponse?.pagination?.totalPages || 1
  const dataSource = poolsResponse?.source

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
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-geist"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Pool
          </Button>
        </div>

        {/* Data Source Notification */}
        {dataSource === 'blockchain' && poolsResponse?.data && poolsResponse.data.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Fetched from Blockchain
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Pools are being loaded directly from the blockchain. This ensures you see the most up-to-date data, including newly created pools.
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading pools...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Failed to load pools</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => refetch()} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Showing {filteredAndSortedPools.length} of {poolsResponse?.pagination?.total || 0} pools
              </p>
            </div>

            {/* Pool Grid */}
            {filteredAndSortedPools.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredAndSortedPools.map((pool: Pool) => (
                    <PoolCard key={pool.address} pool={pool} />
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
              <EmptyState onCreateClick={() => setCreateDialogOpen(true)} />
            )}
          </>
        )}
      </div>

      {/* Create Pool Dialog */}
      <CreatePoolDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false)
          // Wait a moment for blockchain to update, then refetch
          setTimeout(() => {
            refetch()
          }, 2000)
        }}
      />
    </div>
  )
}