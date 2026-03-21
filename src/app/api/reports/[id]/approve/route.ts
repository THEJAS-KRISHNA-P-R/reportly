import { NextRequest, NextResponse } from 'next/server';
import { approveReport, getReportById } from '@/lib/db/repositories/reportRepo';
import { getAgencyById } from '@/lib/db/repositories/agencyRepo';
import { getClientById } from '@/lib/db/repositories/clientRepo';
import { sendReportEmail } from '@/lib/modules/email/resend';
import { getReportEmailHtml } from '@/lib/modules/email/templates/reportEmail';
import { createSupabaseServerClient } from '@/lib/db/client';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const agencyId = (user.user_metadata as any).agency_id;
  if (!agencyId) return NextResponse.json({ error: 'Agency not found' }, { status: 400 });

  try {
    // 1. Approve report in DB
    const report = await approveReport(reportId, agencyId, user.id);
    
    // 2. Fetch related data
    const agency = await getAgencyById(agencyId);
    const client = await getClientById(report.client_id, agencyId);
    
    if (!agency || !client) {
      throw new Error('Agency or Client not found');
    }

    if (!client.report_emails || client.report_emails.length === 0) {
      throw new Error('Client has no report emails configured');
    }

    // 3. Prepare and Send Email
    const downloadUrl = report.pdf_url || `https://app.reportly.app/reports/${reportId}`;
    const html = getReportEmailHtml(report, agency, downloadUrl);
    
    await sendReportEmail(
      client.report_emails,
      `Your Performance Report - ${new Date(report.period_start).toLocaleDateString()}`,
      html,
      agency.name
    );

    await createAuditLog(reportId, agencyId, 'email_sent', { recipients: client.report_emails });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await createAuditLog(reportId, agencyId, 'email_failed', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
