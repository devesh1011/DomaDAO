"use client"

import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Domain } from "@/lib/api-types"

interface DomainGridProps {
  domains: Domain[]
}

const getExpiryColor = (expiryDate: string) => {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 30) return "text-red-600 bg-red-50 border-red-200"
  if (daysUntilExpiry < 90) return "text-yellow-600 bg-yellow-50 border-yellow-200"
  return "text-green-600 bg-green-50 border-green-200"
}

const getChainIcon = (chainName: string) => {
  const icons: Record<string, string> = {
    ethereum: "⟠",
    polygon: "⬡",
    bsc: "●",
    arbitrum: "⟐",
    optimism: "⚡",
    base: "⊙"
  }
  return icons[chainName.toLowerCase()] || "●"
}

export function DomainGrid({ domains }: DomainGridProps) {
  const router = useRouter()

  // Defensive check: ensure domains is an array
  if (!domains || !Array.isArray(domains) || domains.length === 0) {
    return null
  }

  const handleViewDetails = (domain: Domain) => {
    // Navigate to domain detail page
    const domainFullName = `${domain.name}${domain.tld}`
    router.push(`/domains/${encodeURIComponent(domainFullName)}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {domains.map((domain) => (
        <Card
          key={`${domain.name}${domain.tld}`}
          className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold truncate">
                  {domain.name}
                  <span className="text-muted-foreground">{domain.tld}</span>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {domain.tld}
                  </Badge>
                  <div className="flex gap-1">
                    {domain.tokens.slice(0, 3).map((token) => (
                      <span
                        key={`${token.chainId}-${token.contractAddress}`}
                        className="text-xs"
                        title={token.chainName}
                      >
                        {getChainIcon(token.chainName)}
                      </span>
                    ))}
                    {domain.tokens.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{domain.tokens.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Best Offer Price */}
            {domain.bestOffer && (
              <div>
                <p className="text-sm text-muted-foreground">Best Offer</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">
                    {(parseFloat(domain.bestOffer.price) / Math.pow(10, domain.bestOffer.currency.decimals)).toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {domain.bestOffer.currency.symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Expiry Date */}
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <Badge
                variant="outline"
                className={`text-xs ${getExpiryColor(domain.expiresAt)}`}
              >
                {new Date(domain.expiresAt).toLocaleDateString()}
              </Badge>
            </div>

            {/* Owner */}
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="text-xs font-mono truncate">
                {domain.owner.slice(0, 6)}...{domain.owner.slice(-4)}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600">
                  {domain.tokens.length}
                </p>
                <p className="text-xs text-muted-foreground">Tokens</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-purple-600">
                  {domain.tokenizedAt ? '✓' : '✗'}
                </p>
                <p className="text-xs text-muted-foreground">Tokenized</p>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              className="w-full group-hover:bg-primary/90 transition-colors"
              onClick={() => handleViewDetails(domain)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}