import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { createClient } from '@/lib/db/repositories/clientRepo';
import { markOnboardingComplete } from '@/lib/security/onboardingGuard';
import { logger } from '@/lib/utils/logger';

/**
 * Generate a URL-safe subdomain slug from an agency name.
 * Rules: lowercase, alphanumeric + hyphens, 3-50 chars, no leading/trailing hyphens.
 */
function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')        // Trim leading/trailing hyphens
    .slice(0, 50)                   // Max 50 chars
    || 'agency';                    // Fallback
}

/**
 * Acquire a Redis lock for onboarding to prevent double-submit race conditions.
 * Returns a release function if lock acquired, null if someone else holds it.
 */
async function acquireOnboardingLock(email: string): Promise<(() => Promise<void>) | null> {
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const lockKey = `lock:onboarding:${email}`;
    const acquired = await redis.set(lockKey, '1', { nx: true, ex: 30 }); // 30s TTL

    if (!acquired) return null;

    return async () => {
      await redis.del(lockKey);
    };
  } catch (err) {
    logger.error({ err }, '[Onboarding] Redis lock acquisition failed, proceeding without lock');
    return async () => {}; // No-op release
  }
}

export async function POST(request: NextRequest) {
  let releaseLock: (() => Promise<void>) | null = null;
  
  try {
    const { agencyId, user } = await getAuthenticatedAgency(request);
    
    // Acquire Redis lock to prevent double-submit
    releaseLock = await acquireOnboardingLock(user.email);
    if (!releaseLock) {
      return NextResponse.json(
        { error: 'Onboarding already in progress. Please wait.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { agencyName, clientName, clientWebsite, ga4PropertyId } = body;

    if (!agencyName || !clientName || !clientWebsite) {
      return NextResponse.json({ error: 'Missing required onboarding fields' }, { status: 400 });
    }

    logger.info({ agencyId, userId: user.id }, '[Onboarding] Starting comprehensive setup');

    // Use service client for all writes (RLS bypass for onboarding provisioning)
    const db = createSupabaseServiceClient();

    // 1. Generate and validate subdomain
    let subdomain = generateSubdomain(agencyName);
    
    // Check uniqueness, append suffix if taken
    const { data: existing } = await db
      .from('agencies')
      .select('id')
      .eq('subdomain', subdomain)
      .neq('id', agencyId)
      .maybeSingle();

    if (existing) {
      // Append random 4-char suffix
      const suffix = Math.random().toString(36).slice(2, 6);
      subdomain = `${subdomain}-${suffix}`;
    }

    // 2. Update agency with name + subdomain
    const { error: agencyError } = await db
      .from('agencies')
      .update({ 
        name: agencyName,
        subdomain,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agencyId);

    if (agencyError) throw agencyError;

    // 3. Create the first client
    const client = await createClient(agencyId, {
      name: clientName,
      contact_email: user.email,
      report_emails: [user.email],
      schedule_day: 1,
      timezone: 'UTC',
    });

    // 4. Create initial GA4 connection record
    if (ga4PropertyId) {
      const { error: connError } = await db
        .from('api_connections')
        .insert({
          client_id: client.id,
          agency_id: agencyId,
          platform: 'ga4',
          account_id: ga4PropertyId,
          access_token_enc: 'pending_oauth',
          refresh_token_enc: 'pending_oauth',
          status: 'disconnected',
        });
      
      if (connError) throw connError;
    }

    // 5. Mark onboarding as complete (also invalidates Redis cache)
    await markOnboardingComplete(user.email);

    // 6. Cache subdomain → agency_id in Redis for fast proxy lookups
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.set(`subdomain:${subdomain}`, agencyId, { ex: 3600 });
    } catch (err) {
      logger.warn({ err }, '[Onboarding] Redis subdomain cache failed (non-fatal)');
    }

    logger.info({ agencyId, clientId: client.id, subdomain }, '[Onboarding] Setup completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      clientId: client.id,
      subdomain,
    });
  } catch (err: any) {
    logger.error({ err }, '[Onboarding POST] Unexpected failure');
    return NextResponse.json({ 
      error: err.message || 'Failed to complete onboarding. Please try again or contact support.' 
    }, { status: 500 });
  } finally {
    // Always release the lock
    if (releaseLock) await releaseLock();
  }
}
