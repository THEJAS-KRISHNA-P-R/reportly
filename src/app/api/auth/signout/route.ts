import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const cookieStore = await cookies();

  // 1. Sign out via Supabase (invalidates server-side session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();

  // 2. Invalidate Redis session + onboarding cache
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Find and delete all session cache keys for this user
    const authCookie = cookieStore.getAll().find(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );
    if (authCookie) {
      const cacheKey = `sess:${authCookie.value.slice(-20)}`;
      await redis.del(cacheKey);
    }

    // Get user email before clearing to nuke onboarding/tenant caches
    const userEmail = cookieStore.get('x-user-email')?.value;
    if (userEmail) {
      await redis.del(`onboard:${userEmail}`);
      // Tenant caches will naturally expire (5 min TTL)
    }
  } catch (err) {
    console.error('[Signout] Redis cleanup error (non-fatal):', err);
  }

  // 3. Nuclear cookie clearing — destroy ALL Supabase auth cookies
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter(
    (c) => c.name.startsWith('sb-') || c.name.includes('supabase')
  );

  const response = NextResponse.redirect(`${origin}/login`, {
    status: 303,
  });

  // Set aggressive cache-control to prevent back-button access
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');

  // Explicitly expire every Supabase cookie
  for (const cookie of supabaseCookies) {
    response.cookies.set(cookie.name, '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return response;
}
