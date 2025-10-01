import { logger } from './utils/logger.js';
import { config } from './config/index.js';
import { testConnection, closeConnection } from './db/connection.js';
import { testRedisConnection, closeRedis } from './cache/redis.js';
import { runMigrations } from './db/migrate.js';
import { startIndexerService } from './services/event-indexer/service.js';
import { startServer } from './api/index.js';

/**
 * DomaDAO Backend - Phase 2: Off-chain Services
 * Main entry point for all backend services
 */

async function main() {
  logger.info({
    env: config.nodeEnv,
    port: config.api.port,
  }, '🚀 DomaDAO Backend starting...');

  logger.info({
    pollApiEnabled: config.pollApi.enabled,
    indexerEnabled: config.indexer.enabled,
    domaChainId: config.blockchain.chainId,
  }, 'Configuration loaded');

  // Test database connection
  logger.info('Testing database connection...');
  const dbConnected = await testConnection();
  if (!dbConnected) {
    throw new Error('Database connection failed');
  }

  // Test Redis connection
  logger.info('Testing Redis connection...');
  const redisConnected = await testRedisConnection();
  if (!redisConnected) {
    throw new Error('Redis connection failed');
  }

  // Run migrations
  logger.info('Running database migrations...');
  await runMigrations();

  // Start services based on mode
  const mode = process.env.SERVICE_MODE || 'all';
  logger.info({ mode }, 'Starting services...');

  switch (mode) {
    case 'api':
      logger.info('Starting API server only...');
      await startServer();
      break;

    case 'indexer':
      logger.info('Starting Event Indexer only...');
      await startIndexerService();
      break;

    case 'all':
    default:
      logger.info('Starting all services...');
      await Promise.all([
        startServer(),
        startIndexerService(),
      ]);
      break;
  }

  // TODO: Initialize services
  // - Database connection
  // - Redis connection
  // - Poll consumer (if enabled)
  // - Event indexer (if enabled)
  // - REST API server

  logger.info('✅ All services initialized successfully');
  logger.info(`🌐 API available at http://${config.host}:${config.port}`);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  // TODO: Close all connections
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the application
main().catch((error) => {
  logger.error({ error }, '❌ Failed to start backend');
  process.exit(1);
});
