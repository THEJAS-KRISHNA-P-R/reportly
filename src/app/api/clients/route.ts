import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { checkClientLimit } from '@/lib/utils/limits';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';
import { createClientSchema } from '@/lib/validators/inputValidator';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient(); // RLS bypass for listing if needed

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*, api_connections(status, platform)')
      .eq('agency_id', agencyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return apiOk(clients ?? []);
  } catch (err: any) {
    logger.error({ err }, 'Clients GET failed');
    return fromUnknownError(err, 'Failed to list clients');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient(); // Use service role for INSERT bypass

    // Validate limit
    const canCreate = await checkClientLimit(supabase, agencyId);
    if (!canCreate) {
      return apiError('LIMIT_REACHED', 'Client limit reached. Please upgrade your plan.', 403);
    }

    const body = await parseJsonBody(request, createClientSchema);

    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        agency_id:     agencyId,
        name:          body.name,
        contact_email: body.contact_email,
        report_emails: body.report_emails || [],
        schedule_day:  body.schedule_day || 1,
        timezone:      body.timezone || 'Asia/Kolkata',
        is_active:     true,
      })
      .select()
      .single();

    if (insertError) {
      logger.error({ err: insertError }, 'Clients POST insert failed');
      throw insertError;
    }
    
    return apiOk(client);
  } catch (err: any) {
    logger.error({ err }, 'Clients POST failed');
    return fromUnknownError(err, 'Failed to create client');
  }
}
