import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Server component client — reads cookies for the user session.
 * Used in API routes and server components that need the user's RLS context.
 * NOTE: This client is READ-ONLY for cookies — use only for reading data.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Service role client — bypasses RLS entirely.
 * Use ONLY in:
 * - Background workers (no user session)
 * - Audit log writes
 * - Agency lookup (RLS blocks otherwise)
 * - Any server-side job that doesn't have a user session
 *
 * NEVER use in API routes that handle user requests directly.
 * NEVER expose to client components.
 */
export function createSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
