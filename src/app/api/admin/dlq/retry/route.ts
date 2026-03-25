import { requireSuperAdmin } from '@/lib/security/superAdmin';
import { retryJobFromDLQ } from '@/lib/db/repositories/jobRepo';
import { logger } from '@/lib/utils/logger';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/db/client';

const retrySchema = z.object({
  entryId: z.string().uuid(),
});

/**
 * SuperAdmin endpoint to retry a job from the DLQ.
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    await requireSuperAdmin();
    const db = await createSupabaseServerClient();
    const { data: { user } } = await db.auth.getUser();

    // 2. Parse payload
    const { entryId } = await parseJsonBody(request, retrySchema);

    // 3. Execute retry
    logger.info({ entryId, admin: user?.email }, 'Admin: Retrying job from DLQ');
    await retryJobFromDLQ(entryId, user?.email || 'admin');

    return apiOk({ success: true, message: 'Job successfully re-queued' });
  } catch (error: any) {
    if (error?.status === 403) return apiError('FORBIDDEN', 'Access denied', 403);
    logger.error({ err: error.message }, 'Admin: DLQ retry failed');
    return fromUnknownError(error, 'Failed to retry job');
  }
}
