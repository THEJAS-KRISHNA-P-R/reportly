import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getClientById } from '@/lib/db/repositories/clientRepo';
import { listGA4Properties } from '@/lib/modules/analytics/ga4/fetcher';
import { decrypt } from '@/lib/security/encryption';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;
    
    // 1. Get authenticated agency
    const { agencyId } = await getAuthenticatedAgency(request);
    const db = createSupabaseServiceClient();

    // 2. Verify client ownership
    const client = await getClientById(clientId, agencyId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 403 });
    }

    // 3. Get connection tokens
    const { data: conn, error: connError } = await db
      .from('api_connections')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', 'ga4')
      .maybeSingle();

    if (!conn || !conn.access_token_enc) {
      return NextResponse.json({ error: 'GA4 not connected for this client' }, { status: 404 });
    }

    // 4. Decrypt token and list properties
    const accessToken = decrypt(conn.access_token_enc);
    const properties = await listGA4Properties(accessToken);

    return NextResponse.json({ properties });

  } catch (err: any) {
    console.error('[GA4 Properties API] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list GA4 properties' },
      { status: err.status || 500 }
    );
  }
}
