import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { apiOk, fromUnknownError } from '@/lib/api-contract';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role to bypass RLS in webhook
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    if (type === 'email.delivered' || type === 'email.bounced' || type === 'email.delivery_delayed') {
      const newStatus = type === 'email.delivered' ? 'delivered' : 'failed';
      const emailId = data.email_id;

      if (!emailId) {
        return apiOk({ received: true, skip: 'No email_id in payload' });
      }

      // 1. Update the report_emails row directly via resend_id
      const { data: emailRecord } = await supabase
        .from('report_emails')
        .update({ status: newStatus })
        .eq('resend_id', emailId)
        .select('report_id')
        .single();

      // 2. Cascade back to the primary report if found
      if (emailRecord?.report_id) {
        // Only update if it's currently 'sent', so we don't accidentally overwrite 'failed' with another event
        await supabase
          .from('reports')
          .update({ status: newStatus })
          .eq('id', emailRecord.report_id)
          .eq('status', 'sent');
      }
    }

    return apiOk({ received: true });
  } catch (err: any) {
    return fromUnknownError(err, 'Resend webhook failed');
  }
}
