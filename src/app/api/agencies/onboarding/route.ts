import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';

export async function POST(request: NextRequest) {
  try {
    const { agencyId } = await getAuthenticatedAgency(request);
    const supabase = await createSupabaseServerClient();

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Agency name is required' }, { status: 400 });
    }

    // Update agency name
    const { error } = await supabase
      .from('agencies')
      .update({ 
        name: body.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', agencyId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Onboarding completed' });
  } catch (err: any) {
    console.error('[Onboarding POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to complete onboarding' }, { status: 500 });
  }
}
