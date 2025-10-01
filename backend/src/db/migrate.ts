import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './connection.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    logger.info('Starting database migrations...');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Read and execute migration files
    const migrations = [
      '001_initial_schema.sql',
    ];

    for (const migration of migrations) {
      // Check if migration already executed
      const result = await client.query(
        'SELECT id FROM migrations WHERE name = $1',
        [migration]
      );

      if (result.rows.length > 0) {
        logger.info({ migration }, 'Migration already executed, skipping');
        continue;
      }

      logger.info({ migration }, 'Executing migration');

      // Read migration file
      const migrationPath = resolve(__dirname, 'migrations', migration);
      const sql = readFileSync(migrationPath, 'utf-8');

      // Execute migration
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration]
        );
        await client.query('COMMIT');
        logger.info({ migration }, 'Migration executed successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      logger.info('✅ Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, '❌ Migrations failed');
      process.exit(1);
    });
}
