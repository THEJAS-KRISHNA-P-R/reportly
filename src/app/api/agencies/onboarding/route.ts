import { NextResponse } from 'next/server';
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/db/client';
import { getAuthenticatedAgency } from '@/lib/security/authGuard';
import { validateInput, onboardingSchema } from '@/lib/validators/inputValidator';

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { agencyId } = await getAuthenticatedAgency(supabase);
    const body = await request.json();
    const input = validateInput(onboardingSchema, body);
    
    const db = createSupabaseServiceClient();
    const { error } = await db
      .from('agencies')
      .update({
        name: input.name,
        brand_color: input.brand_color ?? '#1E3A5F',
        logo_url: input.logo_url ?? null,
      })
      .eq('id', agencyId);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update agency profile' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}
