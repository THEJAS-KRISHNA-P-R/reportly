import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/modules/analytics/ga4/oauth';
import { createSupabaseServerClient } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  // State should include clientId to associate the callback with the right client
  // In a real app, sign the state to prevent tampering
  const state = JSON.stringify({ clientId, userId: user.id });
  const authUrl = await getAuthUrl(Buffer.from(state).toString('base64'));

  return NextResponse.redirect(authUrl);
}
