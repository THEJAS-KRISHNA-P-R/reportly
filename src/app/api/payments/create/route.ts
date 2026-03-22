import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createOrder } from '@/lib/payments/razorpay';

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agencyId = user.user_metadata?.agency_id || user.app_metadata?.agency_id || 
                    (await supabase.from('agencies').select('id').eq('owner_id', user.id).single())?.data?.id;

    if (!agencyId) return NextResponse.json({ error: 'Agency not found' }, { status: 404 });

    const { plan_id, amount } = await request.json();

    if (!['pro', 'agency'].includes(plan_id)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Receipt ID tracking format: agencyId|plan_id|timestamp
    const receiptId = `${agencyId.substring(0,8)}|${plan_id}|${Date.now()}`;
    
    // Create Razorpay Order
    const order = await createOrder(amount, receiptId);

    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err: any) {
    console.error('Payment Create Error:', err);
    return NextResponse.json({ error: 'Failed to create pre-payment order' }, { status: 500 });
  }
}
