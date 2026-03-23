import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

  // Placeholder for global feature flags managed by superadmin
  return apiOk({
    flags: {
      enable_ai_narrative: true,
      enable_pdf_export: true,
      maintenance_mode: false,
    }
  });
}
