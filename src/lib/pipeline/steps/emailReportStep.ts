import { PipelineContext } from '../pipeline';
import { logger } from '@/lib/utils/logger';
import { Resend } from 'resend';
import { getAgencyById } from '@/lib/db/repositories/agencyRepo';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function emailReportStep(context: PipelineContext): Promise<void> {
  if (!context.reportId || !context.agencyId) return;

  try {
    const agency = await getAgencyById(context.agencyId);
    if (!agency || !agency.email) {
        logger.warn({ agencyId: context.agencyId }, 'Agency email not found for notification');
        return;
    }

    // Only send if not in mock mode (or always send in mock mode? 
    // Usually mock mode shouldn't spam emails, but for proof of work we can log it).
    if (context.mock) {
      logger.info({ to: agency.email }, '[MOCK] Agency notification email would be sent');
      return;
    }

    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY missing, skipping email notification');
      return;
    }

    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports/${context.reportId}`;

    await resend.emails.send({
      from: 'Reportly <reports@mg.reportly.ai>', // Update with verified domain
      to: agency.email,
      subject: `New Report Draft Ready: ${context.period.label}`,
      html: `
        <h1>Report Ready for Review</h1>
        <p>A new report has been generated for your client.</p>
        <p><strong>Period:</strong> ${context.period.label}</p>
        <p><a href="${reportUrl}">Click here to review and approve the report.</a></p>
      `
    });

    logger.info({ reportId: context.reportId, to: agency.email }, 'Agency notification email sent');
  } catch (error: any) {
    logger.error({ err: error.message, reportId: context.reportId }, 'Email Notification Step Failed');
    // Non-critical path
  }
}
