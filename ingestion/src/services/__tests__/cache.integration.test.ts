import { CacheService } from '../cache';

describe('CacheService Integration Tests', () => {
  let cacheService: CacheService;

  beforeAll(async () => {
    process.env.REDIS_ENABLED = 'true';
    process.env.REDIS_URL = 'redis://localhost:6379';
    cacheService = new CacheService();
    const pong = await cacheService.ping();
    if (!pong) {
      throw new Error('Redis must be running for cache integration tests');
    }
  });

  beforeEach(async () => {
    cacheService.resetStats();
    await cacheService.invalidatePattern('test:*');
  });

  afterAll(async () => {
    await cacheService.invalidatePattern('test:*');
    await cacheService.shutdown();
  });

  describe('Redis connectivity', () => {
    it('should connect to Redis and respond to ping', async () => {
      const pong = await cacheService.ping();
      expect(pong).toBe(true);
    });
  });

  describe('Basic cache operations', () => {
    it('should store and retrieve simple data', async () => {
      const testData = { message: 'Hello Redis', timestamp: Date.now() };

      await cacheService.set('test:simple', testData);
      const retrieved = await cacheService.get('test:simple');

      expect(retrieved).toEqual(testData);
    });

    it('should store and retrieve complex nested data', async () => {
      const complexData = {
        user: {id: 123,
          name: 'Test User',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        metrics: [1, 2, 3, 4, 5],
        metadata: {
          tags: ['important', 'test'],
        },
      };

      await cacheService.set('test:complex', complexData);
      const retrieved = await cacheService.get('test:complex');

      expect(retrieved).toEqual(complexData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('test:nonexistent');
      expect(result).toBeNull();
    });
  });


  describe('TTL and expiration', () => {
    it('should respect TTL and expire data', async () => {
      const testData = { value: 'temporary' };

      await cacheService.set('test:ttl', testData, 2);

      const immediate = await cacheService.get('test:ttl');
      expect(immediate).toEqual(testData);

      await new Promise(resolve => setTimeout(resolve, 2500));

      const afterExpiry = await cacheService.get('test:ttl');
      expect(afterExpiry).toBeNull();
    }, 10000);

    it('should persist data without TTL', async () => {
      const testData = { value: 'persistent' };

      await cacheService.set('test:persistent', testData);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const retrieved = await cacheService.get('test:persistent');
      expect(retrieved).toEqual(testData);
    });
  });


  describe('Cache invalidation', () => {
    it('should invalidate single key', async () => {
      const testData = { value: 'to be deleted' };

      await cacheService.set('test:delete-me', testData);
      const before = await cacheService.get('test:delete-me');
      
      expect(before).toEqual(testData);

      await cacheService.invalidate('test:delete-me');

      const after = await cacheService.get('test:delete-me');
      expect(after).toBeNull();
    });

    it('should invalidate multiple keys by pattern', async () => {
      await cacheService.set('test:team:1', { name: 'Team 1' });
      await cacheService.set('test:team:2', { name: 'Team 2' });
      await cacheService.set('test:team:3', { name: 'Team 3' });
      await cacheService.set('test:user:1', { name: 'User 1' });

      await cacheService.invalidatePattern('test:team:*');

      const team1 = await cacheService.get('test:team:1');
      const team2 = await cacheService.get('test:team:2');
      const team3 = await cacheService.get('test:team:3');
      const user1 = await cacheService.get('test:user:1');

      expect(team1).toBeNull();
      expect(team2).toBeNull();
      expect(team3).toBeNull();
      expect(user1).toEqual({ name: 'User 1' });
    });
  });

  describe('Cache statistics', () => {
    it('should track hits and misses accurately', async () => {
      cacheService.resetStats();

      await cacheService.set('test:stats:1', { value: 1 });
      await cacheService.set('test:stats:2', { value: 2 });

      await cacheService.get('test:stats:1');
      await cacheService.get('test:stats:2');
      await cacheService.get('test:stats:missing');

      const stats = cacheService.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    it('should update hit rate over time', async () => {
      cacheService.resetStats();

      await cacheService.set('test:hitrate', { value: 'test' });

      for (let i = 0; i < 10; i++) {
        await cacheService.get('test:hitrate');
      }

      for (let i = 0; i < 5; i++) {
        await cacheService.get('test:nonexistent');
      }

      const stats = cacheService.getStats();

      expect(stats.hits).toBe(10);
      expect(stats.misses).toBe(5);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });
  });


  describe('Concurrent tasks', () => {
    it('should handle concurrent writes correctly', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(cacheService.set(`test:concurrent:${i}`, { index: i }));
      }

      await Promise.all(promises);

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(await cacheService.get(`test:concurrent:${i}`));
      }

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toEqual({ index });
      });
    });

    it('should handle concurrent reads correctly', async () => {
      await cacheService.set('test:concurrent-read', { value: 'shared' });

      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(cacheService.get('test:concurrent-read'));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result).toEqual({ value: 'shared' });
      });
    });
  });


  describe('Edge cases', () => {
    it('should handle empty objects', async () => {
      await cacheService.set('test:empty-object', {});
      const result = await cacheService.get('test:empty-object');
      expect(result).toEqual({});
    });

    it('should handle empty arrays', async () => {
      await cacheService.set('test:empty-array', []);
      const result = await cacheService.get('test:empty-array');
      expect(result).toEqual([]);
    });

    it('should handle null values in objects', async () => {
      const dataWithNull = { value: null, other: 'data' };
      await cacheService.set('test:null-value', dataWithNull);
      const result = await cacheService.get('test:null-value');
      expect(result).toEqual(dataWithNull);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'test:special:key:with:colons:and-dashes_and_underscores';
      const data = { value: 'special' };

      await cacheService.set(specialKey, data);
      const result = await cacheService.get(specialKey);

      expect(result).toEqual(data);
    });


    it('should handle large data objects', async () => {

      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Data for item ${i}`,
      }));

      await cacheService.set('test:large-data', largeArray);
      const result = await cacheService.get('test:large-data');

      expect(result).toEqual(largeArray);
      expect(result).toHaveLength(1000);
    });
  });
});
