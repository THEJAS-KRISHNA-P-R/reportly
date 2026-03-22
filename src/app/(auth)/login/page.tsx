'use client';

import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/lib/auth-context';

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* Left: Form */}
        <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in to Reportly</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Enter your email to access your dashboard.
              </p>
            </div>

            <LoginForm />
          </div>
        </div>

        {/* Right: Marketing */}
        <div className="hidden flex-col justify-center bg-slate-50 px-4 dark:bg-slate-900/50 md:flex">
          <div className="mx-auto max-w-sm">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Sign in to your agency dashboard to manage clients and generate reports.
            </p>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
