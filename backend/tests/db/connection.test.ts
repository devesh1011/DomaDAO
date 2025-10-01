import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { pool, testConnection, closeConnection } from '../src/db/connection';

describe('Database Connection', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    await closeConnection();
  });

  it('should connect to database', async () => {
    const connected = await testConnection();
    expect(connected).toBe(true);
  });

  it('should execute query', async () => {
    const result = await pool.query('SELECT NOW()');
    expect(result.rows).toBeDefined();
    expect(result.rows.length).toBeGreaterThan(0);
  });
});
