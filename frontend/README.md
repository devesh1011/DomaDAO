# DomaDAO Frontend

Next.js frontend application for DomaDAO - a decentralized platform for collective domain ownership through fractionalized investment pools.

## Overview

DomaDAO enables users to collectively invest in valuable domain names through democratic pooled investment. Contributors vote on domain purchases, share ownership proportionally, and participate in governance decisions.

## Core Features

### Pool Management

- Create investment pools with custom parameters
- Set contribution windows, voting periods, and target amounts
- Manage pool lifecycle from fundraising to fractionalization

### Democratic Governance

- Contributor voting on domain selection
- Weighted voting based on contribution amounts
- Transparent voting results and timelines

### Domain Marketplace Integration

- Browse available domains through Doma Protocol
- Purchase domains via integrated orderbook
- Fractionalize domains into ERC20 tokens

### Portfolio Dashboard

- Track investment performance across pools
- Monitor revenue distributions
- View owned fraction tokens

### Buyout System

- Propose buyouts for fractionalized domains
- Community voting on buyout offers
- Automated execution of accepted offers

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DomaDAO Frontend                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ React 19 + Next.js 15 | TypeScript | Tailwind CSS    │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────┐
│                     Backend API                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pool Data | Contributions | Voting | Revenue         │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
┌────────▼─────────┐  ┌────▼────────┐  ┌──────▼──────────┐
│  Smart Contracts │  │Doma Protocol│  │  Wallet Connect │
│  (FractionPool)  │  │ (Domains)   │  │   (MetaMask)    │
└────────┬─────────┘  └────┬────────┘  └──────┬──────────┘
         │                  │                 │
         └──────────────────┼─────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      Doma Testnet                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PoolFactory | BuyoutHandler | RevenueDistributor     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js app router
│   │   ├── dashboard/            # Main dashboard pages
│   │   ├── pools/                # Pool management pages
│   │   ├── domains/              # Domain search pages
│   │   └── api/                  # API routes (if needed)
│   │
│   ├── components/               # React components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── pools/                # Pool-related components
│   │   ├── domains/              # Domain components
│   │   ├── wallet/               # Wallet connection
│   │   ├── governance/           # Governance components
│   │   └── ui/                   # Reusable UI components
│   │
│   ├── contexts/                 # React contexts
│   │   ├── wallet-context.tsx    # Wallet state management
│   │   └── theme-context.tsx     # Theme management
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-pools.ts          # Pool data hooks
│   │   ├── use-domains.ts        # Domain data hooks
│   │   └── use-api.ts            # API interaction hooks
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── contracts/            # Smart contract services
│   │   ├── api/                  # Backend API clients
│   │   ├── utils/                # Helper functions
│   │   └── validations/          # Form validations
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── pool.ts               # Pool-related types
│   │   ├── domain.ts             # Domain types
│   │   └── api.ts                # API response types
│   │
│   └── styles/                   # Global styles
│
├── public/                       # Static assets
├── tailwind.config.ts            # Tailwind configuration
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MetaMask or compatible Web3 wallet
- Doma Testnet access

### Installation

1. Install dependencies
2. Copy environment configuration
3. Configure wallet connection
4. Start development server

### Development

Start the development server with hot reload and Turbopack for faster builds.

### Environment Configuration

Configure the following environment variables:

- `NEXT_PUBLIC_BACKEND_URL` - Backend API endpoint
- `NEXT_PUBLIC_DOMA_RPC_URL` - Doma testnet RPC endpoint
- `NEXT_PUBLIC_CHAIN_ID` - Doma testnet chain ID

## Key Components

### Dashboard

Main application hub providing overview of:

- Active investment pools
- Portfolio performance
- Governance proposals
- Recent activity feed

### Pool Explorer

Browse and discover investment pools with filtering by:

- Pool status (Fundraising, Voting, Purchased, etc.)
- Target amounts and progress
- Creation dates
- Pool creators

### Pool Detail View

Comprehensive pool management interface featuring:

- Contribution tracking and progress bars
- Voting interface for domain selection
- Buyout proposal system
- Revenue distribution claims

### Domain Search

Integrated domain marketplace with:

- Real-time availability checking
- Price discovery through Doma Protocol
- Direct purchasing capabilities

### Governance System

Democratic decision-making tools including:

- Proposal creation and management
- Voting interfaces with real-time results
- Governance timeline tracking

## Smart Contract Integration

### PoolFactory Contract

- Pool creation and deployment
- Factory fee management
- Pool discovery and enumeration

### FractionPool Contract

- Contribution management with minimum amounts
- Democratic voting on domain purchases
- Proportional token distribution
- Revenue sharing mechanisms

### BuyoutHandler Contract

- Buyout proposal creation
- Community voting on offers
- Automated execution of accepted buyouts
- Refund mechanisms for failed offers

## State Management

### Wallet Context

Manages Web3 wallet connection state including:

- Account address and balance
- Network validation
- Transaction signing
- Connection status

### Pool Data Hooks

Custom hooks for pool data management:

- Real-time pool status updates
- Contribution tracking
- Voting result aggregation
- Performance metrics

## UI/UX Features

### Responsive Design

Mobile-first approach with responsive layouts for:

- Desktop dashboard views
- Tablet pool management
- Mobile wallet interactions

### Dark/Light Theme

System-aware theme switching with:

- Automatic OS preference detection
- Manual theme toggle
- Consistent theming across components

### Real-time Updates

Live data synchronization for:

- Pool contribution progress
- Voting result changes
- Transaction confirmations
- Price feed updates

## Security Features

### Wallet Security

- Secure wallet connection handling
- Transaction signing validation
- Network verification
- Address checksum validation

### Input Validation

- Form data sanitization
- Amount limit enforcement
- Address format validation
- Smart contract parameter validation

## Performance Optimization

### Code Splitting

- Route-based code splitting
- Component lazy loading
- Dynamic imports for heavy components

### Caching Strategy

- API response caching
- Contract data memoization
- Image optimization
- Bundle size optimization

### Build Optimization

- Turbopack for faster development builds
- Tree shaking for unused code elimination
- Image optimization and WebP support
- CSS optimization and purging

## Development Workflow

### Component Development

- Atomic design principles
- Reusable component library
- Consistent styling with Tailwind CSS
- TypeScript for type safety

### Testing Strategy

- Unit tests for utilities and hooks
- Integration tests for components
- E2E tests for critical user flows
- Contract interaction testing

### Deployment

- Vercel platform deployment
- Environment-specific configurations
- CDN optimization
- Performance monitoring

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires Web3 wallet extension for full functionality.

## Integration Points

### Backend API

- Pool data and metadata
- Contribution and voting records
- Domain information and pricing
- User portfolio data

### Doma Protocol

- Domain availability and pricing
- Orderbook integration
- Fractionalization services
- Token metadata

### Smart Contracts

- Pool lifecycle management
- Voting and governance
- Token distribution
- Revenue sharing
