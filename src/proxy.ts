import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { securityHeaders } from '@/lib/security/headers';
import { rateLimiters, checkRateLimit } from '@/lib/security/rateLimit';
import { isOnboardingComplete } from '@/lib/security/onboardingGuard';

/**
 * Next.js 16 Proxy (formerly middleware).
 * - File must be named proxy.ts (not middleware.ts)
 * - Exported function MUST be named 'proxy'
 * - Runs on Node.js runtime
 *
 * Responsibilities:
 * 1. Apply security headers to every response
 * 2. Rate limit per route
 * 3. Enforce IP allowlist for /api/admin
 * 4. Auth guard — redirect unauthenticated users to /login
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Apply security headers to the response
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 2. Bypass auth for public routes
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/auth/callback',
    '/api/auth',
    '/api/oauth',
    '/api/webhooks',
    '/_next',
    '/favicon.ico',
  ];
  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // 3. IP allowlist for admin routes
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
    const allowlist = (process.env.ADMIN_IP_ALLOWLIST ?? '127.0.0.1').split(',').map((s) => s.trim());
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    if (!allowlist.includes(ip)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Rate limit admin
    const { allowed } = await checkRateLimit(rateLimiters.admin, ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  // 4. Rate limiting by route type
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  if (pathname.startsWith('/api/oauth')) {
    const { allowed } = await checkRateLimit(rateLimiters.oauth, ip);
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  } else if (pathname === '/login' || pathname.startsWith('/api/auth/login')) {
    const { allowed } = await checkRateLimit(rateLimiters.login, ip);
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  } else if (pathname === '/register' || pathname.startsWith('/api/auth/register')) {
    const { allowed } = await checkRateLimit(rateLimiters.register, ip);
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 5. Skip auth check for public paths
  if (isPublic) return response;

  // 6. Auth check — validate session using getUser() (not getSession())
  let isAuthenticated = false;
  let userMetadata: any = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value; },
          set(name: string, value: string, options: Record<string, unknown>) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
    userMetadata = user?.user_metadata;
  } catch {
    isAuthenticated = false;
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Onboarding check — ensure user has an agency_id AND complete profile
  const agencyId = userMetadata?.agency_id;
  
  if (agencyId && pathname.startsWith('/dashboard')) {
    const complete = await isOnboardingComplete(agencyId);
    if (!complete) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Prevent going back to onboarding if already complete
  if (agencyId && pathname === '/onboarding') {
    const complete = await isOnboardingComplete(agencyId);
    if (complete) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
