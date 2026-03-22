import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

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

    const body = await request.json();
    const { to_email } = body;
    
    if (!to_email) {
      return NextResponse.json({ error: 'A recipient email is required to send a test.' }, { status: 400 });
    }

    if (process.env.FF_EMAIL_ENABLED !== 'true') {
      return NextResponse.json({ success: true, message: `FF_EMAIL_ENABLED is false. Test email blocked from dispatch to ${to_email}` });
    }

    // Retrieve branding settings
    const { data: brand } = await supabase.from('agency_branding').select('report_layout').eq('agency_id', agencyId).single();

    const { data, error } = await resend.emails.send({
      from: 'Reportly App <noreply@resend.dev>', // Needs custom domain verified in prod
      to: [to_email],
      subject: 'Reportly Customization Test Email',
      html: `<div style="font-family: sans-serif; padding: 20px;">
               <h1>Test Email Execution</h1>
               <p>Your white-label styling layout selected is: <strong>${brand?.report_layout || 'Default'}</strong></p>
               <p>If you have questions, reply to this email.</p>
             </div>`,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Test email explicitly sent to ${to_email}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
