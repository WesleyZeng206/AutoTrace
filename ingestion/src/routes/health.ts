import express from 'express';
import { cacheService } from '../services/cache';
import { storageService } from '../services/storage';

const router = express.Router();

router.get('/', async (req, res) => {
  const redisHealthy = await cacheService.ping();

  let dbHealthy = false;

  try {
    await storageService.pool.query('SELECT 1');
    dbHealthy = true;
  } catch {

  }

  const cacheStats = cacheService.getStats();

  res.json({
    status: dbHealthy ? 'healthy' : 'degraded',
    database: dbHealthy,
    redis: redisHealthy,
    cache: cacheStats,
  });
});

export default router;
