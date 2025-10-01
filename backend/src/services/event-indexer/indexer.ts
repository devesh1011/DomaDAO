import { pool } from '../../db/connection.js';
import { logger } from '../../utils/logger.js';
import {
  BlockchainEvent,
  ContractEventType,
  PoolCreatedEvent,
  ContributionMadeEvent,
  VoteCastEvent,
  RevenueDistributedEvent,
} from '../../types/blockchain.js';

export class EventIndexer {
  /**
   * Index a blockchain event to database
   */
  async indexEvent(event: BlockchainEvent): Promise<void> {
    try {
      // Check if event already processed (idempotency)
      const existing = await this.getEventByUniqueId(event.uniqueId);
      if (existing) {
        logger.debug({ uniqueId: event.uniqueId }, 'Event already indexed, skipping');
        return;
      }

      // Store raw event
      await this.storeRawEvent(event);

      // Process based on event type
      switch (event.type) {
        case ContractEventType.POOL_CREATED:
          await this.handlePoolCreated(event as PoolCreatedEvent);
          break;
        case ContractEventType.CONTRIBUTION_MADE:
          await this.handleContributionMade(event as ContributionMadeEvent);
          break;
        case ContractEventType.VOTE_CAST:
          await this.handleVoteCast(event as VoteCastEvent);
          break;
        case ContractEventType.REVENUE_DISTRIBUTED:
          await this.handleRevenueDistributed(event as RevenueDistributedEvent);
          break;
        default:
          logger.debug({ type: event.type }, 'Unhandled event type');
      }

      logger.info({ uniqueId: event.uniqueId, type: event.type }, 'Event indexed successfully');
    } catch (error) {
      logger.error({ error, event }, 'Error indexing event');
      throw error;
    }
  }

  /**
   * Store raw event in events table
   */
  private async storeRawEvent(event: BlockchainEvent): Promise<void> {
    await pool.query(
      `INSERT INTO events (unique_id, event_type, name, token_id, network_id, tx_hash, block_number, log_index, finalized, event_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (unique_id) DO NOTHING`,
      [
        event.uniqueId,
        event.type,
        event.name || null,
        event.tokenId || null,
        event.networkId || null,
        event.tx?.hash || null,
        event.tx?.blockNumber || null,
        event.tx?.logIndex || null,
        event.finalized || false,
        JSON.stringify(event),
      ]
    );
  }

  /**
   * Get event by unique ID
   */
  private async getEventByUniqueId(uniqueId: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM events WHERE unique_id = $1',
      [uniqueId]
    );
    return result.rows[0];
  }

  /**
   * Handle PoolCreated event
   */
  private async handlePoolCreated(event: PoolCreatedEvent): Promise<void> {
    const data = event.data;
    
    await pool.query(
      `INSERT INTO pools (
        pool_address, owner_address, target_amount, contribution_window_end,
        voting_window_start, voting_window_end, purchase_window_start, usdc_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (pool_address) DO NOTHING`,
      [
        data.poolAddress,
        data.ownerAddress,
        data.targetAmount,
        data.contributionWindowEnd,
        data.votingWindowStart,
        data.votingWindowEnd,
        data.purchaseWindowStart,
        data.usdcAddress,
      ]
    );
  }

  /**
   * Handle ContributionMade event
   */
  private async handleContributionMade(event: ContributionMadeEvent): Promise<void> {
    const data = event.data;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert contribution
      await client.query(
        `INSERT INTO contributions (pool_address, contributor, amount, tx_hash, block_number)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tx_hash) DO NOTHING`,
        [
          data.poolAddress,
          data.contributor,
          data.amount,
          event.tx?.hash,
          event.tx?.blockNumber,
        ]
      );

      // Update pool current amount
      await client.query(
        `UPDATE pools 
         SET current_amount = current_amount + $1
         WHERE pool_address = $2`,
        [data.amount, data.poolAddress]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle VoteCast event
   */
  private async handleVoteCast(event: VoteCastEvent): Promise<void> {
    const data = event.data;
    
    await pool.query(
      `INSERT INTO votes (pool_address, voter, domain_name, weight, tx_hash, block_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (pool_address, voter, domain_name) DO UPDATE
       SET weight = votes.weight + $4`,
      [
        data.poolAddress,
        data.voter,
        event.name || 'unknown',  // Use name from event or default
        data.weight,
        event.tx?.hash,
        event.tx?.blockNumber,
      ]
    );
  }

  /**
   * Handle RevenueDistributed event
   */
  private async handleRevenueDistributed(event: RevenueDistributedEvent): Promise<void> {
    const data = event.data;
    
    await pool.query(
      `INSERT INTO distributions (pool_address, distribution_id, total_amount, snapshot_timestamp, tx_hash, block_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (pool_address, distribution_id) DO NOTHING`,
      [
        data.poolAddress,
        data.distributionId,
        data.totalAmount,
        data.snapshotTimestamp,
        event.tx?.hash,
        event.tx?.blockNumber,
      ]
    );
  }

  /**
   * Batch index multiple events
   */
  async indexEvents(events: BlockchainEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.indexEvent(event);
      } catch (error) {
        logger.error({ error, event }, 'Error indexing single event in batch');
        // Continue processing other events
      }
    }
  }

  /**
   * Get latest indexed block number
   */
  async getLatestBlockNumber(): Promise<number> {
    const result = await pool.query(
      'SELECT MAX(block_number) as max_block FROM events WHERE block_number IS NOT NULL'
    );
    return result.rows[0]?.max_block || 0;
  }
}

export const eventIndexer = new EventIndexer();
