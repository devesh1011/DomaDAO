"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Domain {
  name: string
  tld: string
  expiryDate: string
  owner: string
  chains: string[]
  listings: number
  offers: number
}

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

const getChainIcon = (chain: string) => {
  const icons: Record<string, string> = {
    ethereum: "⟠",
    polygon: "⬡",
    bsc: "●",
    arbitrum: "⟐",
    optimism: "⚡",
    base: "⊙"
  }
  return icons[chain.toLowerCase()] || "●"
}

export function DomainGrid({ domains }: DomainGridProps) {
  if (domains.length === 0) return null

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
                    {domain.chains.slice(0, 3).map((chain) => (
                      <span
                        key={chain}
                        className="text-xs"
                        title={chain}
                      >
                        {getChainIcon(chain)}
                      </span>
                    ))}
                    {domain.chains.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{domain.chains.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Expiry Date */}
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <Badge
                variant="outline"
                className={`text-xs ${getExpiryColor(domain.expiryDate)}`}
              >
                {new Date(domain.expiryDate).toLocaleDateString()}
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
                  {domain.listings}
                </p>
                <p className="text-xs text-muted-foreground">Listings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-purple-600">
                  {domain.offers}
                </p>
                <p className="text-xs text-muted-foreground">Offers</p>
              </div>
            </div>

            {/* Action Button */}
            <Button className="w-full group-hover:bg-primary/90 transition-colors">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}