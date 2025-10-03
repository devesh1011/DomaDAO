import pkg from "pg";
const { Pool } = pkg;
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";

// Log the configuration being used (without sensitive data)
logger.debug(
  {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    passwordSet: !!config.database.password,
  },
  "Database connection configuration"
);

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  min: config.database.poolMin,
  max: config.database.poolMax,
});

// Test connection
pool.on("connect", () => {
  logger.debug("Database connection established");
});

pool.on("error", (err) => {
  logger.error({ error: err }, "Unexpected database error");
});

export async function testConnection(): Promise<boolean> {
  try {
    logger.info(
      {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        hasPassword: config.database.password
          ? config.database.password.length
          : 0,
      },
      "Attempting database connection with credentials"
    );

    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    logger.info("Database connection successful");
    return true;
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await pool.end();
  logger.info("Database connection closed");
}
