import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getDLQEntries } from '@/lib/db/repositories/jobRepo';
import { apiError, apiOk } from '@/lib/api-contract';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.SUPER_ADMIN_EMAIL) {
    return apiError('FORBIDDEN', 'Forbidden', 403);
  }

  try {
    const dlq_jobs = await getDLQEntries(50);
    return apiOk({ dlq_jobs });
  } catch (err) {
    console.error("DLQ fetch failed (table may not exist):", err);
    return apiOk({ dlq_jobs: [] });
  }
}
