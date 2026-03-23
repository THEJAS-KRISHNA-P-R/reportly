import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createOrder } from '@/lib/payments/razorpay';
import { apiError, apiOk, fromUnknownError, parseJsonBody } from '@/lib/api-contract';

const paymentCreateSchema = z.object({
  plan_id: z.enum(['pro', 'agency']),
  amount: z.number().positive(),
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

    const { plan_id, amount } = await parseJsonBody(request, paymentCreateSchema);

    // Receipt ID tracking format: agencyId|plan_id|timestamp
    const receiptId = `${agencyId.substring(0,8)}|${plan_id}|${Date.now()}`;
    
    // Create Razorpay Order
    const order = await createOrder(amount, receiptId);

    return apiOk({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err: any) {
    return fromUnknownError(err, 'Failed to create pre-payment order');
  }
}
