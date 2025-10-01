import { pollConsumer } from './consumer.js';
import { pollLogger as logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

async function main() {
  if (!config.pollApi.enabled) {
    logger.warn('Poll API consumer is disabled');
    process.exit(0);
  }

  logger.info('🚀 Starting Doma Poll API Consumer');

  // Handle graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down poll consumer...');
    pollConsumer.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  try {
    await pollConsumer.start();
    logger.info('✅ Poll consumer started successfully');
  } catch (error) {
    logger.error({ error }, '❌ Failed to start poll consumer');
    process.exit(1);
  }
}

main();
