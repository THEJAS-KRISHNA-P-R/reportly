import { createSupabaseServiceClient } from '@/lib/db/client';
import type { Agency, AgencyUser } from '@/types/report';
import { ReportlyError } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

export interface AuthenticatedContext {
  userId: string;
  agencyId: string;
  agency: Agency;
  role: 'admin' | 'member';
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
  serverClient: Awaited<ReturnType<typeof import('@/lib/db/client').createSupabaseServerClient>>
): Promise<AuthenticatedContext> {
  // Validate the Supabase session cookie
  const {
    data: { user },
    error: authError,
  } = await serverClient.auth.getUser(); // never use getSession() — not validated

  if (authError || !user) {
    throw new ReportlyError(
      'UNAUTHORIZED',
      'No valid session',
      'Please log in to continue.',
      401
    );
  }

  const userId = user.id;

  // Look up the agency_user using service client (bypasses RLS)
  const db = createSupabaseServiceClient();
  const { data } = await db
    .from('agency_users')
    .select('agency_id, role')
    .eq('id', userId)
    .limit(1)
    .maybeSingle();

  if (!data || !data.agency_id) {
    logger.warn({ userId }, 'User has no associated agency');
    throw new ReportlyError(
      'FORBIDDEN',
      `No agency found for user ${user.id}`,
      'Your account is not associated with an agency.',
      403
    );
  }

  const agencyUser = data;

  // Look up the full agency record
  const { data: agency } = await db
    .from('agencies')
    .select('*')
    .eq('id', agencyUser.agency_id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!agency) {
    throw new ReportlyError(
      'FORBIDDEN',
      `Agency ${agencyUser.agency_id} not found or inactive`,
      'Your agency account is not active.',
      403
    );
  }

  return {
    userId: user.id,
    agencyId: agencyUser.agency_id as string,
    agency: agency as Agency,
    role: (agencyUser as AgencyUser).role,
  };
}
