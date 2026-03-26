'use client';

import { OnboardingWizard } from '@/components/onboarding/wizard';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to Reportly</h1>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
              Let's set up your agency account in 3 steps
            </p>
          </div>

          <OnboardingWizard />
        </div>
      </div>
    </main>
  );
}
