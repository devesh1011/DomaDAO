"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "./search-bar"
import { DomainFilters } from "./domain-filters"
import { DomainGrid } from "./domain-grid"
import { LoadMore } from "./load-more"

interface Domain {
  name: string
  tld: string
  expiryDate: string
  owner: string
  chains: string[]
  listings: number
  offers: number
}

const mockDomains: Domain[] = [
  {
    name: "crypto",
    tld: ".eth",
    expiryDate: "2026-03-15",
    owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    chains: ["ethereum", "polygon"],
    listings: 2,
    offers: 5
  },
  {
    name: "defi",
    tld: ".domains",
    expiryDate: "2025-11-20",
    owner: "0x8ba1f109551bD432803012645261768374161972",
    chains: ["ethereum"],
    listings: 1,
    offers: 3
  },
  {
    name: "web3",
    tld: ".nft",
    expiryDate: "2026-01-10",
    owner: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
    chains: ["ethereum", "bsc"],
    listings: 0,
    offers: 8
  },
  {
    name: "blockchain",
    tld: ".xyz",
    expiryDate: "2025-12-05",
    owner: "0x28C6c06298d514Db089934071355E5743bf21d60",
    chains: ["ethereum", "optimism"],
    listings: 3,
    offers: 2
  },
  {
    name: "dao",
    tld: ".org",
    expiryDate: "2026-02-28",
    owner: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
    chains: ["ethereum"],
    listings: 1,
    offers: 4
  },
  {
    name: "premium",
    tld: ".ai",
    expiryDate: "2025-10-15",
    owner: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    chains: ["ethereum", "arbitrum"],
    listings: 0,
    offers: 6
  }
]

export function DomainSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTLD, setSelectedTLD] = useState("All")
  const [domains] = useState<Domain[]>(mockDomains)
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>(mockDomains)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Filter domains based on search query and TLD
  useEffect(() => {
    let filtered = domains

    if (searchQuery) {
      filtered = filtered.filter(domain =>
        domain.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedTLD !== "All") {
      filtered = filtered.filter(domain => domain.tld === selectedTLD)
    }

    setFilteredDomains(filtered)
  }, [searchQuery, selectedTLD, domains])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTLDChange = (tld: string) => {
    setSelectedTLD(tld)
  }

  const handleLoadMore = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setHasMore(false)
      setIsLoading(false)
    }, 1000)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
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
          >
            {tld}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      <DomainFilters />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredDomains.length} results{searchQuery && ` for "${searchQuery}"`}
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
      <DomainGrid domains={filteredDomains} />

      {/* Load More */}
      {hasMore && filteredDomains.length > 0 && (
        <LoadMore onLoadMore={handleLoadMore} isLoading={isLoading} />
      )}

      {/* Empty State */}
      {filteredDomains.length === 0 && (
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
    </div>
  )
}