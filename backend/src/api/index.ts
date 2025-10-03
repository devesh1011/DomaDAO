import express from "express";
import cors from "cors";
import helmet from "helmet";
import { logger } from "../utils/logger.js";
import { config } from "../config/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.js";
import poolsRoutes from "./routes/pools.js";
import domainsRoutes from "./routes/domains.js";
import pollRoutes from "./routes/poll-routes.js";

const apiLogger = logger.child({ service: "api" });

export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.api.corsOrigin.split(","),
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      apiLogger.info(
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        },
        "API Request"
      );
    });
    next();
  });

  // Routes
  app.use("/health", healthRoutes);
  app.use("/api/pools", poolsRoutes);
  app.use("/api/domains", domainsRoutes);
  app.use("/api/poll", pollRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

export async function startServer() {
  const app = createApp();

  const server = app.listen(config.port, () => {
    apiLogger.info({ port: config.port }, "API Server started");
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    apiLogger.info("Shutting down API server...");
    server.close(() => {
      apiLogger.info("API server closed");
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    apiLogger.info("Shutting down API server...");
    server.close(() => {
      apiLogger.info("API server closed");
      process.exit(0);
    });
  });

  return server;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    apiLogger.error({ error }, "Failed to start API server");
    process.exit(1);
  });
}
