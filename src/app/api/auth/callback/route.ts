import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map(c => c.name);

  console.log('[AuthRoute] Handling callback.', { 
    code: code ? 'present' : 'absent', 
    next, 
    origin,
    cookies: allCookies 
  });

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && session) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // 3. Find the user's agency subdomain in ONE query (Relational Join)
      const { data: profile } = await supabaseAdmin
        .from('agency_users')
        .select('agency:agencies(subdomain)')
        .eq('email', session.user.email)
        .maybeSingle();

      const subdomain = (profile?.agency as any)?.subdomain;
      
      // We recognize localhost, 127.0.0.1, and 0.0.0.0 as local origins
      const isLocalHost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('0.0.0.0');

      if (subdomain && isLocalHost) {
        const targetUrl = new URL(`http://${subdomain}.lvh.me:3000/auth/callback`);
        targetUrl.hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=recovery`;
        
        console.log('[AuthRoute] Redirecting to subdomain:', targetUrl.toString());
        return NextResponse.redirect(targetUrl);
      }

      // If no subdomain found, they likely need to onboard
      const finalNext = subdomain ? next : '/onboarding';
      console.log('[AuthRoute] Redirecting to:', finalNext);
      return NextResponse.redirect(`${origin}${finalNext}`);
    } else {
      console.error('[AuthRoute] Exchange failed:', error);
    }
  }

  // Fallback
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
