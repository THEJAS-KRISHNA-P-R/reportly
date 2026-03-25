'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/db/client-browser';

export interface User {
  id: string;
  email: string;
  name: string;
  agency_name?: string;
  role: 'owner' | 'team_member';
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string, metadata?: { agency_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const lastFetchTime = React.useRef<number>(0);
  const lastFetchedUserId = React.useRef<string | null>(null);
  const isFetchingProfile = React.useRef<boolean>(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = useCallback(async (force = false) => {
    // Throttle: don't fetch more than once every 30 seconds unless forced
    const now = Date.now();
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    if (!force && 
        isFetchingProfile.current === false && 
        lastFetchedUserId.current === currentUserId && 
        now - lastFetchTime.current < 30000) {
      return null;
    }

    if (isFetchingProfile.current) return null;

    try {
      isFetchingProfile.current = true;
      const response = await fetch('/api/auth/profile');
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return null;
      const data = await response.json();
      
      lastFetchTime.current = Date.now();
      lastFetchedUserId.current = currentUserId || null;
      
      return data.profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    } finally {
      isFetchingProfile.current = false;
    }
  }, [supabase]);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          const profile = await fetchProfile();

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.agencies?.name || session.user.user_metadata?.name || '',
            agency_name: profile?.agencies?.name,
            role: profile?.role || session.user.user_metadata?.role || 'owner',
            created_at: session.user.created_at,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to get session:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        const profile = await fetchProfile();

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.agencies?.name || session.user.user_metadata?.name || '',
          agency_name: profile?.agencies?.name,
          role: profile?.role || session.user.user_metadata?.role || 'owner',
          created_at: session.user.created_at,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        const profile = await fetchProfile();

        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: profile?.agencies?.name || data.user.user_metadata?.name || '',
          agency_name: profile?.agencies?.name,
          role: profile?.role || data.user.user_metadata?.role || 'owner',
          created_at: data.user.created_at,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProfile]);

  const loginWithGoogle = useCallback(async () => {
    console.log('[Auth] Button Click Triggered');
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.warn('[Auth] WARNING: Not a secure context. Google login may fail on http://lvh.me. Use localhost instead.');
    }

    setLoading(true);
    setError(null);
    try {
      // Use the current origin for OAuth redirect to ensure PKCE state (cookies) is preserved.
      // Do NOT switch domains (e.g. localhost -> lvh.me) mid-flow as it breaks PKCE verifiers.
      // Use hardcoded localhost for dev to avoid mismatches between 0.0.0.0 and localhost
      const baseUrl = 'http://localhost:3000';
      const redirectTo = `${baseUrl}/api/auth/callback`;
      console.log('[AuthContext] loginWithGoogle config:', { baseUrl, redirectTo, isSecure: window.isSecureContext });
      // Force localhost for login if on insecure local origins to ensure Secure Context (PKCE)
      const isLocalInsecure = typeof window !== 'undefined' && 
        (window.location.hostname.includes('lvh.me') || window.location.hostname === '0.0.0.0');

      if (isLocalInsecure && !window.isSecureContext && window.location.pathname === '/login') {
        console.log('[AuthContext] Insecure context detected, switching to localhost...');
        const localUrl = new URL(window.location.href);
        localUrl.hostname = 'localhost';
        window.location.href = localUrl.toString();
        return;
      }

      console.log('[Auth] Initiating Google login', { baseUrl, redirectTo, isSecure: window.isSecureContext });

      // Pre-cleanup to avoid stale flow state (invalid flow state errors)
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('[Auth] Google login error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('[Auth] Redirecting to:', data.url);
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('[Auth] loginWithGoogle failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to redirect to Google';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const register = useCallback(async (email: string, password: string, name: string, metadata?: { agency_name: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            ...metadata,
          },
        },
      });

      if (error) throw error;
      
      if (data.user) {
        const profile = await fetchProfile();

        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: profile?.agencies?.name || data.user.user_metadata?.name || name,
          agency_name: profile?.agencies?.name,
          role: profile?.role || data.user.user_metadata?.role || 'owner',
          created_at: data.user.created_at,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, fetchProfile]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Auth] Initiating logout...');
      
      // Use a race to prevent signOut from hanging on insecure origins (lvh.me)
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SignOut Timeout')), 1500))
      ]).catch(err => {
        console.warn('[Auth] SignOut failed or timed out, proceeding with local cleanup:', err.message);
      });

    } catch (err) {
      console.error('[Auth] Logout catch block:', err);
    } finally {
      console.log('[Auth] Performing local session cleanup');
      setUser(null);
      
      // Redirect to root domain login to ensure fresh state
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname.includes('localhost') || window.location.hostname.includes('lvh.me'));
      
      if (isLocalhost) {
        window.location.href = 'http://lvh.me:3000/login';
      } else {
        const parts = window.location.hostname.split('.');
        const rootDomain = parts.slice(-2).join('.');
        window.location.href = `${window.location.protocol}//${rootDomain}/login`;
      }
      setLoading(false);
    }
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginWithGoogle, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
