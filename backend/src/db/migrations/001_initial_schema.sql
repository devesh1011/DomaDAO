-- Migration: Initial schema for DomaDAO backend
-- Created: 2025-10-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table (stores all blockchain events from Poll API)
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    unique_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    token_id VARCHAR(255),
    network_id VARCHAR(50),
    tx_hash VARCHAR(255),
    block_number BIGINT,
    log_index INTEGER,
    finalized BOOLEAN DEFAULT false,
    event_data JSONB NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
CREATE INDEX IF NOT EXISTS idx_events_token_id ON events(token_id);
CREATE INDEX IF NOT EXISTS idx_events_tx_hash ON events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_unique_id ON events(unique_id);

-- Pools table
CREATE TABLE IF NOT EXISTS pools (
    id SERIAL PRIMARY KEY,
    pool_address VARCHAR(42) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    target_amount NUMERIC(78, 0) NOT NULL,
    current_amount NUMERIC(78, 0) DEFAULT 0,
    contribution_window_end BIGINT NOT NULL,
    voting_window_start BIGINT NOT NULL,
    voting_window_end BIGINT NOT NULL,
    purchase_window_start BIGINT NOT NULL,
    usdc_address VARCHAR(42) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    domain_name VARCHAR(255),
    domain_purchased BOOLEAN DEFAULT false,
    fraction_token_address VARCHAR(42),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for pools
CREATE INDEX IF NOT EXISTS idx_pools_owner ON pools(owner_address);
CREATE INDEX IF NOT EXISTS idx_pools_status ON pools(status);
CREATE INDEX IF NOT EXISTS idx_pools_created_at ON pools(created_at DESC);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id SERIAL PRIMARY KEY,
    pool_address VARCHAR(42) NOT NULL,
    contributor VARCHAR(42) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    tx_hash VARCHAR(255),
    block_number BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (pool_address) REFERENCES pools(pool_address) ON DELETE CASCADE
);

-- Indexes for contributions
CREATE INDEX IF NOT EXISTS idx_contributions_pool ON contributions(pool_address);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON contributions(contributor);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contributions_tx ON contributions(tx_hash);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    pool_address VARCHAR(42) NOT NULL,
    voter VARCHAR(42) NOT NULL,
    domain_name VARCHAR(255) NOT NULL,
    weight NUMERIC(78, 0) NOT NULL,
    tx_hash VARCHAR(255),
    block_number BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (pool_address) REFERENCES pools(pool_address) ON DELETE CASCADE,
    UNIQUE(pool_address, voter, domain_name)
);

-- Indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_pool ON votes(pool_address);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter);
CREATE INDEX IF NOT EXISTS idx_votes_domain ON votes(domain_name);

-- Voting results aggregate (materialized view)
CREATE TABLE IF NOT EXISTS voting_results (
    id SERIAL PRIMARY KEY,
    pool_address VARCHAR(42) NOT NULL,
    domain_name VARCHAR(255) NOT NULL,
    total_votes NUMERIC(78, 0) DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (pool_address) REFERENCES pools(pool_address) ON DELETE CASCADE,
    UNIQUE(pool_address, domain_name)
);

-- Indexes for voting results
CREATE INDEX IF NOT EXISTS idx_voting_results_pool ON voting_results(pool_address);
CREATE INDEX IF NOT EXISTS idx_voting_results_votes ON voting_results(total_votes DESC);

-- Revenue distributions table
CREATE TABLE IF NOT EXISTS distributions (
    id SERIAL PRIMARY KEY,
    pool_address VARCHAR(42) NOT NULL,
    distribution_id BIGINT NOT NULL,
    total_amount NUMERIC(78, 0) NOT NULL,
    snapshot_timestamp BIGINT NOT NULL,
    tx_hash VARCHAR(255),
    block_number BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (pool_address) REFERENCES pools(pool_address) ON DELETE CASCADE,
    UNIQUE(pool_address, distribution_id)
);

-- Indexes for distributions
CREATE INDEX IF NOT EXISTS idx_distributions_pool ON distributions(pool_address);
CREATE INDEX IF NOT EXISTS idx_distributions_created_at ON distributions(created_at DESC);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    distribution_id INTEGER NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    claimed BOOLEAN DEFAULT false,
    tx_hash VARCHAR(255),
    block_number BIGINT,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (distribution_id) REFERENCES distributions(id) ON DELETE CASCADE,
    UNIQUE(distribution_id, user_address)
);

-- Indexes for claims
CREATE INDEX IF NOT EXISTS idx_claims_distribution ON claims(distribution_id);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_address);
CREATE INDEX IF NOT EXISTS idx_claims_claimed ON claims(claimed);

-- Domains cache table (from Subgraph)
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    token_id VARCHAR(255),
    network_id VARCHAR(50),
    owner_address VARCHAR(255),
    expires_at TIMESTAMP,
    tokenized_at TIMESTAMP,
    registrar_name VARCHAR(255),
    registrar_iana_id INTEGER,
    data JSONB,
    cached_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for domains
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
CREATE INDEX IF NOT EXISTS idx_domains_owner ON domains(owner_address);
CREATE INDEX IF NOT EXISTS idx_domains_expires_at ON domains(expires_at);

-- Marketplace listings cache
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,
    token_id VARCHAR(255) NOT NULL,
    domain_name VARCHAR(255),
    price NUMERIC(78, 0) NOT NULL,
    currency_symbol VARCHAR(20) NOT NULL,
    offerer_address VARCHAR(255) NOT NULL,
    orderbook VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    data JSONB,
    cached_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for listings
CREATE INDEX IF NOT EXISTS idx_listings_token ON listings(token_id);
CREATE INDEX IF NOT EXISTS idx_listings_domain ON listings(domain_name);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON listings(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_pools_updated_at BEFORE UPDATE ON pools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voting_results_updated_at BEFORE UPDATE ON voting_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to aggregate votes
CREATE OR REPLACE FUNCTION aggregate_votes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO voting_results (pool_address, domain_name, total_votes, vote_count)
    VALUES (NEW.pool_address, NEW.domain_name, NEW.weight, 1)
    ON CONFLICT (pool_address, domain_name)
    DO UPDATE SET
        total_votes = voting_results.total_votes + NEW.weight,
        vote_count = voting_results.vote_count + 1,
        updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for vote aggregation
CREATE TRIGGER aggregate_votes_trigger AFTER INSERT ON votes
    FOR EACH ROW EXECUTE FUNCTION aggregate_votes();

-- Migration completed
SELECT 'Migration completed successfully' AS message;
