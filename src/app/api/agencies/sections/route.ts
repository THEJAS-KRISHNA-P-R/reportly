import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
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

    const { data: sections, error } = await supabase
      .from('report_sections')
      .select('*')
      .eq('agency_id', agencyId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(sections);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const { sections } = await request.json(); // Expected to be an array of section objects
    
    // Upsert sections to update their sort_order, enabled status, or custom_title
    const { error } = await supabase
      .from('report_sections')
      .upsert(
        sections.map((s: any) => ({
          id: s.id,
          agency_id: agencyId,
          name: s.name,
          section_type: s.section_type,
          enabled: s.enabled,
          sort_order: s.sort_order,
          custom_title: s.custom_title,
          custom_content: s.custom_content
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
