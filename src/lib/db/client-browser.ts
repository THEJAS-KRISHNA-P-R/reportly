import { createBrowserClient } from '@supabase/ssr';

// Insecure context polyfill for Supabase locker (must be at top level for all browser clients)
if (typeof window !== 'undefined' && !window.navigator.locks) {
  // @ts-expect-error - navigator.locks is missing in non-secure contexts (lvh.me)
  window.navigator.locks = {
    request: async (...args: any[]) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') return callback();
    }
  };
}

export const createSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') return null as any;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      }
    }
  );
};
