import { createSupabaseServiceClient } from '@/lib/db/client';
import type { ApiConnection } from '@/types/report';
import type { Platform } from '@/types/metrics';
import { encrypt, decrypt } from '@/lib/security/encryption';
import { handleDbError } from './_base';

/**
 * Connection repository.
 * IMPORTANT: Encrypt before storing, decrypt only here in repo.
 * Tokens are NEVER passed in plaintext outside this file.
 */

export async function getConnection(
  clientId: string,
  platform: Platform
): Promise<(ApiConnection & { access_token: string; refresh_token: string }) | null> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('api_connections')
    .select('*')
    .eq('client_id', clientId)
    .eq('platform', platform)
    .eq('status', 'connected')
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    access_token: decrypt(data.access_token_enc),   // decrypt here, in repo
    refresh_token: decrypt(data.refresh_token_enc),  // never pass encrypted tokens to modules
  } as ApiConnection & { access_token: string; refresh_token: string };
}

export async function getConnectionsByClient(clientId: string): Promise<ApiConnection[]> {
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('api_connections')
    .select('id, client_id, platform, account_id, account_name, status, last_synced_at, last_error, token_expires_at, created_at, updated_at')
    .eq('client_id', clientId);
  if (error) handleDbError(error, 'getConnectionsByClient');
  return (data ?? []) as ApiConnection[];
}

export async function upsertConnection(
  clientId: string,
  platform: Platform,
  tokens: { accessToken: string; refreshToken: string; expiresAt?: Date },
  meta: { accountId: string; accountName: string; scopes: string[] }
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db.from('api_connections').upsert(
    {
      client_id: clientId,
      platform,
      access_token_enc: encrypt(tokens.accessToken),  // encrypt here, in repo
      refresh_token_enc: encrypt(tokens.refreshToken), // before it ever touches the DB
      token_expires_at: tokens.expiresAt?.toISOString() ?? null,
      account_id: meta.accountId,
      account_name: meta.accountName,
      scopes_granted: meta.scopes,
      status: 'connected',
      last_error: null,
    },
    { onConflict: 'client_id,platform' }
  );
  if (error) handleDbError(error, 'upsertConnection');
}

export async function markConnectionDisconnected(
  clientId: string,
  platform: Platform,
  errorMessage?: string
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('api_connections')
    .update({
      status: 'disconnected',
      last_error: errorMessage?.slice(0, 500) ?? null,
    })
    .eq('client_id', clientId)
    .eq('platform', platform);
  if (error) handleDbError(error, 'markConnectionDisconnected');
}

export async function markConnectionError(
  clientId: string,
  platform: Platform,
  errorMessage: string
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('api_connections')
    .update({ status: 'error', last_error: errorMessage.slice(0, 500) })
    .eq('client_id', clientId)
    .eq('platform', platform);
  if (error) handleDbError(error, 'markConnectionError');
}

export async function updateLastSynced(clientId: string, platform: Platform): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db
    .from('api_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('platform', platform);
  if (error) handleDbError(error, 'updateLastSynced');
}

export async function isConnected(clientId: string, platform: Platform): Promise<boolean> {
  const db = createSupabaseServiceClient();
  const { data } = await db
    .from('api_connections')
    .select('status')
    .eq('client_id', clientId)
    .eq('platform', platform)
    .maybeSingle();
  return data?.status === 'connected';
}
