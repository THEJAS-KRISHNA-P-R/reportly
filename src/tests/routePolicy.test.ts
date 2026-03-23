import {
  getPolicyDecision,
  getRouteGroup,
  resolveUserRole,
  type UserRole,
} from '@/lib/security/routePolicy';

describe('routePolicy', () => {
  describe('resolveUserRole', () => {
    it('returns guest when no user email', () => {
      expect(resolveUserRole(null, 'admin@example.com')).toBe('guest');
      expect(resolveUserRole(undefined, 'admin@example.com')).toBe('guest');
    });

    it('returns super_admin when email matches configured super admin', () => {
      expect(resolveUserRole('admin@example.com', 'admin@example.com')).toBe('super_admin');
    });

    it('returns member for authenticated non-admin user', () => {
      expect(resolveUserRole('member@example.com', 'admin@example.com')).toBe('member');
    });
  });

  describe('getRouteGroup', () => {
    it('classifies key route groups', () => {
      expect(getRouteGroup('/')).toBe('public-page');
      expect(getRouteGroup('/login')).toBe('auth-page');
      expect(getRouteGroup('/register')).toBe('auth-page');
      expect(getRouteGroup('/admin')).toBe('admin-page');
      expect(getRouteGroup('/api/admin/jobs')).toBe('admin-api');
      expect(getRouteGroup('/api/auth/session')).toBe('public-api');
      expect(getRouteGroup('/api/reports')).toBe('protected-api');
      expect(getRouteGroup('/dashboard')).toBe('protected-page');
      expect(getRouteGroup('/_next/static/chunk.js')).toBe('static');
      expect(getRouteGroup('/api/cron/reports')).toBe('cron');
    });
  });

  describe('getPolicyDecision matrix', () => {
    function decision(pathname: string, role: UserRole) {
      return getPolicyDecision(pathname, role);
    }

    describe('guest flow', () => {
      it('allows public and auth pages', () => {
        expect(decision('/', 'guest').action).toBe('allow');
        expect(decision('/pricing', 'guest').action).toBe('allow');
        expect(decision('/login', 'guest').action).toBe('allow');
        expect(decision('/register', 'guest').action).toBe('allow');
      });

      it('redirects protected page/api to login with redirect param', () => {
        const page = decision('/dashboard', 'guest');
        expect(page.action).toBe('redirect');
        expect(page.redirectTo).toBe('/login');
        expect(page.includeRedirectParam).toBe(true);

        const api = decision('/api/reports', 'guest');
        expect(api.action).toBe('redirect');
        expect(api.redirectTo).toBe('/login');
        expect(api.includeRedirectParam).toBe(true);
      });
    });

    describe('member flow', () => {
      it('redirects auth pages and home to dashboard', () => {
        expect(decision('/', 'member')).toMatchObject({ action: 'redirect', redirectTo: '/dashboard' });
        expect(decision('/login', 'member')).toMatchObject({ action: 'redirect', redirectTo: '/dashboard' });
        expect(decision('/register', 'member')).toMatchObject({ action: 'redirect', redirectTo: '/dashboard' });
      });

      it('forbids admin paths and allows protected routes', () => {
        expect(decision('/admin', 'member').action).toBe('forbidden');
        expect(decision('/api/admin/jobs', 'member').action).toBe('forbidden');
        expect(decision('/dashboard', 'member').action).toBe('allow');
        expect(decision('/api/reports', 'member').action).toBe('allow');
      });
    });

    describe('super admin flow', () => {
      it('allows admin routes and redirects non-admin pages to /admin', () => {
        expect(decision('/admin', 'super_admin').action).toBe('allow');
        expect(decision('/api/admin/jobs', 'super_admin').action).toBe('allow');
        expect(decision('/dashboard', 'super_admin')).toMatchObject({ action: 'redirect', redirectTo: '/admin' });
        expect(decision('/', 'super_admin')).toMatchObject({ action: 'redirect', redirectTo: '/admin' });
      });

      it('allows non-admin api access for super admin', () => {
        expect(decision('/api/reports', 'super_admin').action).toBe('allow');
      });
    });
  });
});
