import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { securityHeaders } from '@/lib/security/headers';
import { getPolicyDecision, getRouteGroup, resolveUserRole } from '@/lib/security/routePolicy';

const CRON_PATHS  = ['/api/cron'];

function applySecurityHeaders(res: NextResponse, hostname: string = ''): NextResponse {
  // Disable security headers on lvh.me in development to avoid HMR/Hydration issues
  if (process.env.NODE_ENV !== 'production' && (hostname.includes('lvh.me') || hostname.includes('localhost'))) {
    return res;
  }
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) return true; 
  
  const expectedOrigin = new URL(siteUrl).origin;
  
  if (origin && origin !== expectedOrigin) {
    // Standardize local origins
    const isLocal = origin.includes('localhost') || origin.includes('lvh.me') || origin.includes('127.0.0.1');
    if (isLocal) return true;
    return false;
  }

  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== expectedOrigin) return false;
    } catch {
      return false;
    }
  }
  
  return true;
}

let upstashRedis: any = null;

async function getUpstashRedis() {
  if (!upstashRedis) {
    const { Redis } = await import('@upstash/redis');
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return upstashRedis;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const hostname = request.headers.get('host') || '';

  // --- SUBDOMAIN MULTITENANCY (SOTA) ---
  let subdomain = '';
  if (hostname.includes('lvh.me')) {
    const parts = hostname.split('.');
    if (parts.length > 2) subdomain = parts[0];
  } else if (!hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  }

  let agencyIdBySubdomain: string | null = null;
  if (subdomain && subdomain !== 'www') {
    const redis = await getUpstashRedis();
    const cacheKey = `subdomain:${subdomain}`;
    agencyIdBySubdomain = await redis.get(cacheKey);

    if (!agencyIdBySubdomain) {
      // Background Supabase client (using service role for verification)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (error || !data) {
        console.warn(`[Proxy] Invalid subdomain: ${subdomain}`);
        return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)), hostname);
      }

      agencyIdBySubdomain = data.id;
      await redis.set(cacheKey, agencyIdBySubdomain, { ex: 3600 });
    }
  }

  // CSRF Protection for API Writes
  if (pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!isValidOrigin(request)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  const routeGroup = getRouteGroup(pathname);

  // Cron routes — verify Vercel cron secret
  if (CRON_PATHS.some(p => pathname.startsWith(p))) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  // Static assets and dev resources — pass through immediately without proxy overhead or tight CSP
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/assets/') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/icon.svg' ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // Public APIs are always allowed and should not incur auth lookup latency.
  if (routeGroup === 'public-api') {
    return applySecurityHeaders(NextResponse.next(), hostname);
  }

  // Initialize Supabase to grab the current user state
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          const isLvh = hostname.includes('lvh.me');
          const domain = isLvh ? '.lvh.me' : `.${hostname.split('.').slice(-2).join('.')}`;
          
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, domain })
          );
        },
      },
    }
  );

  let user: any = null;
  let userEmail: string | null = null;

  try {
    // --- REDIS CACHE INTEGRATION (SOTA OPTIMIZATION) ---
    // Dynamic cookie lookup: find the first supabase auth token cookie
    const authCookie = cookieStore.getAll().find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
    const cacheKey = `sess:${authCookie?.value?.slice(-20) || 'anon'}`;

    const redis = await getUpstashRedis();

    if (method === 'GET' && cacheKey !== 'sess:anon') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        user = cached;
        // console.log('[Middleware] Cache Hit:', cacheKey);
      }
    }

    if (!user) {
      // Optimization: Use getSession for GET requests to avoid network round-trip to Supabase
      // for every polling request. Use getUser for state-changing methods for security.
      if (method === 'GET') {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user ?? null;
        
        // Cache session for 60 seconds to prevent auth spam (30+ requests/min fix)
        if (user && cacheKey !== 'sess:anon') {
          await redis.set(cacheKey, user, { ex: 60 });
        }
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
        // Invalidate cache on write for safety
        if (cacheKey !== 'sess:anon') await redis.del(cacheKey);
      }
    }
    
    userEmail = user?.email ?? null;
  } catch (err) {
    console.error('[Middleware] Auth check failed:', err);
  }

  if (!user) {
    // Fail-safe behavior: allow public/auth pages, protect everything else.
    if (routeGroup === 'public-page' || routeGroup === 'auth-page') {
      return applySecurityHeaders(NextResponse.next());
    }
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return applySecurityHeaders(NextResponse.redirect(url), hostname);
  }

  const role = resolveUserRole(userEmail, process.env.SUPER_ADMIN_EMAIL);

  // Super-admin production IP allowlist for admin surface.
  if (role === 'super_admin' && process.env.NODE_ENV === 'production') {
    if (routeGroup === 'admin-page' || routeGroup === 'admin-api') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
      const allowed = (process.env.ADMIN_IP_ALLOWLIST ?? '').split(',');
      if (!allowed.includes(ip)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  const decision = getPolicyDecision(pathname, role);

  if (decision.action === 'allow') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');
    
    if (subdomain) requestHeaders.set('x-agency-subdomain', subdomain);
    if (agencyIdBySubdomain) requestHeaders.set('x-agency-id', agencyIdBySubdomain);

    return applySecurityHeaders(NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }), hostname);
  }

  if (decision.action === 'forbidden') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const url = new URL(decision.redirectTo ?? '/login', request.url);
  if (decision.includeRedirectParam) {
    url.searchParams.set('redirect', pathname);
  }
  return applySecurityHeaders(NextResponse.redirect(url), hostname);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
