import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const maxDuration = 300; // 5 mins

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Call the RPC defined in Phase 0 to safely zero-out counts
    const { error } = await supabase.rpc('reset_monthly_counts');

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Monthly report counts reset successfully via RPC' 
    });
  } catch (err: any) {
    console.error('CRON Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
