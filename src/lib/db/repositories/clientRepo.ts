import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/db/client';
import type { Client, CreateClientInput, UpdateClientInput } from '@/types/report';
import { handleDbError } from './_base';

/**
 * Get all active clients for an agency.
 * Always scopes by agency_id first, then filters soft-deleted records.
 */
export async function getClientsByAgency(agencyId: string): Promise<Client[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('agency_id', agencyId) // agency scope — always first
    .is('deleted_at', null)    // active only
    .order('created_at', { ascending: false });
  if (error) handleDbError(error, 'getClientsByAgency');
  return (data ?? []) as Client[];
}

/**
 * Get a single client by ID, scoped to the agency.
 * Returns null for both "not found" and "wrong agency" — prevents enumeration.
 */
export async function getClientById(clientId: string, agencyId: string): Promise<Client | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('agency_id', agencyId) // ALWAYS double-scope: id + agency_id
    .is('deleted_at', null)
    .maybeSingle();
  if (error) return null; // not found → null, not throw
  return data as Client | null;
}

export async function createClient(agencyId: string, input: CreateClientInput): Promise<Client> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('clients')
    .insert({ ...input, agency_id: agencyId }) // agency_id from session, not user input
    .select()
    .single();
  if (error) handleDbError(error, 'createClient');
  return data as Client;
}

export async function updateClient(
  clientId: string,
  agencyId: string,
  input: UpdateClientInput
): Promise<Client> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('clients')
    .update(input)
    .eq('id', clientId)
    .eq('agency_id', agencyId) // never skip agency scope on mutations
    .select()
    .single();
  if (error) handleDbError(error, 'updateClient');
  return data as Client;
}

export async function softDeleteClient(clientId: string, agencyId: string): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('clients')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', clientId)
    .eq('agency_id', agencyId); // never skip agency scope on mutations
  if (error) handleDbError(error, 'softDeleteClient');
}

/**
 * Used by the cron job — uses service role (bypasses RLS intentionally).
 * Fetches all active clients scheduled for a specific day of the month.
 */
export async function getClientsScheduledForDay(day: number): Promise<Client[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('clients')
    .select('*, agencies!inner(id, name, logo_url, brand_color)')
    .eq('schedule_day', day)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (error) handleDbError(error, 'getClientsScheduledForDay');
  return (data ?? []) as unknown as Client[];
}
