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

  // 2. Validate session
  const { data: { user }, error: authError } = await serverClient.auth.getUser();

  if (authError || !user) {
    logger.error({ authError }, '[authGuard] Unauthorized access attempt');
    throw new ReportlyError(
      'UNAUTHORIZED',
      'No valid session',
      'Please log in to continue.',
      401
    );
  }

  const userId = user.id;
  logger.info({ userId }, '[authGuard] Authenticated user found');

  // 3. Look up the agency_user using service client (bypasses RLS)
  const db = createSupabaseServiceClient();
  const { data: agencyUserData, error: dbError } = await db
    .from('agency_users')
    .select('agency_id, "role"')
    .eq('id', userId)
    .maybeSingle();

  if (dbError || !agencyUserData || !agencyUserData.agency_id) {
    logger.warn({ userId, dbError }, '[authGuard] User has no associated agency');
    throw new ReportlyError(
      'FORBIDDEN',
      `No agency found for user ${userId}`,
      'Your account is not associated with an agency.',
      403
    );
  }

  // 4. Look up the full agency record
  const { data: agency } = await db
    .from('agencies')
    .select('*')
    .eq('id', agencyUserData.agency_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!agency) {
    logger.warn({ agencyId: agencyUserData.agency_id }, '[authGuard] Agency record missing or deleted');
    throw new ReportlyError(
      'FORBIDDEN',
      `Agency ${agencyUserData.agency_id} not found or inactive`,
      'Your agency account is not active.',
      403
    );
  }

  logger.info({ userId, agencyId: agency.id }, '[authGuard] Identity verified');

  return {
    userId,
    agencyId: agency.id as string,
    agency: agency as Agency,
    role: agencyUserData.role as 'admin' | 'member',
    user,
  };
}
