"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Globe, Clock, Loader2, AlertCircle, Calendar, Shield, Activity, TrendingUp, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDomainDetails, useDomainActivities, useDomainOffers, useDomainListings } from "@/hooks/use-api"
import type { DomainToken } from "@/lib/api-types"

export default function DomainDetailPage() {
  const params = useParams()
  const router = useRouter()
  const domainName = params.name as string

  // Fetch domain details
  const { data: domainResponse, loading: domainLoading, error: domainError } = useDomainDetails(domainName)
  const { data: activitiesResponse, loading: activitiesLoading } = useDomainActivities(domainName)
  const { data: offersResponse, loading: offersLoading } = useDomainOffers(domainName)
  const { data: listingsResponse, loading: listingsLoading } = useDomainListings(domainName)

  const domain = domainResponse
  const activities = activitiesResponse?.data || []
  const offers = offersResponse?.data || []
  const listings = listingsResponse?.data || []

  // Calculate pricing information for investment decision
  const getBestPrice = () => {
    if (listings.length > 0) {
      const lowestListing = listings.reduce((min: any, listing: any) => {
        const minPrice = parseFloat(min.price) / Math.pow(10, min.currency.decimals)
        const listingPrice = parseFloat(listing.price) / Math.pow(10, listing.currency.decimals)
        return listingPrice < minPrice ? listing : min
      }) as any
      return {
        type: 'listing',
        price: parseFloat(lowestListing.price) / Math.pow(10, lowestListing.currency.decimals),
        currency: lowestListing.currency.symbol,
        label: 'Buy Now Price',
        color: 'green'
      }
    } else if (offers.length > 0) {
      const highestOffer = offers.reduce((max: any, offer: any) => {
        const maxPrice = parseFloat(max.price) / Math.pow(10, max.currency.decimals)
        const offerPrice = parseFloat(offer.price) / Math.pow(10, offer.currency.decimals)
        return offerPrice > maxPrice ? offer : max
      }) as any
      return {
        type: 'offer',
        price: parseFloat(highestOffer.price) / Math.pow(10, highestOffer.currency.decimals),
        currency: highestOffer.currency.symbol,
        label: 'Best Offer',
        color: 'blue'
      }
    }
    return null
  }

  const priceInfo = getBestPrice()

  if (domainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">Loading domain details...</p>
        </div>
      </div>
    )
  }

  if (domainError || !domain) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle>Domain Not Found</CardTitle>
                <CardDescription>{domainError || "Could not load domain details"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getExpiryStatus = () => {
    const now = new Date()
    const expiry = new Date(domain.expiresAt)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return { text: "Expired", color: "text-red-600 bg-red-50 border-red-200" }
    if (daysUntilExpiry < 30) return { text: `${daysUntilExpiry} days left`, color: "text-red-600 bg-red-50 border-red-200" }
    if (daysUntilExpiry < 90) return { text: `${daysUntilExpiry} days left`, color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
    return { text: `${daysUntilExpiry} days left`, color: "text-green-600 bg-green-50 border-green-200" }
  }

  const expiryStatus = getExpiryStatus()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Domain Header Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <Globe className="h-8 w-8 text-purple-600" />
                  <div>
                    <h1 className="text-4xl font-bold">
                      {domain.name}
                      <span className="text-muted-foreground">{domain.tld}</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registered with {domain.registrar}
                    </p>
                  </div>
                </div>

                {/* Investment Price Info - Critical for Pool Creation */}
                {priceInfo && (
                  <div className={`bg-gradient-to-r ${
                    priceInfo.color === 'green' 
                      ? 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' 
                      : 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800'
                  } rounded-lg p-4 border-2`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {priceInfo.label} • Target for Investment Pool
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={`text-3xl font-bold ${
                            priceInfo.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {priceInfo.price.toFixed(2)}
                          </span>
                          <span className="text-xl font-semibold text-muted-foreground">
                            {priceInfo.currency}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {priceInfo.type === 'listing' 
                            ? '✅ Available for immediate purchase'
                            : '💡 Highest active offer - negotiate or outbid'}
                        </p>
                      </div>
                      <Badge 
                        variant={priceInfo.type === 'listing' ? 'default' : 'secondary'} 
                        className="text-sm px-3 py-1"
                      >
                        {priceInfo.type === 'listing' ? '🛒 Listed' : '💰 Offer'}
                      </Badge>
                    </div>
                  </div>
                )}

                {!priceInfo && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      No active listings or offers - Contact owner for pricing
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{domain.tld}</Badge>
                  {domain.tokenizedAt && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      ✓ Tokenized
                    </Badge>
                  )}
                  <Badge variant="outline" className={expiryStatus.color}>
                    <Clock className="h-3 w-3 mr-1" />
                    {expiryStatus.text}
                  </Badge>
                </div>
              </div>

              <Button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                <Shield className="h-4 w-4 mr-2" />
                Create Investment Pool
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Owner */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Owner
                </p>
                <p className="font-mono text-sm">
                  {domain.owner.slice(0, 6)}...{domain.owner.slice(-4)}
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Explorer
                </Button>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Expiry Date
                </p>
                <p className="font-semibold">
                  {new Date(domain.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Tokenized Date */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Tokenized
                </p>
                <p className="font-semibold">
                  {domain.tokenizedAt 
                    ? new Date(domain.tokenizedAt).toLocaleDateString()
                    : "Not tokenized"
                  }
                </p>
              </div>

              {/* Chains */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Networks
                </p>
                <div className="flex flex-wrap gap-2">
                  {domain.tokens.map((token: DomainToken) => (
                    <Badge key={`${token.chainId}-${token.contractAddress}`} variant="outline">
                      {getChainIcon(token.chainName)} {token.chainName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens ({domain.tokens.length})</TabsTrigger>
            <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Domain Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Domain Information</CardTitle>
                  <CardDescription>Key details about this domain</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Full Domain</span>
                      <span className="font-medium">{domain.name}{domain.tld}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">TLD</span>
                      <span className="font-medium">{domain.tld}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Registrar</span>
                      <span className="font-medium">{domain.registrar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={domain.tokenizedAt ? "default" : "secondary"}>
                        {domain.tokenizedAt ? "Tokenized" : "Not Tokenized"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Investment Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Investment Analysis
                  </CardTitle>
                  <CardDescription>Pool creation considerations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {priceInfo && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Target Raise</span>
                          <Badge className="text-sm">
                            {priceInfo.price.toFixed(2)} {priceInfo.currency}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Investors should pool this amount to purchase the domain
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tokenization Status</span>
                      <Badge variant={domain.tokenizedAt ? "default" : "secondary"}>
                        {domain.tokenizedAt ? "✓ Ready" : "Requires Tokenization"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Multi-chain Support</span>
                      <Badge variant="outline">
                        {domain.tokens.length} {domain.tokens.length === 1 ? "Network" : "Networks"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expiry Status</span>
                      <Badge className={expiryStatus.color}>
                        {expiryStatus.text}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Activity</span>
                      <Badge variant="outline">
                        {listings.length} Listings, {offers.length} Offers
                      </Badge>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                    <Shield className="h-4 w-4 mr-2" />
                    Create Investment Pool
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Token Instances</CardTitle>
                <CardDescription>
                  This domain is tokenized across {domain.tokens.length} network(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {domain.tokens.map((token: DomainToken) => (
                    <Card key={`${token.chainId}-${token.contractAddress}`} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getChainIcon(token.chainName)}</span>
                              <div>
                                <p className="font-semibold">{token.chainName}</p>
                                <p className="text-xs text-muted-foreground">Chain ID: {token.chainId}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Contract</span>
                                <span className="font-mono text-xs">
                                  {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Token ID</span>
                                <span className="font-mono text-xs">{token.tokenId}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Standard</span>
                                <Badge variant="outline">{token.tokenStandard}</Badge>
                              </div>
                            </div>
                          </div>

                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Listings</CardTitle>
                <CardDescription>
                  Current marketplace listings for this domain
                </CardDescription>
              </CardHeader>
              <CardContent>
                {listingsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="text-sm text-muted-foreground mt-2">Loading listings...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mt-2">No active listings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {listings.map((listing: any) => (
                      <Card key={listing.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-green-600">
                                  {(parseFloat(listing.price) / Math.pow(10, listing.currency.decimals)).toFixed(2)}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                  {listing.currency.symbol}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Listed by {listing.sellerAddress?.slice(0, 6)}...{listing.sellerAddress?.slice(-4)}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Listing
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Domain Offers</CardTitle>
                <CardDescription>
                  Historical offers and bids for this domain
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offersLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="text-sm text-muted-foreground mt-2">Loading offers...</p>
                  </div>
                ) : offers.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mt-2">No offers found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer: any) => (
                      <Card key={offer.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-blue-600">
                                  {(parseFloat(offer.price) / Math.pow(10, offer.currency.decimals)).toFixed(2)}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground">
                                  {offer.currency.symbol}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>By {offer.offererAddress?.slice(0, 6)}...{offer.offererAddress?.slice(-4)}</span>
                                <span>Expires {new Date(offer.expiresAt).toLocaleDateString()}</span>
                                <Badge variant={offer.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                  {offer.status}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Offer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Domain Activity</CardTitle>
                <CardDescription>Recent events and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="text-sm text-muted-foreground mt-2">Loading activities...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mt-2">No activities found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                          <Activity className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.eventType}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          {activity.transactionHash && (
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Transaction
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
