import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getClientById } from '@/lib/db/repositories/clientRepo';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;
    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Missing propertyId' }, { status: 400 });
    }
    
    // 1. Get authenticated agency
    const { agencyId } = await getAuthenticatedAgency(request);
    const db = createSupabaseServiceClient();

    // 2. Verify client ownership
    const client = await getClientById(clientId, agencyId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 403 });
    }

    // 3. Update the matching api_connection
    const { error: updateError } = await db
      .from('api_connections')
      .update({ account_id: propertyId })
      .eq('client_id', clientId)
      .eq('platform', 'ga4');

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, propertyId });

  } catch (err: any) {
    console.error('[GA4 Connection Patch] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error updating connection' },
      { status: 500 }
    );
  }
}
