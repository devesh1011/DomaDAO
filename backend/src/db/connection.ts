import pkg from 'pg';
const { Pool } = pkg;
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export const pool = new Pool({
  connectionString: config.database.url,
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  min: config.database.poolMin,
  max: config.database.poolMax,
});

// Test connection
pool.on('connect', () => {
  logger.debug('Database connection established');
});

pool.on('error', (err) => {
  logger.error({ error: err }, 'Unexpected database error');
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await pool.end();
  logger.info('Database connection closed');
}
