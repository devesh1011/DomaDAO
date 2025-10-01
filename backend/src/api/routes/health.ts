import { Router, Request, Response } from 'express';
import { pool } from '../../db/connection.js';
import { redis, testRedisConnection } from '../../cache/redis.js';
import { testConnection } from '../../db/connection.js';

const router = Router();

/**
 * GET /health - Health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await testConnection();
    const redisHealthy = await testRedisConnection();

    const health = {
      status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        redis: redisHealthy ? 'up' : 'down',
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * GET /status - Detailed status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Get database stats
    const poolsResult = await pool.query('SELECT COUNT(*) FROM pools');
    const eventsResult = await pool.query('SELECT COUNT(*) FROM events');
    const contributionsResult = await pool.query('SELECT COUNT(*) FROM contributions');

    // Get Redis info
    const redisInfo = await redis.info('stats');

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        database: {
          pools: parseInt(poolsResult.rows[0].count),
          events: parseInt(eventsResult.rows[0].count),
          contributions: parseInt(contributionsResult.rows[0].count),
        },
        redis: {
          connected: redis.status === 'ready',
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
    });
  }
});

export default router;
