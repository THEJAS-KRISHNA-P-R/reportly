import { createSupabaseServiceClient } from '@/lib/db/client';
import type { Agency } from '@/types/report';
import { handleDbError } from './_base';

/**
 * Agency repository.
 * IMPORTANT: Always uses service client — RLS blocks agency reads otherwise
 * because the JWT contains agency_id but the agencies table checks id directly.
 */

export async function getAgencyById(agencyId: string): Promise<Agency | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .is('deleted_at', null)
    .maybeSingle(); // .maybeSingle() returns null instead of error when not found
  if (error) handleDbError(error, 'getAgencyById');
  return data as Agency | null;
}

export async function getAgencyUserByEmail(email: string) {
  const db = createSupabaseServiceClient();
    const { data, error } = await db
      .from('agency_users')
      .select(`
        id,
        agency_id,
        email,
        "role",
        is_active,
        agencies (
          id,
          name,
          brand_color,
          plan
        )
      `)
      .eq('email', email)
      .is('is_active', true)
      .maybeSingle();
  return data;
}

export async function updateAgency(
  agencyId: string,
  updates: Partial<Pick<Agency, 'name' | 'logo_url' | 'brand_color'>>
): Promise<Agency> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('agencies')
    .update(updates)
    .eq('id', agencyId)
    .select()
    .maybeSingle();
  if (error) handleDbError(error, 'updateAgency');
  if (!data) throw new Error('Agency not found');
  return data as Agency;
}
