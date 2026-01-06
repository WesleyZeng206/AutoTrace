import { CacheService } from '../cache';

describe('CacheService', () => {
  const mockClient = () => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
    ping: jest.fn(),
    on: jest.fn(),
  });

  let redis: ReturnType<typeof mockClient>;
  let cache: CacheService;

  beforeAll(() => {
    process.env.REDIS_ENABLED = 'true';
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  beforeEach(() => {
    redis = mockClient();
    cache = new CacheService(redis as any, true);
    cache.resetStats();
  });

  describe('get', () => {
    it('returns data when key exists', async () => {
      const data = { foo: 'bar', count: 42 };
      redis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cache.get('test-key');

      expect(result).toEqual(data);
      expect(redis.get).toHaveBeenCalledWith('test-key');
      expect(cache.getStats().hits).toBe(1);
      expect(cache.getStats().misses).toBe(0);
    });

    it('returns null when key does not exist', async () => {
      redis.get.mockResolvedValue(null);
      const result = await cache.get('missing-key');

      expect(result).toBeNull();
      expect(cache.getStats().misses).toBe(1);
    });

    it('handles redis errors', async () => {
      redis.get.mockRejectedValue(new Error('Redis connection error'));
      const result = await cache.get('error-key');

      expect(result).toBeNull();
      expect(cache.getStats().errors).toBe(1);
    });

    it('returns null if caching disabled', async () => {
      cache = new CacheService(undefined, false);
      const result = await cache.get('test-key');

      expect(result).toBeNull();
      expect(redis.get).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('stores data without expiry', async () => {
      const user = { userId: 123, name: 'Test User' };
      redis.set.mockResolvedValue('OK');

      await cache.set('user:123', user);

      expect(redis.set).toHaveBeenCalledWith('user:123', JSON.stringify(user));
      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('stores data with TTL', async () => {
      const session = { session: 'abc123' };
      redis.setex.mockResolvedValue('OK');

      await cache.set('session:abc', session, 3600);

      expect(redis.setex).toHaveBeenCalledWith('session:abc', 3600, JSON.stringify(session));
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('handles write errors', async () => {
      redis.set.mockRejectedValue(new Error('Write error'));
      await cache.set('error-key', { data: 'test' });
      expect(cache.getStats().errors).toBe(1);
    });

    it('does nothing when disabled', async () => {
      cache = new CacheService(undefined, false);
      await cache.set('test-key', { data: 'test' });

      expect(redis.set).not.toHaveBeenCalled();
      expect(redis.setex).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('deletes a key', async () => {
      redis.del.mockResolvedValue(1);
      await cache.invalidate('stats:team:123');
      expect(redis.del).toHaveBeenCalledWith('stats:team:123');
    });

    it('handles delete errors', async () => {
      redis.del.mockRejectedValue(new Error('Delete error'));
      await cache.invalidate('error-key');
      expect(cache.getStats().errors).toBe(1);
    });

    it('does nothing when disabled', async () => {
      cache = new CacheService(undefined, false);
      await cache.invalidate('test-key');
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidatePattern', () => {
    it('deletes all matching keys', async () => {
      redis.scan
        .mockResolvedValueOnce(['10', ['stats:team:1', 'stats:team:2']])
        .mockResolvedValueOnce(['0', ['stats:team:3']]);
      redis.del.mockResolvedValue(3);

      await cache.invalidatePattern('stats:team:*');

      expect(redis.scan).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenCalledWith('stats:team:1', 'stats:team:2', 'stats:team:3');
    });

    it('handles empty results', async () => {
      redis.scan.mockResolvedValue(['0', []]);
      await cache.invalidatePattern('nonexistent:*');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('handles scan errors', async () => {
      redis.scan.mockRejectedValue(new Error('Scan error'));
      await cache.invalidatePattern('error:*');
      expect(cache.getStats().errors).toBe(1);
    });

    it('disabled cache skips scan', async () => {
      cache = new CacheService(undefined, false);
      await cache.invalidatePattern('test:*');
      expect(redis.scan).not.toHaveBeenCalled();
    });
  });

  describe('ping', () => {
    it('returns true when connected', async () => {
      redis.ping.mockResolvedValue('PONG');
      const result = await cache.ping();

      expect(result).toBe(true);
      expect(redis.ping).toHaveBeenCalled();
    });

    it('returns false on error', async () => {
      redis.ping.mockRejectedValue(new Error('Connection error'));
      expect(await cache.ping()).toBe(false);
    });

    it('returns false when disabled', async () => {
      cache = new CacheService(undefined, false);
      expect(await cache.ping()).toBe(false);
      expect(redis.ping).not.toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('tracks hits misses and errors', async () => {
      redis.get.mockResolvedValueOnce(JSON.stringify({ data: 1 }));
      redis.get.mockResolvedValueOnce(null);
      redis.get.mockRejectedValueOnce(new Error('Error'));

      await cache.get('hit');
      await cache.get('miss');
      await cache.get('error');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.errors).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.5, 2);
    });

    it('calculates hit rate', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ data: 1 }));

      await cache.get('key1');
      await cache.get('key2');
      await cache.get('key3');

      expect(cache.getStats().hitRate).toBe(1.0);
    });

    it('returns 0 hit rate when no requests', () => {
      expect(cache.getStats().hitRate).toBe(0);
    });

    it('resets stats', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ data: 1 }));
      await cache.get('key');

      cache.resetStats();
      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.errors).toBe(0);
    });
  });

  describe('concurrent ops', () => {
    it('handles parallel gets', async () => {
      redis.get
        .mockResolvedValueOnce(JSON.stringify({ id: 1 }))
        .mockResolvedValueOnce(JSON.stringify({ id: 2 }))
        .mockResolvedValueOnce(null);

      const results = await Promise.all([
        cache.get('key1'),
        cache.get('key2'),
        cache.get('key3'),
      ]);

      expect(results).toEqual([{ id: 1 }, { id: 2 }, null]);
      expect(cache.getStats().hits).toBe(2);
      expect(cache.getStats().misses).toBe(1);
    });

    it('set then get works', async () => {
      const data = { metrics: [1, 2, 3] };
      redis.setex.mockResolvedValue('OK');
      redis.get.mockResolvedValue(JSON.stringify(data));

      await cache.set('metrics:123', data, 300);
      const result = await cache.get('metrics:123');

      expect(result).toEqual(data);
      expect(cache.getStats().hits).toBe(1);
    });
  });
});
