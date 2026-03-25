import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { apiError, apiOk, fromUnknownError } from '@/lib/api-contract';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select('*, api_connections(*), reports(*)')
      .eq('id', id)
      .eq('agency_id', agencyId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !client) {
      return apiError('NOT_FOUND', 'Client not found', 404);
    }

    return apiOk(client);
  } catch (err: any) {
    logger.error({ err }, 'Client detail GET failed');
    return fromUnknownError(err, 'Failed to fetch client');
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    // Parse the body manually instead of strict Zod for generic updates
    const body = await request.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.contact_email !== undefined) updateData.contact_email = body.contact_email;
    if (body.schedule_day !== undefined) updateData.schedule_day = body.schedule_day;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.report_emails !== undefined) updateData.report_emails = body.report_emails;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('agency_id', agencyId)
      .is('deleted_at', null)
      .select()
      .maybeSingle();

    if (error || !data) {
      return apiError('NOT_FOUND', 'Client not found or unauthorized', 404);
    }

    return apiOk(data);
  } catch (err: any) {
    logger.error({ err }, 'Client detail PATCH failed');
    return fromUnknownError(err, 'Failed to update client');
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    // Soft delete to preserve historical reports and metrics
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
      .eq('agency_id', agencyId);

    if (error) throw error;
    
    return apiOk({ success: true });
  } catch (err: any) {
    logger.error({ err }, 'Client detail DELETE failed');
    return fromUnknownError(err, 'Failed to delete client');
  }
}

