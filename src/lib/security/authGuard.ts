import type { Agency } from '@/types/report';
import { ReportlyError } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/db/client';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedContext {
  userId: string;
  agencyId: string;
  agency: Agency;
  role: 'admin' | 'member';
  user: any;
}

/**
 * Authenticate and authorize an incoming request.
 * Returns the authenticated agency context or throws.
 *
 * Uses service client for the agency_users lookup because RLS
 * policies may block cross-table lookups via the anon key session.
 *
 * @throws ReportlyError 'UNAUTHORIZED' if no valid session
 * @throws ReportlyError 'FORBIDDEN' if user has no agency or role
 */
export async function getAuthenticatedAgency(
  input?: Request | SupabaseClient
): Promise<AuthenticatedContext> {
  // 1. Resolve Supabase Client
  let serverClient: SupabaseClient;
  if (!input || input instanceof Request || 'nextUrl' in (input as any)) {
    serverClient = await createSupabaseServerClient();
  } else {
    serverClient = input as SupabaseClient;
  }

  // 2. Validate session (Check for header from proxy.ts first to avoid redundant network call)
  // SECURITY: Always verify with getUser() for critical state changes or tenant access.
  const { data: { user: authUser }, error: authError } = await serverClient.auth.getUser();
  
  if (authError || !authUser) {
    logger.error({ authError }, '[authGuard] Unauthorized access attempt');
    throw new ReportlyError('UNAUTHORIZED', 'No valid session', 'Please log in to continue.', 401);
  }
  
  const user = authUser;
  const userId = authUser.id;

  logger.info({ userId }, '[authGuard] Processing authentication for user');

  // 3. Look up agency_user AND and agency in a single JOIN query (consolidated lookup)
  const db = createSupabaseServiceClient();
  const requestedAgencyId = input instanceof Request ? input.headers.get('x-agency-id') : null;
  
  let query = db
    .from('agency_users')
    .select(`
      agency_id,
      role,
      agencies (*)
    `)
    .eq('email', user.email)
    .is('agencies.deleted_at', null);

  // If we are on a subdomain, explicitly check for that agency bond
  if (requestedAgencyId) {
    query = query.eq('agency_id', requestedAgencyId);
  }

  const { data, error: dbError } = await query.maybeSingle();

  if (dbError || !data || !data.agencies) {
    logger.warn({ userId, dbError }, '[authGuard] User context lookup failed (missing agency or or role)');
    throw new ReportlyError(
      'FORBIDDEN',
      `Insufficient permissions for user ${userId}`,
      'Your account is not properly associated with an active agency.',
      403
    );
  }

  const agency = data.agencies as any;

  // SECURITY RULE 1: Subdomain ≠ Trust. Verify session agency matches requested subdomain.
  if (requestedAgencyId && agency.id !== requestedAgencyId) {
    logger.error({ userId, sessionAgencyId: agency.id, requestedAgencyId }, '[authGuard] Subdomain spoofing detected!');
    throw new ReportlyError(
      'FORBIDDEN',
      'Cross-tenant access denied',
      'You do not have permission to access this agency subdomain.',
      403
    );
  }

  logger.info({ userId, agencyId: agency.id }, '[authGuard] Identity verified (optimized path)');

  return {
    userId,
    agencyId: agency.id as string,
    agency: agency as Agency,
    role: data.role as 'admin' | 'member',
    user,
  };
}
