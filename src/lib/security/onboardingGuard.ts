import { createSupabaseServiceClient } from '@/lib/db/client';

/**
 * Check if a user has completed the onboarding flow.
 * Uses the explicit `onboarding_completed` boolean flag on agency_users.
 * 
 * @param identifier - Either an agency_id (UUID) or email address
 * @returns true if onboarding is complete
 */
export async function isOnboardingComplete(identifier: string): Promise<boolean> {
  const db = createSupabaseServiceClient();
  
  // Determine if identifier is an email or UUID
  const isEmail = identifier.includes('@');
  
  let query = db
    .from('agency_users')
    .select('onboarding_completed')
  
  if (isEmail) {
    query = query.eq('email', identifier);
  } else {
    query = query.eq('agency_id', identifier);
  }
  
  const { data } = await query.maybeSingle();
  
  return data?.onboarding_completed === true;
}

/**
 * Mark onboarding as complete for a user.
 * Also invalidates the Redis onboarding cache.
 */
export async function markOnboardingComplete(email: string): Promise<void> {
  const db = createSupabaseServiceClient();
  
  const { error } = await db
    .from('agency_users')
    .update({ onboarding_completed: true })
    .eq('email', email);
  
  if (error) {
    throw new Error(`Failed to mark onboarding complete: ${error.message}`);
  }

  // Invalidate Redis cache so middleware picks up the change immediately
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    await redis.del(`onboard:${email}`);
  } catch (err) {
    console.error('[OnboardingGuard] Redis cache invalidation failed (non-fatal):', err);
  }
}
