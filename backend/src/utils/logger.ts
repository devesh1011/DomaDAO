import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.logging.level,
  transport: config.logging.prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: config.nodeEnv,
  },
});

// Create child loggers for different services
export const pollLogger = logger.child({ service: 'poll-consumer' });
export const indexerLogger = logger.child({ service: 'event-indexer' });
export const apiLogger = logger.child({ service: 'rest-api' });
export const orderbookLogger = logger.child({ service: 'orderbook' });
export const subgraphLogger = logger.child({ service: 'subgraph' });
