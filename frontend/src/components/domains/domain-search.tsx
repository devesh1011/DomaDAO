"use client"

import { useState, useEffect } from "react"
import { Search, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "./search-bar"
import { DomainFilters } from "./domain-filters"
import { DomainGrid } from "./domain-grid"
import { useDomainSearch } from "@/hooks/use-api"

export function DomainSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedTLD, setSelectedTLD] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 12

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1) // Reset to page 1 on new search
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch domains from API
  const { data: domainsResponse, loading, error, refetch } = useDomainSearch({
    query: debouncedQuery || undefined,
    tld: selectedTLD !== "All" ? selectedTLD : undefined,
    page: currentPage,
    limit,
    includePricing: true // Enable pricing data
  })

  const domains = domainsResponse?.data || []
  const hasMore = currentPage < (domainsResponse?.pagination?.totalPages || 1)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTLDChange = (tld: string) => {
    setSelectedTLD(tld)
    setCurrentPage(1) // Reset to page 1 on filter change
  }

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setDebouncedQuery("")
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search 963,237+ domains..."
        />
        <p className="text-muted-foreground">
          Discover tokenized domains across multiple chains
        </p>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["All", ".ai", ".com", ".io", ".eth", ".xyz"].map((tld) => (
          <Button
            key={tld}
            variant={selectedTLD === tld ? "default" : "outline"}
            size="sm"
            onClick={() => handleTLDChange(tld)}
            className="whitespace-nowrap"
            disabled={loading}
          >
            {tld}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      <DomainFilters />

      {/* Loading State */}
      {loading && currentPage === 1 && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-muted-foreground">Searching domains...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load domains</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => refetch()} className="bg-gradient-to-r from-purple-600 to-pink-500">
            Try Again
          </Button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {domains.length} of {domainsResponse?.pagination?.total || 0} results
              {searchQuery && ` for "${searchQuery}"`}
            </p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear search
              </Button>
            )}
          </div>

          {/* Domain Grid */}
          <DomainGrid domains={domains} />

          {/* Load More */}
          {hasMore && domains.length > 0 && (
            <div className="text-center">
              <Button 
                onClick={handleLoadMore} 
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {domains.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No domains found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? `No domains found for "${searchQuery}"` : "No domains match your filters"}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Try different search terms</li>
                      <li>Clear filters</li>
                      <li>Browse all domains</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
