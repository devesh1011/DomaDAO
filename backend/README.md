# DomaDAO Backend

Backend services for DomaDAO that integrate with Doma Protocol APIs to provide event streaming, data indexing, and REST API for the frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────┐
│                     REST API (Express)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pool Management | Contributions | Voting | Revenue   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼─────────┐  ┌────▼────────┐  ┌──────▼──────────┐
│  Event Indexer   │  │ Poll Consumer│  │ Orderbook Client│
│  (PostgreSQL)    │  │  (Doma Poll) │  │  (Marketplace)  │
└────────┬─────────┘  └────┬────────┘  └──────┬──────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Doma Protocol                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Poll API | Subgraph | Orderbook | Smart Contracts   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Services Overview

### 1. Poll API Consumer

Continuously polls the Doma Poll API for new protocol events including domain NFT mints, transfers, renewals, burns, ownership claims, and metadata updates. Handles event acknowledgment, filtering, and automatic retry on failures.

### 2. Event Indexer

Processes and stores blockchain events in PostgreSQL with batch processing, idempotent handling, and event-specific processors. Maintains data integrity through database transactions and handles cache invalidation.

### 3. Orderbook API Client

Interacts with Doma Orderbook for domain marketplace operations including creating listings, managing offers, getting fulfillment data, canceling orders, and querying marketplace fees.

### 4. Subgraph Client

Queries Doma Protocol data via GraphQL for domain lookups, token queries, activity history, marketplace data, and owner portfolios.

### 5. REST API

Provides HTTP endpoints for frontend integration with comprehensive pool management, contribution tracking, voting systems, and revenue distribution functionality.

## Project Structure

```
backend/
├── src/
│   ├── api/                      # REST API endpoints
│   │   ├── routes/               # API route handlers
│   │   └── middleware/           # Authentication, validation, error handling
│   ├── services/                 # Core business logic services
│   │   ├── poll-consumer/        # Doma Poll API integration
│   │   ├── event-indexer/        # Event processing and storage
│   │   ├── orderbook/            # Marketplace API client
│   │   └── subgraph/             # GraphQL data queries
│   ├── db/                       # Database layer
│   │   ├── migrations/           # Schema migrations
│   │   └── models/               # Data models
│   ├── cache/                    # Redis caching layer
│   ├── utils/                    # Shared utilities
│   ├── types/                    # TypeScript type definitions
│   └── config/                   # Configuration management
├── tests/                        # Test suites
├── scripts/                      # Utility scripts
└── docker/                       # Container configurations
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- Doma API Key

### Installation

1. Install dependencies: `npm install`
2. Copy environment file: `cp .env.example .env`
3. Configure environment variables in `.env`
4. Setup database: `npm run db:migrate`
5. Start services: `npm run dev`

### Development Commands

- `npm run dev` - Start all services in development mode
- `npm run poll:start` - Start poll API consumer only
- `npm run indexer:start` - Start event indexer only
- `npm run api:start` - Start REST API server only
- `npm run build` - Build for production
- `npm start` - Start production server

## Configuration

### Required Environment Variables

- `DOMA_API_KEY` - API key with EVENTS and ORDERBOOK permissions
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis server hostname

### Optional Configuration

- `POLL_INTERVAL_MS` - Poll API check interval (default: 5000ms)
- `POLL_BATCH_SIZE` - Events to process per batch (default: 100)
- `API_PORT` - REST API server port (default: 3001)
- `LOG_LEVEL` - Logging verbosity level

## REST API Endpoints

Base URL: `http://localhost:3001/api/v1`

### Health & Status

- `GET /health` - Service health check

### Pool Management

- `GET /pools` - List all active pools
- `GET /pools/:address` - Get specific pool details
- `GET /pools/:address/metadata` - Get pool metadata and status

### Contributions

- `GET /pools/:address/contributions` - List pool contributions
- `GET /contributors/:address/contributions` - Get user contributions across all pools

### Voting

- `GET /pools/:address/votes` - List voting results
- `GET /pools/:address/voting-results` - Get voting summary and winner

### Domains

- `GET /domains/:name` - Get domain information
- `GET /domains/:name/activities` - Domain activity history
- `GET /domains/:name/listings` - Active marketplace listings
- `GET /domains/:name/offers` - Active marketplace offers

### Revenue Distribution

- `GET /distributions/:poolAddress` - Get revenue distributions
- `GET /distributions/:poolAddress/:contributor` - Get contributor revenue claims

## Database Schema

### Core Tables

**pools**

- Pool contract addresses, ownership, target amounts
- Contribution and voting window timestamps
- Current status and metadata

**contributions**

- Contribution records linked to pools
- Contributor addresses and amounts
- Transaction hashes and timestamps

**events**

- Blockchain event storage with unique IDs
- Event types, block numbers, transaction data
- Processing status and finalization state

**votes**

- Voting records for each pool
- Voter addresses, chosen domains, vote weights
- Voting period and timestamps

**domains**

- Domain information from Doma Protocol
- Ownership, expiration, metadata
- Marketplace activity tracking

## Event Processing

### Supported Event Types

- `NAME_TOKEN_MINTED` - New domain NFT creation
- `NAME_TOKEN_TRANSFERRED` - Domain ownership transfers
- `NAME_TOKEN_RENEWED` - Domain renewal events
- `NAME_TOKEN_BURNED` - Domain NFT destruction
- `OWNERSHIP_CLAIMED` - Domain ownership claims
- `METADATA_UPDATED` - Domain metadata changes

### Processing Flow

1. Poll API consumer fetches new events
2. Events filtered by type and relevance
3. Event indexer processes in batches
4. Database transactions ensure data consistency
5. Cache invalidation triggers data refresh
6. REST API serves updated information

## Data Flow

### Pool Creation Flow

1. Frontend creates pool via PoolFactory contract
2. Event indexer captures `PoolCreated` event
3. Pool data stored in database
4. REST API serves pool information

### Contribution Flow

1. User contributes USDC to pool contract
2. Event indexer captures `ContributionMade` event
3. Contribution recorded in database
4. Pool totals updated in real-time

### Voting Flow

1. User votes on domain candidate
2. Event indexer captures `VoteCast` event
3. Vote recorded with weight calculation
4. Voting results updated continuously

## Caching Strategy

- Pool metadata cached for 5 minutes
- Contribution totals cached for 1 minute
- Voting results cached for 30 seconds
- Domain data cached for 10 minutes
- Redis handles cache invalidation on data updates

## Monitoring & Logging

- Structured logging with Pino
- Event processing metrics
- API response time tracking
- Database connection monitoring
- Cache hit rate analysis

## Deployment

### Docker Deployment

```bash
docker-compose up -d
docker-compose logs -f backend
```

### Environment Setup

- Database migrations run automatically
- Redis cache warms up on startup
- Poll consumer begins event processing
- Health checks verify service readiness

## Integration Points

### Smart Contract Events

- PoolFactory: Pool creation tracking
- FractionPool: Contributions, votes, purchases
- BuyoutHandler: Buyout proposals and voting
- RevenueDistributor: Revenue distribution events

### External APIs

- Doma Poll API: Real-time event streaming
- Doma Subgraph: Historical data queries
- Doma Orderbook: Marketplace operations

## Performance Considerations

- Batch processing for high-throughput event handling
- Database connection pooling for concurrent requests
- Redis caching for frequently accessed data
- Event filtering to reduce processing overhead
- Asynchronous processing for non-blocking operations
