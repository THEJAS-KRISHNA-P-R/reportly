import { createSupabaseServiceClient } from '@/lib/db/client';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { apiError, apiOk, fromUnknownError } from '@/lib/api-contract';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') as string;

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return apiError('VALIDATION_ERROR', 'Invalid Webhook Signature', 400);
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.account_id + '_' + payload.created_at + '_' + payload.event; // SOTA: Better use account-level event IDs if available
    const event = payload.event;
    
    // 1. Idempotency Check (Redis)
    const exists = await redis.get(`webhook:rzp:${eventId}`);
    if (exists) {
      logger.info({ eventId, event }, 'Webhook already processed. Skipping.');
      return apiOk({ received: true, duplicate: true });
    }

    const supabase = createSupabaseServiceClient(); // Use Service Role for backend writes

    logger.info({ event, id: payload.payload?.subscription?.entity?.id }, 'Processing Razorpay Webhook');

    if (event === 'subscription.charged') {
      const sub_id = payload.payload.payment.entity.subscription_id;
      await supabase.from('agency_billing').update({ 
        billing_status: 'active',
        last_payment_at: new Date().toISOString()
      }).eq('razorpay_sub_id', sub_id);
    } 
    else if (event === 'payment.failed') {
      const sub_id = payload.payload.payment.entity.subscription_id;
      if (sub_id) {
        await supabase.from('agency_billing').update({ 
          billing_status: 'past_due' 
        }).eq('razorpay_sub_id', sub_id);
      }
    }
    else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const sub_id = payload.payload.subscription.entity.id;
      
      // Downgrade workflow
      const { data: billing } = await supabase
        .from('agency_billing')
        .update({ billing_status: 'cancelled', plan_id: 'free' })
        .eq('razorpay_sub_id', sub_id)
        .select('agency_id')
        .single();

      if (billing?.agency_id) {
        await supabase.from('agencies').update({ 
          plan_report_limit: 2, // Reset to baseline MVP limit
          is_active: event === 'subscription.halted' ? false : true // Halt blocks all access
        }).eq('id', billing.agency_id);
      }
    }

    // 2. Mark as processed for 24h
    await redis.set(`webhook:rzp:${eventId}`, 'processed', 'EX', 86400);

    return apiOk({ received: true });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Razorpay Webhook critical failure');
    return fromUnknownError(err, 'Webhook Handler Failed');
  }
}
