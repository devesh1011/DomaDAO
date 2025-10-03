-- Migration: Poll Events Table
-- Description: Store Doma Protocol events from Poll API
-- Created: 2025-10-03

CREATE TABLE IF NOT EXISTS poll_events (
  id SERIAL PRIMARY KEY,
  
  -- Doma event identifiers
  event_id INTEGER NOT NULL UNIQUE,
  unique_id VARCHAR(255) NOT NULL UNIQUE,
  correlation_id VARCHAR(255),
  relay_id VARCHAR(255),
  
  -- Event metadata
  event_type VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  token_id VARCHAR(100),
  
  -- Blockchain data
  network_id VARCHAR(50),
  chain_id VARCHAR(50),
  tx_hash VARCHAR(100),
  block_number VARCHAR(50),
  log_index INTEGER,
  finalized BOOLEAN DEFAULT false,
  
  -- Event-specific data
  event_data JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Processing status
  processing_status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Indexes for efficient querying
CREATE INDEX idx_poll_events_event_id ON poll_events(event_id);
CREATE INDEX idx_poll_events_unique_id ON poll_events(unique_id);
CREATE INDEX idx_poll_events_event_type ON poll_events(event_type);
CREATE INDEX idx_poll_events_name ON poll_events(name) WHERE name IS NOT NULL;
CREATE INDEX idx_poll_events_token_id ON poll_events(token_id) WHERE token_id IS NOT NULL;
CREATE INDEX idx_poll_events_tx_hash ON poll_events(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX idx_poll_events_processing_status ON poll_events(processing_status);
CREATE INDEX idx_poll_events_created_at ON poll_events(created_at DESC);
CREATE INDEX idx_poll_events_correlation_id ON poll_events(correlation_id) WHERE correlation_id IS NOT NULL;

-- Compound indexes for common queries
CREATE INDEX idx_poll_events_type_status ON poll_events(event_type, processing_status);
CREATE INDEX idx_poll_events_name_type ON poll_events(name, event_type) WHERE name IS NOT NULL;

-- Table for tracking poll cursor
CREATE TABLE IF NOT EXISTS poll_cursor (
  id SERIAL PRIMARY KEY,
  last_acknowledged_id INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_cursor CHECK (id = 1)
);

-- Insert initial cursor
INSERT INTO poll_cursor (id, last_acknowledged_id) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- Table for tracking event processing metrics
CREATE TABLE IF NOT EXISTS poll_event_metrics (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  last_processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_type)
);

-- Comments for documentation
COMMENT ON TABLE poll_events IS 'Stores events from Doma Protocol Poll API for audit trail and analytics';
COMMENT ON COLUMN poll_events.event_id IS 'Doma event ID (incremental, used for cursor)';
COMMENT ON COLUMN poll_events.unique_id IS 'Globally unique event ID from on-chain data';
COMMENT ON COLUMN poll_events.correlation_id IS 'Groups related events together';
COMMENT ON COLUMN poll_events.event_data IS 'Full event payload as JSON';
COMMENT ON COLUMN poll_events.processing_status IS 'Status: pending, processed, failed';

COMMENT ON TABLE poll_cursor IS 'Tracks the last acknowledged event ID for poll resumption';
COMMENT ON TABLE poll_event_metrics IS 'Aggregated metrics for event processing';
