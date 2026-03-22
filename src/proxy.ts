import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PUBLIC_PATHS = [
  '/',
  '/pricing',
  '/about',
  '/login',
  '/register',
  '/auth',
  '/api/auth',
  '/api/webhooks',
  '/api/payments/verify',
  '/api/oauth/ga4',      // Added
  '/api/oauth/ga4/callback', // Added
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

const ADMIN_PATHS = ['/admin', '/api/admin'];
const CRON_PATHS  = ['/api/cron'];

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    return NextResponse.next();
  }

  // Initialize Supabase to grab the current user state
  let response = NextResponse.next({
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
  
  const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));

  // --- 1. SUPER ADMIN ROUTING ---
  if (user && user.email === process.env.SUPER_ADMIN_EMAIL) {
    if (!isAdminPath && !pathname.startsWith('/api/')) {
      // Force Super Admin to /admin if they try to access /, /dashboard, /login, etc.
      return applySecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
    }
    // Protect production admin paths by IP allowlist
    if (isAdminPath && process.env.NODE_ENV === 'production') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
      const allowed = (process.env.ADMIN_IP_ALLOWLIST ?? '').split(',');
      if (!allowed.includes(ip)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    return applySecurityHeaders(response);
  }

  // --- 2. NORMAL USER ROUTING ---
  if (user) {
    if (isAdminPath) {
      return new NextResponse('Forbidden', { status: 403 }); // Normal users cannot access admin
    }
    // Authenticated users trying to access auth or home pages get pushed to their dashboard
    if (pathname === '/login' || pathname === '/register' || pathname === '/') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }
    return applySecurityHeaders(response);
  }

  // --- 3. UNAUTHENTICATED ROUTING ---
  if (!user) {
    if (isPublic) {
      return applySecurityHeaders(response); // Guests can view landing page and auth pages
    }
    // Guests on protected routes get pushed to login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
