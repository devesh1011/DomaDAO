import { Pool } from "pg";
import { pollLogger as logger } from "../../utils/logger.js";
import { DomaPollEvent } from "../../types/doma.js";

export interface PollEventRecord {
  id: number;
  event_id: number;
  unique_id: string;
  correlation_id: string | null;
  relay_id: string | null;
  event_type: string;
  name: string | null;
  token_id: string | null;
  network_id: string | null;
  chain_id: string | null;
  tx_hash: string | null;
  block_number: string | null;
  log_index: number | null;
  finalized: boolean;
  event_data: any;
  created_at: Date;
  processed_at: Date | null;
  acknowledged_at: Date | null;
  processing_status: "pending" | "processed" | "failed";
  error_message: string | null;
  retry_count: number;
}

export interface PollEventFilters {
  event_type?: string;
  name?: string;
  token_id?: string;
  processing_status?: string;
  from_event_id?: number;
  to_event_id?: number;
  limit?: number;
  offset?: number;
}

export class PollEventRepository {
  constructor(private pool: Pool) {}

  /**
   * Insert a new poll event
   */
  async insert(event: DomaPollEvent): Promise<PollEventRecord> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO poll_events (
          event_id,
          unique_id,
          correlation_id,
          relay_id,
          event_type,
          name,
          token_id,
          network_id,
          chain_id,
          tx_hash,
          block_number,
          log_index,
          finalized,
          event_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (unique_id) DO UPDATE SET
          event_data = EXCLUDED.event_data,
          finalized = EXCLUDED.finalized
        RETURNING *
      `;

      const values = [
        event.id,
        event.uniqueId,
        event.eventData.correlationId || null,
        event.relayId || null,
        event.type,
        event.name || null,
        event.tokenId || null,
        event.eventData.networkId || null,
        this.extractChainId(event.eventData.networkId),
        event.eventData.txHash || null,
        event.eventData.blockNumber || null,
        event.eventData.logIndex || null,
        event.eventData.finalized || false,
        JSON.stringify(event.eventData),
      ];

      const result = await client.query<PollEventRecord>(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Insert multiple events in a transaction
   */
  async insertBatch(events: DomaPollEvent[]): Promise<number> {
    if (events.length === 0) return 0;

    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      let insertedCount = 0;

      for (const event of events) {
        const query = `
          INSERT INTO poll_events (
            event_id,
            unique_id,
            correlation_id,
            relay_id,
            event_type,
            name,
            token_id,
            network_id,
            chain_id,
            tx_hash,
            block_number,
            log_index,
            finalized,
            event_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (unique_id) DO NOTHING
          RETURNING id
        `;

        const values = [
          event.id,
          event.uniqueId,
          event.eventData.correlationId || null,
          event.relayId || null,
          event.type,
          event.name || null,
          event.tokenId || null,
          event.eventData.networkId || null,
          this.extractChainId(event.eventData.networkId),
          event.eventData.txHash || null,
          event.eventData.blockNumber || null,
          event.eventData.logIndex || null,
          event.eventData.finalized || false,
          JSON.stringify(event.eventData),
        ];

        const result = await client.query(query, values);
        if (result.rowCount && result.rowCount > 0) {
          insertedCount++;
        }
      }

      await client.query("COMMIT");
      logger.info(
        { insertedCount, totalEvents: events.length },
        "Inserted poll events batch"
      );

      return insertedCount;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error({ error }, "Error inserting poll events batch");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find events by filters
   */
  async find(filters: PollEventFilters): Promise<PollEventRecord[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.event_type) {
      conditions.push(`event_type = $${paramIndex++}`);
      values.push(filters.event_type);
    }

    if (filters.name) {
      conditions.push(`name = $${paramIndex++}`);
      values.push(filters.name);
    }

    if (filters.token_id) {
      conditions.push(`token_id = $${paramIndex++}`);
      values.push(filters.token_id);
    }

    if (filters.processing_status) {
      conditions.push(`processing_status = $${paramIndex++}`);
      values.push(filters.processing_status);
    }

    if (filters.from_event_id !== undefined) {
      conditions.push(`event_id >= $${paramIndex++}`);
      values.push(filters.from_event_id);
    }

    if (filters.to_event_id !== undefined) {
      conditions.push(`event_id <= $${paramIndex++}`);
      values.push(filters.to_event_id);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM poll_events
      ${whereClause}
      ORDER BY event_id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    values.push(limit, offset);

    const result = await this.pool.query<PollEventRecord>(query, values);
    return result.rows;
  }

  /**
   * Mark event as processed
   */
  async markProcessed(eventId: number): Promise<void> {
    const query = `
      UPDATE poll_events
      SET processing_status = 'processed',
          processed_at = CURRENT_TIMESTAMP
      WHERE event_id = $1
    `;

    await this.pool.query(query, [eventId]);
  }

  /**
   * Mark event as failed
   */
  async markFailed(eventId: number, errorMessage: string): Promise<void> {
    const query = `
      UPDATE poll_events
      SET processing_status = 'failed',
          error_message = $2,
          retry_count = retry_count + 1
      WHERE event_id = $1
    `;

    await this.pool.query(query, [eventId, errorMessage]);
  }

  /**
   * Get last acknowledged event ID
   */
  async getLastAcknowledgedId(): Promise<number> {
    const query = "SELECT last_acknowledged_id FROM poll_cursor WHERE id = 1";
    const result = await this.pool.query<{ last_acknowledged_id: number }>(
      query
    );

    if (result.rows.length === 0) {
      return 0;
    }

    return result.rows[0].last_acknowledged_id;
  }

  /**
   * Update last acknowledged event ID
   */
  async updateLastAcknowledgedId(eventId: number): Promise<void> {
    const query = `
      UPDATE poll_cursor
      SET last_acknowledged_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `;

    await this.pool.query(query, [eventId]);

    // Also mark events as acknowledged
    await this.pool.query(
      `
      UPDATE poll_events
      SET acknowledged_at = CURRENT_TIMESTAMP
      WHERE event_id <= $1 AND acknowledged_at IS NULL
    `,
      [eventId]
    );
  }

  /**
   * Get event statistics
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const totalQuery = "SELECT COUNT(*) as count FROM poll_events";
    const totalResult = await this.pool.query<{ count: string }>(totalQuery);

    const byTypeQuery = `
      SELECT event_type, COUNT(*) as count
      FROM poll_events
      GROUP BY event_type
      ORDER BY count DESC
    `;
    const byTypeResult = await this.pool.query<{
      event_type: string;
      count: string;
    }>(byTypeQuery);

    const byStatusQuery = `
      SELECT processing_status, COUNT(*) as count
      FROM poll_events
      GROUP BY processing_status
      ORDER BY count DESC
    `;
    const byStatusResult = await this.pool.query<{
      processing_status: string;
      count: string;
    }>(byStatusQuery);

    return {
      total: parseInt(totalResult.rows[0].count),
      byType: Object.fromEntries(
        byTypeResult.rows.map((row) => [row.event_type, parseInt(row.count)])
      ),
      byStatus: Object.fromEntries(
        byStatusResult.rows.map((row) => [
          row.processing_status,
          parseInt(row.count),
        ])
      ),
    };
  }

  /**
   * Extract chain ID from network ID (CAIP-2 format)
   * e.g., "eip155:1" -> "1"
   */
  private extractChainId(networkId: string | undefined): string | null {
    if (!networkId) return null;
    const parts = networkId.split(":");
    return parts.length > 1 ? parts[1] : null;
  }
}
