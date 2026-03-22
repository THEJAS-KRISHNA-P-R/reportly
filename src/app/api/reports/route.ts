import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getClientById } from '@/lib/db/repositories/clientRepo';
import { isConnected } from '@/lib/db/repositories/connectionRepo';
import { createReport } from '@/lib/db/repositories/reportRepo';
import { createJob } from '@/lib/db/repositories/jobRepo';
import { checkReportLimit, incrementReportCount } from '@/lib/utils/limits';

const generateReportSchema = z.object({
  clientId: z.string().uuid(),
  periodStart: z.string().transform((val) => new Date(val)),
  periodEnd: z.string().transform((val) => new Date(val)),
});

export async function GET(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = createSupabaseServiceClient();

    const { data: reports, error } = await supabase
      .from('reports')
      .select('*, clients!inner(name, agency_id)')
      .eq('clients.agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(reports);
  } catch (err: any) {
    console.error('[Reports GET] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    
    // 2. Validate request body
    const bodyRaw = await request.json();
    const result = generateReportSchema.safeParse(bodyRaw);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body', details: result.error.format() }, { status: 400 });
    }
    const { clientId, periodStart, periodEnd } = result.data;

    // 3. Check usage limits
    const allowed = await checkReportLimit(null, agencyId);
    if (!allowed) {
      return NextResponse.json({ 
        error: 'limit_reached', 
        message: 'Monthly report limit reached. Please upgrade your plan.' 
      }, { status: 403 });
    }

    // 4. Check client ownership
    const client = await getClientById(clientId, agencyId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found or unauthorized' }, { status: 403 });
    }

    // 5. Check GA4 connection status
    const ga4Connected = await isConnected(clientId, 'ga4');
    if (!ga4Connected) {
      return NextResponse.json({ error: 'ga4_not_connected', message: 'GA4 is not connected for this client' }, { status: 400 });
    }

    // 6. Create report record (Status is 'pending' initially)
    const report = await createReport(clientId, agencyId, periodStart, periodEnd);

    // 7. Insert into job_queue
    const job = await createJob({
      job_type: 'generate_report',
      agency_id: agencyId,
      client_id: clientId,
      report_id: report.id,
      payload: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
    });

    // 8. Increment report count
    await incrementReportCount(null, agencyId);

    // 9. Return immediately
    return NextResponse.json({
      success: true,
      reportId: report.id,
      jobId: job.id,
      status: 'queued'
    });

  } catch (err: any) {
    console.error('[Reports POST] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to trigger report generation' },
      { status: 500 }
    );
  }
}
