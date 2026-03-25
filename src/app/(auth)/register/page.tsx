'use client';

import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/register-form';
import { BeamsDynamic } from '@/components/ui/beams-dynamic';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex" style={{ background: '#FFFFFF' }}>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Suspense fallback={<div />}>
          <RegisterForm />
        </Suspense>
      </div>
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <BeamsDynamic 
          beamNumber={8} 
          beamHeight={16} 
          speed={1.2} 
          lightColor="#ffffff" 
          scale={0.12} 
        />
        <div className="relative z-10 max-w-md text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white mb-4">
            Automate your agency reporting
          </h2>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join dozens of agencies saving 90+ hours per year on manual client reports.
          </p>
        </div>
      </div>
    </div>
  );
}
