import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getDLQEntries } from '@/lib/db/repositories/jobRepo';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const dlq_jobs = await getDLQEntries(50);
    return NextResponse.json({ dlq_jobs });
  } catch (err) {
    console.error("DLQ fetch failed (table may not exist):", err);
    return NextResponse.json({ dlq_jobs: [] });
  }
}
