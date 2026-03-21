import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/db/client';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const { type, data } = payload;

  if (!type || !data || !data.email_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const db = createSupabaseServiceClient();

  try {
    let status: string | null = null;
    if (type === 'email.delivered') status = 'delivered';
    if (type === 'email.opened') status = 'opened';
    if (type === 'email.bounced') status = 'bounce';
    if (type === 'email.complained') status = 'spam';

    if (status) {
      const { error } = await db
        .from('report_emails')
        .update({ 
           status: status as any,
           delivered_at: status === 'delivered' ? new Date().toISOString() : undefined,
           opened_at: status === 'opened' ? new Date().toISOString() : undefined,
           bounced_at: status === 'bounce' ? new Date().toISOString() : undefined,
        })
        .eq('provider_id', data.email_id);

      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    logger.error({ err: err.message, emailId: data.email_id }, 'Resend Webhook Processing Failed');
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
