import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { createClient } from '@/lib/db/repositories/clientRepo';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { agencyId, user } = await getAuthenticatedAgency(request);
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    const { agencyName, clientName, clientWebsite, ga4PropertyId } = body;

    if (!agencyName || !clientName || !clientWebsite) {
      return NextResponse.json({ error: 'Missing required onboarding fields' }, { status: 400 });
    }

    logger.info({ agencyId, userId: user.id }, '[Onboarding] Starting comprehensive setup');

    // 1. Update agency name
    const { error: agencyError } = await supabase
      .from('agencies')
      .update({ 
        name: agencyName,
        updated_at: new Date().toISOString()
      })
      .eq('id', agencyId);

    if (agencyError) throw agencyError;

    // 2. Create the first client
    const client = await createClient(agencyId, {
      name: clientName,
      contact_email: user.email,
      report_emails: [user.email],
      schedule_day: 1, // Default to 1st of the month
      timezone: 'UTC',
    });

    // 3. Create initial GA4 connection record (Status: disconnected until OAuth)
    if (ga4PropertyId) {
      const { error: connError } = await supabase
        .from('api_connections')
        .insert({
          client_id: client.id,
          platform: 'ga4',
          account_id: ga4PropertyId,
          status: 'disconnected',
        });
      
      if (connError) throw connError;
    }

    logger.info({ agencyId, clientId: client.id }, '[Onboarding] Setup completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      clientId: client.id 
    });
  } catch (err: any) {
    logger.error({ err }, '[Onboarding POST] Unexpected failure');
    return NextResponse.json({ 
      error: err.message || 'Failed to complete onboarding. Please try again or contact support.' 
    }, { status: 500 });
  }
}
