export type UserRole = 'guest' | 'member' | 'super_admin';

export type RouteGroup =
  | 'cron'
  | 'static'
  | 'public-page'
  | 'auth-page'
  | 'admin-page'
  | 'admin-api'
  | 'public-api'
  | 'protected-api'
  | 'protected-page';

export type PolicyAction = 'allow' | 'redirect' | 'forbidden';

export interface PolicyDecision {
  action: PolicyAction;
  redirectTo?: string;
  includeRedirectParam?: boolean;
  reason: string;
}

export const PUBLIC_PAGE_PATHS = [
  '/',
  '/problem',
  '/how-it-works',
  '/features',
  '/pricing',
  '/about',
  '/privacy',
  '/terms',
] as const;

const AUTH_PAGE_PREFIXES = ['/login', '/register', '/auth'] as const;
const STATIC_PREFIXES = ['/_next/', '/favicon'] as const;
const PUBLIC_STATIC_FILES = ['/robots.txt', '/sitemap.xml'] as const;
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/webhooks',
  '/api/payments/verify',
  '/api/oauth/ga4',
  '/api/oauth/ga4/callback',
  '/api/reports/test',
] as const;

export const ROUTE_POLICY_MATRIX: Record<UserRole, Record<RouteGroup, PolicyDecision>> = {
  guest: {
    cron: { action: 'forbidden', reason: 'Cron is validated separately' },
    static: { action: 'allow', reason: 'Static assets are public' },
    'public-page': { action: 'allow', reason: 'Public pages are guest-accessible' },
    'auth-page': { action: 'allow', reason: 'Auth pages are guest-accessible' },
    'admin-page': {
      action: 'redirect',
      redirectTo: '/login',
      includeRedirectParam: true,
      reason: 'Guests must authenticate before admin access',
    },
    'admin-api': {
      action: 'redirect',
      redirectTo: '/login',
      includeRedirectParam: true,
      reason: 'Guests must authenticate before admin API access',
    },
    'public-api': { action: 'allow', reason: 'Public API endpoints are guest-accessible' },
    'protected-api': {
      action: 'redirect',
      redirectTo: '/login',
      includeRedirectParam: true,
      reason: 'Guests must authenticate before protected API access',
    },
    'protected-page': {
      action: 'redirect',
      redirectTo: '/login',
      includeRedirectParam: true,
      reason: 'Guests must authenticate before protected page access',
    },
  },
  member: {
    cron: { action: 'forbidden', reason: 'Cron is validated separately' },
    static: { action: 'allow', reason: 'Static assets are always accessible' },
    'public-page': { action: 'allow', reason: 'Members can access marketing pages' },
    'auth-page': {
      action: 'redirect',
      redirectTo: '/dashboard',
      reason: 'Authenticated members should use dashboard routes',
    },
    'admin-page': { action: 'forbidden', reason: 'Admin pages are restricted to super admin' },
    'admin-api': { action: 'forbidden', reason: 'Admin APIs are restricted to super admin' },
    'public-api': { action: 'allow', reason: 'Public APIs remain accessible for members' },
    'protected-api': { action: 'allow', reason: 'Members can access protected APIs' },
    'protected-page': { action: 'allow', reason: 'Members can access protected pages' },
  },
  super_admin: {
    cron: { action: 'forbidden', reason: 'Cron is validated separately' },
    static: { action: 'allow', reason: 'Static assets are always accessible' },
    'public-page': {
      action: 'redirect',
      redirectTo: '/admin',
      reason: 'Super admin should stay in admin workspace',
    },
    'auth-page': {
      action: 'redirect',
      redirectTo: '/admin',
      reason: 'Super admin auth routes redirect to admin workspace',
    },
    'admin-page': { action: 'allow', reason: 'Super admin can access admin pages' },
    'admin-api': { action: 'allow', reason: 'Super admin can access admin APIs' },
    'public-api': { action: 'allow', reason: 'Public APIs remain accessible' },
    'protected-api': { action: 'allow', reason: 'Super admin can call non-admin APIs' },
    'protected-page': {
      action: 'redirect',
      redirectTo: '/admin',
      reason: 'Super admin non-admin pages redirect to admin workspace',
    },
  },
};

export function resolveUserRole(
  userEmail: string | null | undefined,
  superAdminEmail: string | null | undefined
): UserRole {
  if (!userEmail) return 'guest';
  if (superAdminEmail && userEmail === superAdminEmail) return 'super_admin';
  return 'member';
}

export function getRouteGroup(pathname: string): RouteGroup {
  if (pathname.startsWith('/api/cron')) return 'cron';

  if (
    STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PUBLIC_STATIC_FILES.some((value) => pathname === value)
  ) {
    return 'static';
  }

  if (pathname.startsWith('/api/admin')) return 'admin-api';
  if (pathname.startsWith('/admin')) return 'admin-page';

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return 'public-api';
  }

  if (pathname.startsWith('/api/')) return 'protected-api';

  if (AUTH_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return 'auth-page';
  }

  if (PUBLIC_PAGE_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return 'public-page';
  }

  return 'protected-page';
}

export function getPolicyDecision(pathname: string, role: UserRole): PolicyDecision {
  const routeGroup = getRouteGroup(pathname);

  // Explicit root behavior for members to remove ambiguity.
  if (role === 'member' && pathname === '/') {
    return {
      action: 'redirect',
      redirectTo: '/dashboard',
      reason: 'Authenticated members are redirected from home to dashboard',
    };
  }

  return ROUTE_POLICY_MATRIX[role][routeGroup];
}
