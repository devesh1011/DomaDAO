import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../db/connection.js';
import { cacheManager, CacheKeys } from '../../cache/manager.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /pools - List all pools
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    // Try cache first
    const cacheKey = `${CacheKeys.poolList()}:${status || 'all'}:${limit}:${offset}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Build query
    let query = 'SELECT * FROM pools';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Cache result
    await cacheManager.set(cacheKey, result.rows, 60); // 1 minute cache

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: result.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:address - Get pool by address
 */
router.get('/:address', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;

    // Try cache
    const cached = await cacheManager.get(CacheKeys.pool(address));
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const result = await pool.query(
      'SELECT * FROM pools WHERE pool_address = $1',
      [address]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Pool not found');
    }

    const poolData = result.rows[0];

    // Cache result
    await cacheManager.set(CacheKeys.pool(address), poolData, 300); // 5 minutes

    res.json({
      success: true,
      data: poolData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:address/contributions - Get contributions for a pool
 */
router.get('/:address/contributions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM contributions 
       WHERE pool_address = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [address, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: result.rowCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:address/votes - Get votes for a pool
 */
router.get('/:address/votes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;

    const result = await pool.query(
      `SELECT * FROM votes 
       WHERE pool_address = $1 
       ORDER BY created_at DESC`,
      [address]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:address/voting-results - Get voting results
 */
router.get('/:address/voting-results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;

    // Try cache
    const cacheKey = CacheKeys.votingResults(address);
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const result = await pool.query(
      `SELECT * FROM voting_results 
       WHERE pool_address = $1 
       ORDER BY total_votes DESC`,
      [address]
    );

    // Cache for 1 minute
    await cacheManager.set(cacheKey, result.rows, 60);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /pools/:address/distributions - Get revenue distributions
 */
router.get('/:address/distributions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;

    const result = await pool.query(
      `SELECT * FROM distributions 
       WHERE pool_address = $1 
       ORDER BY created_at DESC`,
      [address]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
