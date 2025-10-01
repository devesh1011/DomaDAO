import { describe, it, expect } from '@jest/globals';
import { cacheManager, CacheKeys } from '../src/cache/manager';

describe('Cache Manager', () => {
  it('should set and get value', async () => {
    const key = 'test-key';
    const value = { foo: 'bar' };

    await cacheManager.set(key, value, 60);
    const retrieved = await cacheManager.get(key);

    expect(retrieved).toEqual(value);

    await cacheManager.delete(key);
  });

  it('should return null for non-existent key', async () => {
    const value = await cacheManager.get('non-existent');
    expect(value).toBeNull();
  });

  it('should use getOrSet pattern', async () => {
    const key = 'test-get-or-set';
    const value = { data: 'test' };

    const result = await cacheManager.getOrSet(key, async () => value, 60);

    expect(result).toEqual(value);

    // Should get from cache
    const cached = await cacheManager.get(key);
    expect(cached).toEqual(value);

    await cacheManager.delete(key);
  });

  it('should generate correct cache keys', () => {
    expect(CacheKeys.pool('0x123')).toBe('pool:0x123');
    expect(CacheKeys.domain('test.eth')).toBe('domain:test.eth');
    expect(CacheKeys.votes('0xabc')).toBe('votes:0xabc');
  });
});
