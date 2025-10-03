import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

dotenvConfig();

const configSchema = z.object({
  // Environment
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),

  // Server
  port: z.coerce.number().default(3001),
  host: z.string().default("0.0.0.0"),

  // Doma API
  domaApi: z.object({
    baseURL: z.string().url().default("https://api-testnet.doma.xyz"),
    apiKey: z.string().min(1),
    subgraphURL: z
      .string()
      .url()
      .default("https://api-testnet.doma.xyz/graphql"),
  }),

  // Database
  database: z.object({
    url: z.string().url(),
    host: z.string().default("localhost"),
    port: z.coerce.number().default(5432),
    name: z.string().default("domadao"),
    user: z.string().default("postgres"),
    password: z.string().optional().default(""),
    poolMin: z.coerce.number().default(2),
    poolMax: z.coerce.number().default(10),
  }),

  // Redis
  redis: z.object({
    host: z.string().default("localhost"),
    port: z.coerce.number().default(6379),
    password: z.string().optional(),
    db: z.coerce.number().default(0),
  }),

  // Cache
  cache: z.object({
    ttl: z.coerce.number().default(3600), // 1 hour
  }),

  // Poll API
  pollApi: z.object({
    enabled: z.coerce.boolean().default(true),
    intervalMs: z.coerce.number().default(5000),
    batchSize: z.coerce.number().default(100),
    eventTypes: z.string().optional(),
  }),

  // Event Indexer
  indexer: z.object({
    enabled: z.coerce.boolean().default(true),
    batchSize: z.coerce.number().default(50),
    retryAttempts: z.coerce.number().default(3),
    retryDelayMs: z.coerce.number().default(1000),
  }),

  // Blockchain
  blockchain: z.object({
    chainId: z.string().default("eip155:97476"),
    rpcUrl: z.string().url().default("https://rpc-testnet.doma.xyz"),
    explorerUrl: z.string().url().default("https://explorer-testnet.doma.xyz"),
  }),

  // Contract Addresses
  contracts: z.object({
    poolFactory: z.string().optional(),
    fractionPool: z.string().optional(),
    revenueDistributor: z.string().optional(),
    buyoutHandler: z.string().optional(),
    mockUsdc: z.string().optional(),
  }),

  // Orderbook
  orderbook: z.object({
    type: z.enum(["DOMA", "OPENSEA"]).default("DOMA"),
    supportedCurrencies: z.string().default("USDC,ETH"),
  }),

  // API
  api: z.object({
    rateLimit: z.coerce.number().default(100),
    timeoutMs: z.coerce.number().default(30000),
    enableCors: z.coerce.boolean().default(true),
    corsOrigin: z.string().default("http://localhost:3000"),
  }),

  // Logging
  logging: z.object({
    level: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
    prettyPrint: z.coerce.boolean().default(true),
  }),

  // Monitoring
  monitoring: z.object({
    sentryDsn: z.string().optional(),
    metricsEnabled: z.coerce.boolean().default(false),
  }),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  try {
    return configSchema.parse({
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      host: process.env.HOST,

      domaApi: {
        baseURL: process.env.DOMA_API_BASE_URL,
        apiKey: process.env.DOMA_API_KEY,
        subgraphURL: process.env.DOMA_SUBGRAPH_URL,
      },

      database: {
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        poolMin: process.env.DB_POOL_MIN,
        poolMax: process.env.DB_POOL_MAX,
      },

      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB,
      },

      cache: {
        ttl: process.env.CACHE_TTL,
      },

      pollApi: {
        enabled: process.env.POLL_API_ENABLED,
        intervalMs: process.env.POLL_INTERVAL_MS,
        batchSize: process.env.POLL_BATCH_SIZE,
        eventTypes: process.env.POLL_EVENT_TYPES,
      },

      indexer: {
        enabled: process.env.INDEXER_ENABLED,
        batchSize: process.env.INDEXER_BATCH_SIZE,
        retryAttempts: process.env.INDEXER_RETRY_ATTEMPTS,
        retryDelayMs: process.env.INDEXER_RETRY_DELAY_MS,
      },

      blockchain: {
        chainId: process.env.DOMA_CHAIN_ID,
        rpcUrl: process.env.DOMA_RPC_URL,
        explorerUrl: process.env.DOMA_EXPLORER_URL,
      },

      contracts: {
        poolFactory: process.env.POOL_FACTORY_ADDRESS,
        fractionPool: process.env.FRACTION_POOL_ADDRESS,
        revenueDistributor: process.env.REVENUE_DISTRIBUTOR_ADDRESS,
        buyoutHandler: process.env.BUYOUT_HANDLER_ADDRESS,
        mockUsdc: process.env.MOCK_USDC_ADDRESS,
      },

      orderbook: {
        type: process.env.ORDERBOOK_TYPE as "DOMA" | "OPENSEA",
        supportedCurrencies: process.env.SUPPORTED_CURRENCIES,
      },

      api: {
        rateLimit: process.env.API_RATE_LIMIT,
        timeoutMs: process.env.API_TIMEOUT_MS,
        enableCors: process.env.ENABLE_CORS,
        corsOrigin: process.env.CORS_ORIGIN,
      },

      logging: {
        level: process.env.LOG_LEVEL as any,
        prettyPrint: process.env.LOG_PRETTY_PRINT,
      },

      monitoring: {
        sentryDsn: process.env.SENTRY_DSN,
        metricsEnabled: process.env.METRICS_ENABLED,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Configuration validation failed:");
      console.error(error.errors);
      process.exit(1);
    }
    throw error;
  }
}

export const config = loadConfig();
