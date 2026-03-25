'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/db/client-browser';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing secure connection...');
  const [stage, setStage] = useState<'loading' | 'success' | 'error'>('loading');
  const [progress, setProgress] = useState(10);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    const handleCallback = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const next = searchParams.get('next') ?? '/dashboard';
        
        // 1. Check for tokens in hash (Subdomain jump)
        if (typeof window !== 'undefined' && window.location.hash) {
          setStatus('Activating your agency session...');
          setProgress(40);
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            
            setStatus('Identity verified. Redirecting to your dashboard...');
            setStage('success');
            setProgress(100);
            
            setTimeout(() => {
              window.location.href = next;
            }, 1000);
            return;
          }
        }

        // 2. Fallback to code exchange (Initial login on localhost)
        const code = searchParams.get('code');
        if (code) {
          setStatus('Exchanging secure credentials...');
          setProgress(60);
          
          // Use the API route for code exchange to handle subdomain lookup
          window.location.href = `/api/auth/callback?code=${code}&next=${next}`;
          return;
        }

        // 3. Check for existing session (Just in case)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStage('success');
          setProgress(100);
          window.location.href = next;
          return;
        }

        // 4. No credentials found
        const errorMsg = searchParams.get('error_description') || 'No authentication code or tokens found.';
        throw new Error(errorMsg);

      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setStage('error');
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 flex items-center justify-center p-6">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -20 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Glassmorphic Card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800/50 bg-slate-900/40 p-10 shadow-3xl backdrop-blur-2xl">
            {/* Top Shine Accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />

            <div className="flex flex-col items-center text-center space-y-8">
              {/* Icon Container */}
              <div className="group relative">
                <div className="absolute inset-0 blur-3xl opacity-20 bg-blue-500 rounded-full group-hover:opacity-30 transition-opacity" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-800/40 border border-slate-700/50 shadow-inner backdrop-blur-md">
                  {stage === 'loading' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-12 w-12 text-blue-400" />
                    </motion.div>
                  )}
                  {stage === 'success' && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                    </motion.div>
                  )}
                  {stage === 'error' && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <AlertCircle className="h-12 w-12 text-rose-400" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  <Sparkles className="h-3 w-3" />
                  Security Protected
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {stage === 'loading' && 'Connecting...'}
                  {stage === 'success' && 'Authenticated'}
                  {stage === 'error' && 'Login Error'}
                </h1>
                <p className="text-slate-400 text-base leading-relaxed max-w-[320px] font-medium">
                  {error || status}
                </p>
              </div>

              {/* Progress/Action Section */}
              <div className="w-full pt-2">
                {stage === 'loading' && (
                  <div className="space-y-4">
                    <div className="relative h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        initial={{ width: "10%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                      Establishing encrypted tunnel
                    </p>
                  </div>
                )}

                {stage === 'success' && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-[0.15em] px-4 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure Session Active
                    </div>
                  </div>
                )}

                {stage === 'error' && (
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="group flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl bg-white text-slate-950 font-bold text-sm transition-all hover:bg-slate-200 hover:shadow-xl active:scale-[0.98] shadow-lg shadow-white/5"
                    >
                      Return to Login
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-xs text-slate-500 font-medium px-4">
                      Try switching to <span className="text-blue-400">localhost:3000</span> if the error persists.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Brand Footnote */}
            <div className="mt-10 flex justify-center border-t border-slate-800/50 pt-8 opacity-50">
              <div className="flex items-center gap-3 grayscale pointer-events-none">
                <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] font-black italic text-white shadow-lg shadow-blue-500/20">
                  R
                </div>
                <span className="text-xs font-black tracking-[0.3em] uppercase text-white/80">Reportly</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
