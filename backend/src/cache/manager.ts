import { redis } from './redis.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export class CacheManager {
  private defaultTTL: number;

  constructor(defaultTTL: number = config.cache.ttl) {
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error, key }, 'Error getting from cache');
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const expiresIn = ttl || this.defaultTTL;
      
      await redis.setex(key, expiresIn, serialized);
    } catch (error) {
      logger.error({ error, key }, 'Error setting cache');
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Error deleting from cache');
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Error deleting pattern from cache');
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Error checking cache existence');
      return false;
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetcher();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      logger.error({ error, key }, 'Error incrementing cache');
      return 0;
    }
  }

  /**
   * Set with expiry at specific timestamp
   */
  async setExpireAt(key: string, value: any, timestamp: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized);
      await redis.expireat(key, timestamp);
    } catch (error) {
      logger.error({ error, key }, 'Error setting cache with expiry');
    }
  }
}

export const cacheManager = new CacheManager();

// Cache key builders
export const CacheKeys = {
  pool: (address: string) => `pool:${address}`,
  poolList: () => 'pools:list',
  contributions: (poolAddress: string) => `contributions:${poolAddress}`,
  userContributions: (userAddress: string) => `user:${userAddress}:contributions`,
  votes: (poolAddress: string) => `votes:${poolAddress}`,
  votingResults: (poolAddress: string) => `voting:${poolAddress}:results`,
  distribution: (poolAddress: string, distId: number) => `distribution:${poolAddress}:${distId}`,
  userClaimable: (userAddress: string, poolAddress: string) => `claimable:${userAddress}:${poolAddress}`,
  domain: (name: string) => `domain:${name}`,
  domainListings: (name: string) => `listings:${name}`,
  domainOffers: (name: string) => `offers:${name}`,
};
