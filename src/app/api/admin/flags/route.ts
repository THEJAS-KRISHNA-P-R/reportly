import { requireSuperAdmin } from '@/lib/security/superAdmin';
import { getAllFeatureFlags, updateFeatureFlag } from '@/lib/db/repositories/featureFlagRepo';
import { logger } from '@/lib/utils/logger';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/db/client';

const toggleSchema = z.object({
  flagName: z.string(),
  enabled: z.boolean(),
});

/**
 * SuperAdmin GET: List all feature flags.
 */
export async function GET() {
  try {
    await requireSuperAdmin();
    const flags = await getAllFeatureFlags();
    return apiOk({ flags });
  } catch (error: any) {
    if (error?.status === 403) return apiError('FORBIDDEN', 'Access denied', 403);
    return fromUnknownError(error, 'Failed to fetch feature flags');
  }
}

/**
 * SuperAdmin PATCH: Toggle a feature flag.
 */
export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();
    const db = await createSupabaseServerClient();
    const { data: { user } } = await db.auth.getUser();

    const { flagName, enabled } = await parseJsonBody(request, toggleSchema);

    logger.warn({ flagName, enabled, admin: user?.email }, 'Admin: Toggling feature flag');
    await updateFeatureFlag(flagName, enabled, user?.id || '');

    return apiOk({ success: true, message: `Flag ${flagName} updated to ${enabled}` });
  } catch (error: any) {
    if (error?.status === 403) return apiError('FORBIDDEN', 'Access denied', 403);
    logger.error({ err: error.message }, 'Admin: Flag toggle failed');
    return fromUnknownError(error, 'Failed to update feature flag');
  }
}
