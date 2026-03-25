import Redis from 'ioredis';
import { logger } from './utils/logger';
import * as dotenv from 'dotenv';

// Ensure env vars are loaded before evaluating constants
dotenv.config({ path: '.env.local' });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisManager {
  private static instance: Redis;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisManager.instance) {
      RedisManager.instance = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, // Critical for BullMQ
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      RedisManager.instance.on('error', (err) => {
        const isLocalhost = REDIS_URL.includes('localhost') || REDIS_URL.includes('127.0.0.1');
        if (isLocalhost && (err as any).code === 'ECONNREFUSED') {
          logger.error('Redis connection failed on localhost. Ensure local Redis is running OR provide REDIS_URL in .env (e.g., for Upstash).');
        } else {
          logger.error({ err }, 'Redis connection error');
        }
      });

      RedisManager.instance.on('connect', () => {
        logger.info('Successfully connected to Redis');
      });
    }

    return RedisManager.instance;
  }
}

export const redis = RedisManager.getInstance();
