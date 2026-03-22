import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifySignature } from '@/lib/payments/razorpay';

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

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_id } = await request.json();

    // Mathematically verify the source of the payment completion securely
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature. Payment failed.' }, { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Payment Verify Error:', err);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
