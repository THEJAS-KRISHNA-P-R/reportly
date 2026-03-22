import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServiceClient } from '@/lib/db/client';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseAdmin = createSupabaseServiceClient();

  try {
    const [
      { count: active }, 
      { count: queued }, 
      { count: completed }, 
      { count: failed }
    ] = await Promise.all([
      supabaseAdmin.from('job_queue').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
      supabaseAdmin.from('job_queue').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
      supabaseAdmin.from('job_queue').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('job_queue').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    return NextResponse.json({
      active: active ?? 0,
      waiting: queued ?? 0,
      completed: completed ?? 0,
      failed: failed ?? 0
    });
  } catch (err) {
    console.error("Queue fetch failed (table may not exist):", err);
    return NextResponse.json({ active: 0, waiting: 0, completed: 0, failed: 0 });
  }
}
