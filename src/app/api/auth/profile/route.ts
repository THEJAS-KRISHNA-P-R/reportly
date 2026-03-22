import { createSupabaseServerClient } from '@/lib/db/client';
import { getAgencyUserByEmail } from '@/lib/db/repositories/agencyRepo';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const profile = await getAgencyUserByEmail(user.email!);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ error: 'Internal Server Error', profile: null }, { status: 500 });
  }
}

