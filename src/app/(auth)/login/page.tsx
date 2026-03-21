'use client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const benefits = [
  'Automated Google Analytics reports',
  'AI narrative reviewed before sending',
  'Clients receive branded PDFs on schedule',
];

const inputCls = cn(
  'w-full h-10 px-3 rounded-[var(--radius-md)]',
  'bg-[var(--bg-primary)] border border-[var(--border)]',
  'text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]',
  'focus:outline-none focus:border-[var(--accent)] focus:shadow-[var(--shadow-focus)]',
  'transition-all duration-[120ms] ease-[ease]',
);

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — dark brand panel */}
      <div className="hidden md:flex md:w-1/2 bg-[var(--bg-dark)] flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm" />
          </div>
          <span className="text-[16px] font-semibold text-white tracking-tight">Reportly</span>
        </div>

        <div>
          <p className="text-[36px] md:text-[40px] font-semibold text-white leading-[1.2] tracking-[-0.02em] mb-4">
            &ldquo;90 hours saved.
            <br />Every month.&rdquo;
          </p>
          <p className="text-[15px] text-[var(--text-muted)] mb-10">
            The average agency saves this much time on reporting with Reportly.
          </p>
          <ul className="space-y-3">
            {benefits.map(b => (
              <li key={b} className="flex items-center gap-3 text-[14px] text-white/80">
                <div className="w-5 h-5 rounded-full bg-[var(--success)]/20 border border-[var(--success)]/30 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[var(--success)]" strokeWidth={2.5} />
                </div>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12px] text-[var(--text-muted)]">© 2025 Reportly. Made in Kerala, India 🇮🇳</p>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-primary)]">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2 justify-center mb-8">
            <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm" />
            </div>
            <span className="text-[16px] font-semibold text-[var(--text-primary)] tracking-tight">Reportly</span>
          </div>

          <h2 className="text-[26px] font-semibold text-[var(--text-primary)] tracking-[-0.01em] mb-1">
            Sign in to your account
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mb-8">
            New here?{' '}
            <Link href="/register" className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-[120ms] ease-[ease]">
              Create an account
            </Link>
          </p>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-[13px] font-medium text-[var(--text-secondary)]">Email</label>
              <input id="login-email" type="email" placeholder="you@agency.com" className={inputCls} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-[13px] font-medium text-[var(--text-secondary)]">Password</label>
                <a href="#" className="text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  Forgot password?
                </a>
              </div>
              <input id="login-password" type="password" placeholder="••••••••" className={inputCls} />
            </div>

            <button
              id="login-submit"
              className={cn(
                'w-full h-10 bg-[var(--accent)] text-white rounded-[var(--radius-md)]',
                'text-[14px] font-medium',
                'hover:bg-[var(--accent-hover)] transition-colors duration-[120ms] ease-[ease]',
                'focus:outline-none focus:shadow-[var(--shadow-focus)]',
              )}
            >
              Sign in
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[12px] text-[var(--text-muted)]">or continue with</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <button
              id="login-google"
              className={cn(
                'w-full h-10 border border-[var(--border)] rounded-[var(--radius-md)]',
                'text-[14px] font-medium text-[var(--text-primary)]',
                'hover:bg-[var(--bg-surface)] transition-colors duration-[120ms] ease-[ease]',
                'flex items-center justify-center gap-2',
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
