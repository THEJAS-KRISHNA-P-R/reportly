import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RATE_LIMITS } from '@/lib/constants';

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function parseDuration(durationStr: string): Parameters<typeof Ratelimit.slidingWindow>[1] {
  // Convert our constant strings to Upstash format
  const map: Record<string, Parameters<typeof Ratelimit.slidingWindow>[1]> = {
    '15m': '15 m',
    '1h': '1 h',
    '1m': '1 m',
  };
  return map[durationStr] as Parameters<typeof Ratelimit.slidingWindow>[1];
}

// Pre-configured rate limiters for each route group
export const rateLimiters = {
  login: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.LOGIN_MAX, parseDuration(RATE_LIMITS.LOGIN_WINDOW)),
    prefix: 'rl:login',
  }),
  register: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.REGISTER_MAX, parseDuration(RATE_LIMITS.REGISTER_WINDOW)),
    prefix: 'rl:register',
  }),
  oauth: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.OAUTH_MAX, parseDuration(RATE_LIMITS.OAUTH_WINDOW)),
    prefix: 'rl:oauth',
  }),
  reportTrigger: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.REPORT_TRIGGER_MAX, parseDuration(RATE_LIMITS.REPORT_TRIGGER_WINDOW)),
    prefix: 'rl:report',
  }),
  api: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.API_GENERAL_MAX, parseDuration(RATE_LIMITS.API_GENERAL_WINDOW)),
    prefix: 'rl:api',
  }),
  admin: new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.ADMIN_MAX, parseDuration(RATE_LIMITS.ADMIN_WINDOW)),
    prefix: 'rl:admin',
  }),
};

/**
 * Check a rate limit for a given identifier (e.g., IP address).
 * Returns true if the request is allowed, false if rate limited.
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  // Bypass rate limits entirely for local development
  if (process.env.NODE_ENV !== 'production') {
    return { allowed: true, remaining: 999, reset: 0 };
  }

  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
