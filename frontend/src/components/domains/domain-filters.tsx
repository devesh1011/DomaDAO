"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function DomainFilters() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tlds, setTlds] = useState<string[]>([])
  const [registrar, setRegistrar] = useState("all")
  const [network, setNetwork] = useState("all")
  const [expiryRange, setExpiryRange] = useState([0, 365])
  const [hasListings, setHasListings] = useState(false)
  const [hasOffers, setHasOffers] = useState(false)
  const [sortBy, setSortBy] = useState("name-asc")

  const availableTLDs = [".ai", ".com", ".io", ".eth", ".xyz", ".org", ".nft", ".domains"]
  const registrars = ["ENS", "GoDaddy", "Namecheap", "Unstoppable Domains", "Other"]
  const networks = ["Ethereum", "Polygon", "BSC", "Arbitrum", "Optimism", "Base"]

  const handleTLDChange = (tld: string) => {
    setTlds(prev =>
      prev.includes(tld)
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    )
  }

  const clearFilters = () => {
    setTlds([])
    setRegistrar("all")
    setNetwork("all")
    setExpiryRange([0, 365])
    setHasListings(false)
    setHasOffers(false)
    setSortBy("name-asc")
  }

  const activeFiltersCount = [
    tlds.length > 0,
    registrar !== "all",
    network !== "all",
    expiryRange[0] > 0 || expiryRange[1] < 365,
    hasListings,
    hasOffers,
    sortBy !== "name-asc"
  ].filter(Boolean).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* TLD Multi-select */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">TLD</Label>
            <div className="flex flex-wrap gap-2">
              {availableTLDs.map((tld) => (
                <Button
                  key={tld}
                  variant={tlds.includes(tld) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTLDChange(tld)}
                >
                  {tld}
                </Button>
              ))}
            </div>
          </div>

          {/* Registrar and Network */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrar">Registrar</Label>
              <Select value={registrar} onValueChange={setRegistrar}>
                <SelectTrigger>
                  <SelectValue placeholder="All registrars" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All registrars</SelectItem>
                  {registrars.map((reg) => (
                    <SelectItem key={reg} value={reg}>
                      {reg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="network">Network/Chain</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="All networks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All networks</SelectItem>
                  {networks.map((net) => (
                    <SelectItem key={net} value={net}>
                      {net}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expiry Date Range */}
          <div className="space-y-3">
            <Label>Expiry Date Range (days)</Label>
            <div className="px-2">
              <Slider
                value={expiryRange}
                onValueChange={setExpiryRange}
                max={365}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 days</span>
                <span>{expiryRange[0]} - {expiryRange[1]} days</span>
                <span>365+ days</span>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="has-listings"
                checked={hasListings}
                onCheckedChange={setHasListings}
              />
              <Label htmlFor="has-listings">Has active listings</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="has-offers"
                checked={hasOffers}
                onCheckedChange={setHasOffers}
              />
              <Label htmlFor="has-offers">Has offers</Label>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label htmlFor="sort-by">Sort by</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="recently-tokenized">Recently Tokenized</SelectItem>
                <SelectItem value="expiry-asc">Expiry Date (Soonest)</SelectItem>
                <SelectItem value="expiry-desc">Expiry Date (Latest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  )
}