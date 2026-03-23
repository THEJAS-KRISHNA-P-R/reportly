import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifySignature } from '@/lib/payments/razorpay';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';

const paymentVerifySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  plan_id: z.enum(['pro', 'agency']),
}).strict();

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const agencyId = user.user_metadata?.agency_id || user.app_metadata?.agency_id || 
                    (await supabase.from('agencies').select('id').eq('owner_id', user.id).single())?.data?.id;

    if (!agencyId) return apiError('NOT_FOUND', 'Agency not found', 404);

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_id } = await parseJsonBody(request, paymentVerifySchema);

    // Mathematically verify the source of the payment completion securely
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isValid) {
      return apiError('VALIDATION_ERROR', 'Invalid signature. Payment failed.', 400);
    }

    // Apply Limits
    const limits = plan_id === 'agency' ? { clients: 99999, reports: 150 } : { clients: 5, reports: 25 };

    // Update Agency Limits
    await supabase.from('agencies').update({ plan_report_limit: limits.reports }).eq('id', agencyId);
    
    // Upsert Agency Billing
    await supabase.from('agency_billing').upsert({
      agency_id: agencyId,
      plan_id: plan_id,
      billing_status: 'active',
      razorpay_customer_id: null,
      razorpay_sub_id: razorpay_order_id, // Store order_id temporarily or real sub_id if recurring
    });

    return apiOk({ success: true });
  } catch (err: any) {
    return fromUnknownError(err, 'Failed to verify payment');
  }
}
