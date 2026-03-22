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
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return null;
      const data = await response.json();
      return data.profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
  }, [supabase]);

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
  }, [supabase]);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to redirect to Google';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
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
  }, [supabase]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
    } finally {
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
