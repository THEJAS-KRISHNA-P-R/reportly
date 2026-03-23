import { createSupabaseServiceClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { getReportById, updateReportStatus } from '@/lib/db/repositories/reportRepo';
import { getClientById } from '@/lib/db/repositories/clientRepo';
import { getAgencyById } from '@/lib/db/repositories/agencyRepo';
import { createAuditLog } from '@/lib/db/repositories/auditRepo';
import { sendReportEmail } from '@/lib/modules/email/resend';
import { logger } from '@/lib/utils/logger';

import { isEnabled } from '@/lib/featureFlags';
import { FEATURE_FLAGS } from '@/lib/constants';
import { apiError, apiOk, fromUnknownError } from '@/lib/api-contract';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reportId } = await params;
    
    // 1. Get authenticated agency
    const { agencyId, userId } = await getAuthenticatedAgency(request);

    // 2. Verify report ownership
    const report = await getReportById(reportId, agencyId);
    if (!report) {
      return apiError('NOT_FOUND', 'Report not found or unauthorized', 404);
    }

    if (report.status === 'approved' || report.status === 'sent') {
       return apiError('REPORT_CONFLICT', 'Report is already approved or sent', 400);
    }

    // 3. Update status to 'approved'
    await updateReportStatus(reportId, 'approved', { approved_at: new Date().toISOString(), approved_by: userId });

    // 4. Log approval event
    await createAuditLog(reportId, agencyId, 'approval', { userId });

    // 5. Trigger email delivery if flag set
    const emailEnabled = await isEnabled(FEATURE_FLAGS.EMAIL_DELIVERY);
    
    if (emailEnabled && report.pdf_url) {
      try {
        const client = await getClientById(report.client_id, agencyId);
        const agency = await getAgencyById(agencyId);
        const supabase = createSupabaseServiceClient();
        
        if (client && client.report_emails && client.report_emails.length > 0) {
          logger.info({ reportId, recipients: client.report_emails }, 'Starting email delivery process');
          
          for (const recipient of client.report_emails) {
            // A. Create record in report_emails table
            const { data: emailRecord } = await supabase
                .from('report_emails')
                .insert({
                  report_id: reportId,
                  recipient_email: recipient,
                  status: 'pending'
                })
                .select()
                .single();

            // B. Send via Resend
            try {
              const resendResult = await sendReportEmail(
                [recipient],
                `Performance Report Approved: ${report.client_id}`,
                `<p>Your report for the period starting ${report.period_start} has been approved.</p><p><a href="${report.pdf_url}">Click here to view your PDF report</a></p>`,
                agency?.name || 'Reportly'
              );
              
              const resendId = (resendResult as any)?.id;

              // C. Update status to 'sent'
              await supabase
                  .from('report_emails')
                  .update({ 
                    status: 'sent', 
                    sent_at: new Date().toISOString(),
                    resend_id: resendId
                  })
                  .eq('id', emailRecord.id);

            } catch (sendErr: any) {
               logger.error({ err: sendErr.message, recipient }, 'Individual email send failing');
               await supabase
                   .from('report_emails')
                   .update({ status: 'failed' })
                   .eq('id', emailRecord.id);
            }
          }

          await createAuditLog(reportId, agencyId, 'email_sent', { recipients: client.report_emails });
          
          // D. Final report status: 'sent'
          await updateReportStatus(reportId, 'sent');
        }
      } catch (deliveryErr: any) {
        logger.error({ err: deliveryErr.message, reportId }, 'Batch email delivery process failed');
        await createAuditLog(reportId, agencyId, 'email_failed', { error: deliveryErr.message });
      }
    }

    return apiOk({ 
      success: true, 
      status: emailEnabled ? 'sent' : 'approved',
      message: emailEnabled ? 'Report approved and emails sent' : 'Report approved successfully'
    });

  } catch (err: any) {
    logger.error({ err: err.message }, '[Report Approval POST] Unhandled Error');
    return fromUnknownError(err, 'Failed to approve report');
  }
}
