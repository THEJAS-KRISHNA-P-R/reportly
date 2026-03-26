import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin: rawOrigin } = new URL(request.url);
  
  // Sanitize origin: replace bind address 0.0.0.0 with localhost for browseable redirects
  const origin = rawOrigin.includes('0.0.0.0') ? rawOrigin.replace('0.0.0.0', 'localhost') : rawOrigin;
  
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
      let { data: profile } = await supabaseAdmin
        .from('agency_users')
        .select('agency:agencies(subdomain, id)')
        .eq('email', session.user.email)
        .maybeSingle();

      // NEW USER PROVISIONING: If no agency link exists, create a shadow/shell agency 
      // This allows the user to pass security guards (getAuthenticatedAgency) during onboarding.
      if (!profile) {
        console.log('[AuthRoute] Provisioning shell agency for new user:', session.user.email);
        
        // a. Create the shell agency
        const { data: newAgency, error: agencyError } = await supabaseAdmin
          .from('agencies')
          .insert({ name: 'New Agency' })
          .select()
          .single();
        
        if (agencyError) throw agencyError;

        // b. Link the user to the agency as 'admin' with onboarding_completed = false
        const { error: linkError } = await supabaseAdmin
          .from('agency_users')
          .insert({
            agency_id: newAgency.id,
            email: session.user.email,
            role: 'admin',
            onboarding_completed: false,
          });
        
        if (linkError) throw linkError;

        // Update profile variable for subsequent logic
        profile = { agency: { subdomain: null, id: newAgency.id }, onboarding_completed: false } as any;
      }

      // Check onboarding_completed status
      let onboardingCompleted = (profile as any)?.onboarding_completed;
      if (onboardingCompleted === undefined) {
        // Fetch it explicitly if not in the initial query
        const { data: auRow } = await supabaseAdmin
          .from('agency_users')
          .select('onboarding_completed')
          .eq('email', session.user.email)
          .maybeSingle();
        onboardingCompleted = auRow?.onboarding_completed ?? false;
      }

      const subdomain = (profile?.agency as any)?.subdomain;
      
      // We recognize localhost, 127.0.0.1, and 0.0.0.0 as local origins
      const isLocalHost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('0.0.0.0');

      // Route to correct destination based on onboarding status
      if (!onboardingCompleted) {
        console.log('[AuthRoute] Onboarding incomplete, redirecting to /onboarding');
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      if (subdomain && isLocalHost) {
        const targetUrl = new URL(`http://${subdomain}.lvh.me:3000/auth/callback`);
        targetUrl.hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=recovery`;
        
        console.log('[AuthRoute] Redirecting to subdomain:', targetUrl.toString());
        return NextResponse.redirect(targetUrl);
      }

      console.log('[AuthRoute] Redirecting to:', next);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('[AuthRoute] Exchange failed:', error);
    }
  }

  // Fallback
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
