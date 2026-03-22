'use client';

import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { AuthProvider } from '@/lib/auth-context';

export default function RegisterPage() {
  return (
    <AuthProvider>
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* Left: Form */}
        <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Get started with automated reports in minutes.
              </p>
            </div>

            <RegisterForm />

            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Marketing */}
        <div className="hidden flex-col justify-center bg-slate-50 px-4 dark:bg-slate-900/50 md:flex">
          <div className="mx-auto max-w-sm">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Start generating reports today</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Connect Google Analytics, customize your branding, and send beautiful reports to clients in minutes.
            </p>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
