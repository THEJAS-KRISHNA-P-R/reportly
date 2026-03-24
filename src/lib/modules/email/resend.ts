import { Resend } from 'resend';
import { withRetry } from '@/lib/utils/retry';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_DOMAIN = process.env.RESEND_FROM_DOMAIN || 'reports.reportly.app';

export async function sendReportEmail(
  to: string[],
  subject: string,
  html: string,
  agencyName: string
) {
  return await CircuitBreaker.execute('email', async () => {
    return await withRetry(async () => {
      const { data, error } = await resend.emails.send({
        from: `${agencyName} <no-reply@${FROM_DOMAIN}>`,
        to,
        subject,
        html,
      });

      if (error) {
        throw new Error(`Resend Error: ${error.message}`);
      }

      return data;
    }, 'email', 'Send Report Email');
  });
}
