'use client';

import { OnboardingWizard } from '@/components/onboarding/wizard';
import { AuthProvider } from '@/lib/auth-context';

export default function OnboardingPage() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome to Reportly</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Let's set up your agency account in 3 steps
              </p>
            </div>

            <OnboardingWizard />
          </div>
        </div>
      </main>
    </AuthProvider>
  );
}
