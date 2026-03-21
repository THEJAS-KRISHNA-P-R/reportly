import { createSupabaseServerClient } from '@/lib/db/client';
import { ReportlyError } from '@/types/errors';

/**
 * Check if an email belongs to a Super Admin.
 */
export function isSuperAdmin(email: string): boolean {
  return email === process.env.SUPER_ADMIN_EMAIL;
}

/**
 * Enforce Super Admin access for a request.
 * Throws a ReportlyError if the user is not a super admin.
 */
export async function requireSuperAdmin(): Promise<void> {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  
  if (!user || !isSuperAdmin(user.email!)) {
    throw ReportlyError.forbidden('Super admin access required');
  }
}
