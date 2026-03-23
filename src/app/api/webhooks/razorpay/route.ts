import { createServerClient } from '@supabase/ssr';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { cookies } from 'next/headers';
import { apiError, apiOk, fromUnknownError } from '@/lib/api-contract';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') as string;

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return apiError('VALIDATION_ERROR', 'Invalid Webhook Signature', 400);
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    if (event === 'subscription.charged') {
      const sub_id = payload.payload.subscription.entity.id;
      // Mark active
      await supabase.from('agency_billing').update({ billing_status: 'active' }).eq('razorpay_sub_id', sub_id);
    } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const sub_id = payload.payload.subscription.entity.id;
      // Mark cancelled
      await supabase.from('agency_billing').update({ billing_status: 'cancelled', plan_id: 'free' }).eq('razorpay_sub_id', sub_id);
      
      // We would also downgrade the agency limits here by fetching the agency_id via the billing record
      const { data: billing } = await supabase.from('agency_billing').select('agency_id').eq('razorpay_sub_id', sub_id).single();
      if (billing?.agency_id) {
        await supabase.from('agencies').update({ plan_report_limit: 2 }).eq('id', billing.agency_id);
      }
    }

    return apiOk({ received: true });
  } catch (err: any) {
    return fromUnknownError(err, 'Webhook Handler Failed');
  }
}
