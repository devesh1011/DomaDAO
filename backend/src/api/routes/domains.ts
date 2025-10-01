import { Router, Request, Response, NextFunction } from 'express';
import { subgraphClient } from '../../services/subgraph/index.js';
import { cacheManager, CacheKeys } from '../../cache/manager.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const router = Router();

// Debug middleware for all domains routes
router.use((req, res, next) => {
  console.log('Domains router hit:', req.method, req.path, req.params, req.query);
  next();
});

/**
 * GET /domains/search - Search domains
 * NOTE: This must be defined BEFORE /:name to avoid route conflicts
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, first = 20, skip = 0 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required',
      });
    }

    // Search using subgraph (basic prefix search)
    const domains = await subgraphClient.getNames({
      first: Number(first),
      skip: Number(skip),
      orderBy: 'name',
      orderDirection: 'asc',
      where: {
        name_starts_with: query.toLowerCase(),
      },
    });

    res.json({
      success: true,
      data: domains,
      pagination: {
        first: Number(first),
        skip: Number(skip),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /domains/:name - Get domain details
 */
router.get('/:name', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;

    // Try cache
    const cacheKey = CacheKeys.domain(name);
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Fetch from subgraph
    const domain = await subgraphClient.getName(name);

    if (!domain) {
      throw new NotFoundError('Domain not found');
    }

    // Cache for 5 minutes
    await cacheManager.set(cacheKey, domain, 300);

    res.json({
      success: true,
      data: domain,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /domains/:name/activities - Get domain activities
 */
router.get('/:name/activities', async (req: Request, res: Response, next: NextFunction) => {
  console.log('Activities route called with params:', req.params, 'query:', req.query);
  try {
    const { name } = req.params;
    const { take = 50, skip = 0 } = req.query;

    const activities = await subgraphClient.getNameActivities(name, {
      take: Number(take),
      skip: Number(skip),
    });

    res.json({
      success: true,
      data: activities,
      pagination: {
        take: Number(take),
        skip: Number(skip),
      },
    });
  } catch (error) {
    console.log('Activities route error:', error);
    next(error);
  }
});

/**
 * GET /domains/:name/listings - Get domain listings
 */
router.get('/:name/listings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const { take = 50, skip = 0 } = req.query;

    // Extract SLD from domain name (e.g., "example.com" -> "example")
    const sld = name.split('.')[0];

    // Try cache
    const cacheKey = `${CacheKeys.domainListings(name)}:${take}:${skip}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const listings = await subgraphClient.getListings({
      sld,
      take: Number(take),
      skip: Number(skip),
    });

    // Cache for 2 minutes
    await cacheManager.set(cacheKey, listings, 120);

    res.json({
      success: true,
      data: listings,
      pagination: {
        take: Number(take),
        skip: Number(skip),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /domains/:name/offers - Get domain offers
 */
router.get('/:name/offers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const { take = 50, skip = 0 } = req.query;

    // Try cache
    const cacheKey = `${CacheKeys.domainOffers(name)}:${take}:${skip}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // First get the domain to find the token ID
    const domain = await subgraphClient.getName(name);
    if (!domain || !domain.tokens || domain.tokens.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
          totalCount: 0,
          pageSize: Number(take),
          currentPage: 1,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
        pagination: {
          take: Number(take),
          skip: Number(skip),
        },
      });
    }

    // Use the first token ID for offers
    const tokenId = domain.tokens[0].tokenId;

    const offers = await subgraphClient.getOffers({
      tokenId,
      take: Number(take),
      skip: Number(skip),
    });

    // Cache for 2 minutes
    await cacheManager.set(cacheKey, offers, 120);

    res.json({
      success: true,
      data: offers,
      pagination: {
        take: Number(take),
        skip: Number(skip),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
