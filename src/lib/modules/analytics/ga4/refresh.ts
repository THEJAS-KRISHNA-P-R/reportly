import { createSupabaseServiceClient } from '@/lib/db/client';
import { encrypt, decrypt } from '@/lib/security/encryption';

export async function refreshGA4Token(clientId: string): Promise<string> {
  const db = createSupabaseServiceClient();

  const { data: conn } = await db
    .from('api_connections')
    .select('id, refresh_token_enc')
    .eq('client_id', clientId)
    .eq('platform', 'ga4')
    .maybeSingle();

  if (!conn) throw new Error('No GA4 connection found');

  const refreshToken = decrypt(conn.refresh_token_enc);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    await db.from('api_connections')
      .update({ status: 'error', last_error: 'Token refresh failed' })
      .eq('id', conn.id);
    throw new Error('Token refresh failed: ' + JSON.stringify(data));
  }

  const newAccessTokenEnc = encrypt(data.access_token);

  await db.from('api_connections').update({
    access_token_enc: newAccessTokenEnc,
    token_expires_at: new Date(
      Date.now() + (data.expires_in ?? 3600) * 1000
    ).toISOString(),
    status:           'connected',
    last_synced_at:   new Date().toISOString(),
    last_error:       null,
  }).eq('id', conn.id);

  return data.access_token;
}
