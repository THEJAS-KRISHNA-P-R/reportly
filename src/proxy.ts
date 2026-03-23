import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPolicyDecision, getRouteGroup, resolveUserRole } from '@/lib/security/routePolicy';

const CRON_PATHS  = ['/api/cron'];

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const routeGroup = getRouteGroup(pathname);

  // Cron routes — verify Vercel cron secret
  if (CRON_PATHS.some(p => pathname.startsWith(p))) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  // Static assets — pass through immediately
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Public APIs are always allowed and should not incur auth lookup latency.
  if (routeGroup === 'public-api') {
    return applySecurityHeaders(NextResponse.next());
  }

  // Initialize Supabase to grab the current user state
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  let userEmail: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // Fail-safe behavior: allow public/auth pages, protect everything else.
    if (routeGroup === 'public-page' || routeGroup === 'auth-page') {
      return applySecurityHeaders(response);
    }
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
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
    return applySecurityHeaders(response);
  }

  if (decision.action === 'forbidden') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const url = new URL(decision.redirectTo ?? '/login', request.url);
  if (decision.includeRedirectParam) {
    url.searchParams.set('redirect', pathname);
  }
  return applySecurityHeaders(NextResponse.redirect(url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
