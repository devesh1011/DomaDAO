import { PollConsumer } from '../poll-consumer/consumer.js';
import { eventIndexer } from './indexer.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

const indexerLogger = logger.child({ service: 'indexer-service' });

export async function startIndexerService(): Promise<void> {
  indexerLogger.info('Starting Event Indexer Service...');

  // Create poll consumer
  const pollConsumer = new PollConsumer(config.pollApi.apiKey, {
    baseURL: config.pollApi.baseUrl,
    pollInterval: config.indexer.pollInterval,
    batchSize: config.indexer.batchSize,
  });

  // Subscribe to poll events
  pollConsumer.on('events', async (events) => {
    indexerLogger.info({ count: events.length }, 'Received events batch');
    
    try {
      await eventIndexer.indexEvents(events);
      indexerLogger.info({ count: events.length }, 'Events indexed successfully');
    } catch (error) {
      indexerLogger.error({ error }, 'Error indexing events batch');
    }
  });

  pollConsumer.on('error', (error) => {
    indexerLogger.error({ error }, 'Poll consumer error');
  });

  // Start consuming
  await pollConsumer.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    indexerLogger.info('Shutting down Event Indexer Service...');
    await pollConsumer.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    indexerLogger.info('Shutting down Event Indexer Service...');
    await pollConsumer.stop();
    process.exit(0);
  });
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startIndexerService().catch((error) => {
    indexerLogger.error({ error }, 'Failed to start indexer service');
    process.exit(1);
  });
}
