# DomaDAO Smart Contracts

## Overview

DomaDAO enables fractional ownership of premium domains through collective investment pools. Contributors pool USDC to purchase domains, which are then fractionalized into ERC-20 shares.

## Core Contracts

### PoolFactory
- **Address**: `0x5a12D663CF1e3d7b728468aBe09b3d956a524fb4`
- **Purpose**: Factory contract for creating and managing FractionPool instances
- **Network**: Doma Testnet

### FractionPool
- **Purpose**: Main pool contract handling contributions, voting, and domain fractionalization
- **Features**: USDC contributions, weighted voting, pro-rata share distribution

### RevenueDistributor
- **Address**: `0x372bD93F70Dfd866e17A17AbA51e47eebEb4859E`
- **Purpose**: Distributes revenue to fractional share token holders
- **Features**: Snapshot-based distributions, batch claiming

### BuyoutHandler
- **Address**: `0x1BE5d82136624202212A706561f2f63D875AfA3C`
- **Purpose**: Manages buyout offers for fractionalized domains
- **Features**: Democratic voting, escrow handling

## Mock Contracts (Testing)

### MockUSDC
- **Address**: `0xdfF6Bf7FBCbbA7142e0B091a14404080DcA852BB`
- **Purpose**: Mock USDC token for testing (6 decimals)

### MockDomainNFT
- **Address**: `0x2D40FE0Ea341d42158a1827c5398f28B783bE803`
- **Purpose**: Mock domain NFT for testing pool creation
