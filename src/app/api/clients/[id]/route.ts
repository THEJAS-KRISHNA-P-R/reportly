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
      .select('*, api_connections(*)')
      .eq('id', id)
      .eq('agency_id', agencyId)
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const { id } = await params;
    const supabase = createSupabaseServiceClient();

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('agency_id', agencyId);

    if (error) throw error;
    
    return apiOk({ success: true });
  } catch (err: any) {
    logger.error({ err }, 'Client detail DELETE failed');
    return fromUnknownError(err, 'Failed to delete client');
  }
}
