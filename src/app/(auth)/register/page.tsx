'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createSupabaseBrowserClient } from '@/lib/db/client-browser';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [origin, setOrigin] = useState('');
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    setOrigin(window.location.origin);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.refresh();
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Reportly</h1>
          <p className="text-gray-400 mt-1">Create your agency account</p>
        </div>

        {/* Auth UI */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          {origin && (
            <Auth
              supabaseClient={supabase}
              view="sign_up"
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#6366f1',
                      brandAccent: '#4f46e5',
                      inputBackground: 'rgb(17 24 39)',
                      inputText: 'white',
                      inputBorder: 'rgb(55 65 81)',
                      inputLabelText: 'rgb(156 163 175)',
                    },
                  },
                },
                className: {
                  button: 'rounded-lg',
                  input: 'rounded-lg',
                },
              }}
              providers={['google']}
              redirectTo={`${origin}/auth/callback`}
              showLinks={true}
            />
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Your agency data is isolated and private. Full audit trail on every action.
        </p>
      </div>
    </div>
  );
}
