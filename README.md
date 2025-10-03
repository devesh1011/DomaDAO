# 🏛️ DomaDAO - Fractional Domain Investment Pools

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)](https://soliditylang.org/)
[![Doma Protocol](https://img.shields.io/badge/Doma-Protocol-blueviolet)](https://doma.xyz)

> **Democratizing premium domain investing through collective ownership and governance**

DomaDAO enables communities to pool capital, vote democratically, and own fractional shares of premium domains through ERC-20 tokens - bringing the $2.7B domain market to retail investors.

---

## 🎯 **The Problem**

- **Premium domains cost $50K-$1M+** → 99% of investors priced out
- **368M domains registered globally** → Ownership highly concentrated
- **Web3 domains underutilized** → Prohibitive costs limit adoption
- **No collective investment platforms** → Retail excluded from premium opportunities

## 💡 **The Solution**

DomaDAO creates **investment pools** where:

1. 🏦 **Pool Capital** - Multiple contributors invest $100+ each
2. 🗳️ **Democratic Voting** - Community votes on domain purchases (contribution-weighted)
3. 🪙 **Fractionalization** - Domains split into tradable ERC-20 tokens via Doma Protocol
4. 💰 **Revenue Sharing** - Automated distribution to token holders
5. 🔄 **Buyout System** - Democratic process for domain resale

---

## 🚀 **Key Features**

### **For Investors**

- ✅ **Low Entry Barrier** - Invest $100 instead of $100,000
- ✅ **Instant Liquidity** - Trade fractional shares anytime
- ✅ **Revenue Participation** - Proportional earnings from domains
- ✅ **Democratic Governance** - Vote on purchases and strategy

### **For Domain Owners**

- ✅ **Exit Liquidity** - Fractionalize and sell domain ownership
- ✅ **Community Growth** - Engage token holder community
- ✅ **Price Discovery** - Market-driven domain valuation
- ✅ **Retained Ownership** - Keep majority shares if desired

### **Technical Highlights**

- ✅ **Doma Protocol Integration** - Orderbook, Fractionalization, NFTs
- ✅ **Production-Ready Contracts** - 95%+ test coverage
- ✅ **Gas Optimized** - ReentrancyGuard, efficient storage patterns
- ✅ **Cross-Chain Ready** - Bridge tokens to Base, Solana, etc.

---

## 📁 **Project Structure**

```
doma-hack/
├── contracts-workspace/     # Smart Contracts (Solidity)
│   ├── contracts/
│   │   ├── PoolFactory.sol           # Pool creation & management
│   │   ├── FractionPool.sol          # Core pool logic
│   │   ├── BuyoutHandler.sol         # Buyout voting & execution
│   │   ├── RevenueDistributor.sol    # Revenue distribution
│   │   └── mocks/                    # Mock contracts for testing
│   ├── test/                         # Comprehensive test suite
│   ├── scripts/                      # Deployment scripts
│   └── hardhat.config.js
│
├── frontend/                # Next.js Frontend (React 19 + TypeScript)
│   ├── src/
│   │   ├── app/                      # Next.js pages (App Router)
│   │   ├── components/               # React components
│   │   ├── contexts/                 # State management
│   │   ├── hooks/                    # Custom hooks
│   │   ├── lib/                      # Utilities & integrations
│   │   └── contracts/                # Contract ABIs & addresses
│   └── public/                       # Static assets
│
├── backend/                 # Node.js Backend (Optional - Event Indexing)
│   ├── src/
│   │   ├── api/                      # REST API endpoints
│   │   ├── services/                 # Business logic
│   │   ├── db/                       # Database layer
│   │   └── cache/                    # Redis caching
│   └── docker-compose.yml            # Local development
│
├── DEMO_GUIDE.md            # Hackathon demo script
├── PRE_DEMO_CHECKLIST.md    # Demo preparation checklist
└── README.md                # This file
```

---

## 🛠️ **Tech Stack**

### **Smart Contracts**

- **Solidity 0.8.20** - Secure smart contract development
- **Hardhat** - Development environment & testing framework
- **OpenZeppelin** - Battle-tested contract libraries
- **Ethers.js v6** - Blockchain interactions

### **Frontend**

- **Next.js 15.5** - React framework with Turbopack
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **wagmi/viem** - Wallet connection & blockchain interactions

### **Backend** (Optional - for event indexing)

- **Node.js + Express** - REST API server
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Docker** - Containerized deployment

### **Blockchain**

- **Doma Testnet** - Chain ID: 97476
- **Doma Protocol** - Domain NFTs, Orderbook, Fractionalization
- **MetaMask** - Wallet connection

---

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js >= 18.0.0
- npm or yarn
- MetaMask wallet
- Git

### **1. Clone Repository**

```bash
git clone https://github.com/devesh1011/DomaDAO.git
cd doma-hack
```

### **2. Install Dependencies**

#### **Smart Contracts:**

```bash
cd contracts-workspace
npm install
```

#### **Frontend:**

```bash
cd ../frontend
npm install
```

#### **Backend (Optional):**

```bash
cd ../backend
npm install
```

### **3. Configure Environment**

#### **Frontend Environment:**

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Doma Testnet Configuration
NEXT_PUBLIC_CHAIN_ID=97476
NEXT_PUBLIC_RPC_URL=https://rpc-testnet.doma.xyz
NEXT_PUBLIC_EXPLORER_URL=https://explorer-testnet.doma.xyz

# Contract Addresses (deployed on Doma Testnet)
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0xEa814c2f9a320C304Fa3fdaE49F20f8bCc14cec4
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x66A61685ec15AbBDfd7E6A11F0db214426b3dC5B
NEXT_PUBLIC_FRACTIONALIZATION_CONTRACT_ADDRESS=0x519B8eE707DDE4355164C7AA4B82fD0642574795

# API Configuration (optional)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

#### **Smart Contracts Environment:**

```bash
cd ../contracts-workspace
cp .env.example .env
```

Edit `.env`:

```env
# Doma Testnet
DOMA_TESTNET_RPC_URL=https://rpc-testnet.doma.xyz
PRIVATE_KEY=your_private_key_here

# Etherscan (if applicable)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### **4. Run the Project**

#### **Option A: Frontend Only (Recommended for Demo)**

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### **Option B: Full Stack (Frontend + Backend)**

**Terminal 1 - Frontend:**

```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**

```bash
cd backend
docker-compose up -d  # Start PostgreSQL & Redis
npm run dev
```

#### **Option C: Smart Contract Development**

```bash
cd contracts-workspace

# Run tests
npm test

# Run specific test suite
npm run test:unit

# Deploy to Doma Testnet
npx hardhat run scripts/deploy.js --network domaTestnet
```

---

## 📖 **Usage Guide**

### **For Investors:**

1. **Connect Wallet**

   - Click "Connect Wallet" on homepage
   - Select MetaMask
   - Switch to Doma Testnet (prompted automatically)

2. **Explore Pools**

   - Browse active investment pools on Dashboard
   - View pool details: target amount, contributors, domain candidates

3. **Contribute to Pool**

   - Click on a pool → "Contribute"
   - Approve USDC spending (one-time)
   - Enter contribution amount (minimum $10)
   - Confirm transaction

4. **Vote on Domains**

   - Once contributed, you can vote on domain candidates
   - Voting power proportional to contribution
   - Multiple proposals can be added by pool creator

5. **Receive Fractional Tokens**
   - After domain purchase & fractionalization
   - Tokens distributed automatically
   - View in "My Portfolio" section

### **For Pool Creators:**

1. **Create Pool**

   - Click "Create Pool" on Dashboard
   - Set parameters:
     - Pool name & description
     - Target raise amount
     - Contribution window (e.g., 7 days)
     - Voting period (e.g., 3 days)
     - Fractional token details

2. **Add Domain Candidates**

   - Propose domain names for purchase
   - Provide estimated prices
   - Add descriptions/justifications

3. **Manage Pool Lifecycle**
   - Monitor contributions
   - Track voting progress
   - Execute purchase when voting completes
   - Fractionalize domain via Doma Protocol

---

## 🧪 **Testing**

### **Smart Contracts**

```bash
cd contracts-workspace

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with gas reporting
npm run test:gas

# Run specific test file
npx hardhat test test/FractionPool.test.ts
```

**Test Coverage:**

- ✅ Unit tests for all contracts (95%+ coverage)
- ✅ Integration tests for full workflows
- ✅ Gas optimization tests
- ✅ Edge case & attack vector testing

### **Frontend**

```bash
cd frontend

# Run unit tests (if configured)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🌐 **Deployed Contracts (Doma Testnet)**

| Contract               | Address                                      |
| ---------------------- | -------------------------------------------- |
| **PoolFactory**        | `0xEa814c2f9a320C304Fa3fdaE49F20f8bCc14cec4` |
| **MockUSDC**           | `0x66A61685ec15AbBDfd7E6A11F0db214426b3dC5B` |
| **MockDomainNFT**      | `0x387196B48B566e84772f34382D4f10B0460867B5` |
| **BuyoutHandler**      | `0x[deployed_address]`                       |
| **RevenueDistributor** | `0x[deployed_address]`                       |
| **Example Pool**       | `0x177fBb7A2699b2Fd910E12214909af5F24c9A380` |

**Doma Protocol Contracts:**

- **Fractionalization**: `0x519B8eE707DDE4355164C7AA4B82fD0642574795`
- **Domain Registry**: `0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f`

**Quick Demo Flow:**

1. Show homepage → Explain problem/solution (1 min)
2. Navigate to pool → Show pooled investments (1 min)
3. Contribute & vote → Democratic governance (1 min)
4. Record purchase → Simulate domain acquisition (30s)
5. Fractionalize → Show ERC-20 tokenization (1 min)
6. Closing → Impact & roadmap (30s)

<div align="center">

**Made with ❤️ for the Doma Protocol Hackathon**

⭐ **Star us on GitHub** | 🐛 **Report Issues** | 💬 **Join Discussion**

</div>
