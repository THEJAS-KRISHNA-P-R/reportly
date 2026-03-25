import { requireSuperAdmin } from '@/lib/security/superAdmin';
import { redis } from '@/lib/redis';
import { reportQueue } from '@/lib/queue/client';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';
import { apiOk, fromUnknownError } from '@/lib/api-contract';

/**
 * SuperAdmin health check endpoint. 
 * Performs live pings to all infrastructure components.
 */
export async function GET() {
  try {
    await requireSuperAdmin();

    const start = Date.now();
    const supabase = createSupabaseServiceClient();

    // 1. Parallel Infrastructure Check
    const [redisPing, dbCheck, queueCounts] = await Promise.all([
      redis.ping().catch(() => 'DOWN'),
      supabase.from('agencies').select('id').limit(1).then(({ error }) => error ? 'DOWN' : 'UP'),
      reportQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
    ]);

    const latency = Date.now() - start;

    return apiOk({
      status: redisPing === 'PONG' && dbCheck === 'UP' ? 'HEALTHY' : 'DEGRADED',
      latency_ms: latency,
      infrastructure: {
        redis: redisPing === 'PONG' ? 'UP' : 'DOWN',
        postgres: dbCheck,
      },
      queue: {
        name: reportQueue.name,
        waiting: queueCounts.waiting,
        active: queueCounts.active,
        completed: queueCounts.completed,
        failed: queueCounts.failed,
        delayed: queueCounts.delayed,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error({ err: error.message }, 'Admin: Health check failed');
    return fromUnknownError(error, 'System health check failed');
  }
}
