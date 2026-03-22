'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { AuthProvider } from '@/lib/auth-context';
import { BeamsDynamic } from '@/components/ui/beams-dynamic';

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex" style={{ background: '#FFFFFF' }}>
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <Suspense fallback={<div />}>
            <LoginForm />
          </Suspense>
        </div>
        <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
          <BeamsDynamic 
            beamNumber={8} 
            beamHeight={16} 
            speed={1.0} 
            lightColor="#ffffff" 
            scale={0.12} 
            rotation={-20}
          />
          <div className="relative z-10 max-w-md text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white mb-4">
              Welcome back
            </h2>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Sign in to manage your clients, view analytics, and generate reports. 
            </p>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
