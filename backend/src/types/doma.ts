/**
 * Doma Protocol API Types
 * Based on official API documentation
 */

// ============================================================================
// Poll API Types
// ============================================================================

export type EventType =
  | 'NAME_TOKEN_MINTED'
  | 'NAME_TOKEN_TRANSFERRED'
  | 'NAME_TOKEN_RENEWED'
  | 'NAME_TOKEN_BURNED'
  | 'LOCK_STATUS_CHANGED'
  | 'METADATA_UPDATED';

export interface DomaPollEvent {
  id: number;
  name: string;
  tokenId: string;
  type: EventType;
  uniqueId: string;
  relayId: string;
  eventData: EventData;
}

export interface EventData {
  networkId: string; // CAIP-2 format (e.g., "eip155:1")
  finalized: boolean;
  txHash: string;
  blockNumber: string;
  logIndex: number;
  tokenAddress: string;
  tokenId: string;
  type: EventType;
  owner?: string;
  name?: string;
  expiresAt?: string; // ISO 8601
  correlationId?: string;
  // Transfer specific
  from?: string;
  to?: string;
  // Lock specific
  isTransferLocked?: boolean;
}

export interface PollResponse {
  events: DomaPollEvent[];
  lastId: number;
  hasMoreEvents: boolean;
}

export interface PollParams {
  eventTypes?: EventType[];
  limit?: number;
  finalizedOnly?: boolean;
}

// ============================================================================
// Orderbook API Types
// ============================================================================

export type OrderbookType = 'DOMA' | 'OPENSEA';

export interface SeaportOrderParameters {
  offerer: string;
  zone: string;
  orderType: number;
  startTime: string;
  endTime: string;
  zoneHash: string;
  salt: string;
  offer: OfferItem[];
  consideration: ConsiderationItem[];
  totalOriginalConsiderationItems: number;
  conduitKey: string;
  counter: string;
}

export interface OfferItem {
  itemType: number;
  token: string;
  identifierOrCriteria: string;
  startAmount: string;
  endAmount: string;
}

export interface ConsiderationItem extends OfferItem {
  recipient: string;
}

export interface CreateListingRequest {
  orderbook: OrderbookType;
  chainId: string; // CAIP-2 format
  parameters: SeaportOrderParameters;
  signature: string;
}

export interface CreateOfferRequest {
  orderbook: OrderbookType;
  chainId: string;
  parameters: SeaportOrderParameters;
  signature: string;
}

export interface OrderResponse {
  orderId: string;
}

export interface FulfillmentData {
  parameters: SeaportOrderParameters;
  signature: string;
}

export interface CancelOrderRequest {
  orderId: string;
  signature: string;
}

export interface MarketplaceFee {
  recipient: string;
  basisPoints: number;
}

export interface MarketplaceFeesResponse {
  marketplaceFees: MarketplaceFee[];
}

export interface Currency {
  address: string;
  symbol: string;
  decimals: number;
}

export interface CurrenciesResponse {
  currencies: Currency[];
}

// ============================================================================
// Subgraph Types
// ============================================================================

export interface NameModel {
  name: string;
  expiresAt: string; // ISO 8601
  tokenizedAt: string;
  eoi: boolean;
  registrar: RegistrarModel;
  nameservers: NameServerModel[];
  dsKeys?: DSKeyModel[];
  transferLock?: boolean;
  claimedBy?: string; // CAIP-10 format
  tokens?: TokenModel[];
  activities?: NameActivity[];
}

export interface TokenModel {
  tokenId: string;
  networkId: string;
  ownerAddress: string; // CAIP-10 format
  type: 'OWNERSHIP' | 'SYNTHETIC';
  startsAt?: string;
  expiresAt: string;
  activities?: TokenActivity[];
  explorerUrl: string;
  tokenAddress: string;
  createdAt: string;
  chain: ChainModel;
  listings?: ListingModel[];
  openseaCollectionSlug?: string;
}

export interface ChainModel {
  name: string;
  networkId: string; // CAIP-2 format
}

export interface RegistrarModel {
  name: string;
  ianaId: string;
  publicKeys: string[];
  websiteUrl?: string;
  supportEmail?: string;
}

export interface NameServerModel {
  ldhName: string;
}

export interface DSKeyModel {
  keyTag: number;
  algorithm: number;
  digest: string;
  digestType: number;
}

export interface ListingModel {
  id: string;
  externalId: string;
  price: string; // BigInt as string
  offererAddress: string; // CAIP-10
  orderbook: OrderbookType;
  currency: CurrencyModel;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferModel {
  id: string;
  externalId: string;
  price: string;
  offererAddress: string;
  orderbook: OrderbookType;
  currency: CurrencyModel;
  expiresAt: string;
  createdAt: string;
}

export interface CurrencyModel {
  name: string;
  symbol: string;
  decimals: number;
}

export type TokenActivity =
  | TokenMintedActivity
  | TokenTransferredActivity
  | TokenListedActivity
  | TokenOfferReceivedActivity
  | TokenListingCancelledActivity
  | TokenOfferCancelledActivity
  | TokenPurchasedActivity;

export interface BaseTokenActivity {
  type: string;
  networkId: string;
  txHash?: string;
  finalized: boolean;
  tokenId: string;
  createdAt: string;
}

export interface TokenMintedActivity extends BaseTokenActivity {
  type: 'MINTED';
}

export interface TokenTransferredActivity extends BaseTokenActivity {
  type: 'TRANSFERRED';
  transferredTo: string;
  transferredFrom: string;
}

export interface TokenListedActivity extends BaseTokenActivity {
  type: 'LISTED';
  orderId: string;
  startsAt?: string;
  expiresAt: string;
  seller: string;
  buyer?: string;
  payment: PaymentInfoModel;
  orderbook: OrderbookType;
}

export interface TokenOfferReceivedActivity extends BaseTokenActivity {
  type: 'OFFER_RECEIVED';
  orderId: string;
  expiresAt: string;
  buyer: string;
  seller: string;
  payment: PaymentInfoModel;
  orderbook: OrderbookType;
}

export interface TokenListingCancelledActivity extends BaseTokenActivity {
  type: 'LISTING_CANCELLED';
  orderId: string;
  reason?: string;
  orderbook: OrderbookType;
}

export interface TokenOfferCancelledActivity extends BaseTokenActivity {
  type: 'OFFER_CANCELLED';
  orderId: string;
  reason?: string;
  orderbook: OrderbookType;
}

export interface TokenPurchasedActivity extends BaseTokenActivity {
  type: 'PURCHASED';
  orderId: string;
  purchasedAt: string;
  seller: string;
  buyer: string;
  payment: PaymentInfoModel;
  orderbook: OrderbookType;
}

export interface PaymentInfoModel {
  price: string; // BigInt as string
  tokenAddress: string;
  currencySymbol: string;
}

export type NameActivity =
  | NameClaimedActivity
  | NameRenewedActivity
  | NameDetokenizedActivity
  | NameTokenizedActivity;

export interface BaseNameActivity {
  type: string;
  txHash?: string;
  sld: string;
  tld: string;
  createdAt: string;
}

export interface NameClaimedActivity extends BaseNameActivity {
  type: 'CLAIMED';
  claimedBy: string;
}

export interface NameRenewedActivity extends BaseNameActivity {
  type: 'RENEWED';
  expiresAt: string;
}

export interface NameDetokenizedActivity extends BaseNameActivity {
  type: 'DETOKENIZED';
  networkId: string;
}

export interface NameTokenizedActivity extends BaseNameActivity {
  type: 'TOKENIZED';
  networkId: string;
}

// ============================================================================
// Fractionalization Types
// ============================================================================

export interface FractionalizeRequest {
  tokenId: string;
  fractionalTokenInfo: {
    name: string;
    symbol: string;
  };
  minimumBuyoutPrice: string; // in USDC wei
}

export interface BuyoutRequest {
  tokenId: string;
}

export interface ExchangeFractionalTokenRequest {
  fractionalToken: string;
  amount: string;
}

export interface BuyoutPriceResponse {
  buyoutPrice: string; // in USDC wei
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationParams {
  skip?: number;
  take?: number;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface NamesQueryParams extends PaginationParams {
  ownedBy?: string[]; // CAIP-10 addresses
  claimStatus?: 'CLAIMED' | 'UNCLAIMED' | 'ALL';
  name?: string;
  networkIds?: string[]; // CAIP-2 format
  registrarIanaIds?: number[];
  tlds?: string[];
  sortOrder?: 'DESC' | 'ASC';
}

export interface TokensQueryParams extends PaginationParams {
  name: string;
}

export interface ActivitiesQueryParams extends PaginationParams {
  type?: string;
  sortOrder?: 'DESC' | 'ASC';
}

export interface OffersQueryParams extends PaginationParams {
  tokenId?: string;
  offeredBy?: string[]; // CAIP-10
  status?: 'ACTIVE' | 'EXPIRED' | 'All';
  sortOrder?: 'DESC' | 'ASC';
}

export interface ListingsQueryParams extends PaginationParams {
  tlds?: string[];
  createdSince?: string; // ISO 8601
  sld?: string;
  networkIds?: string[];
  registrarIanaIds?: number[];
}
