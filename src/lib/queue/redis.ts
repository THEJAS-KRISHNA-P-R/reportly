import { Redis, RedisOptions } from 'ioredis';

// Construct Redis URL from Upstash components if REDIS_URL is missing
const getRedisConfig = (): { url: string; options: RedisOptions } => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL, options: { maxRetriesPerRequest: null } };
  }

  // Upstash Fallback
  const host = process.env.UPSTASH_REDIS_REST_URL?.replace('https://', '') || '127.0.0.1';
  const password = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  
  // Note: Upstash standard Redis usually uses port 6379, 
  // but if it's the REST host, we might need the actual Redis host.
  // For the MVP, we assume REDIS_URL is provided in production.
  return {
    url: `rediss://default:${password}@${host}:6379`,
    options: {
      maxRetriesPerRequest: null,
      tls: { rejectUnauthorized: false }
    }
  };
};

const config = getRedisConfig();
export const redisConnection = new Redis(config.url, config.options);

redisConnection.on('error', (err: any) => {
  console.error('Redis Connection Error:', err);
});
