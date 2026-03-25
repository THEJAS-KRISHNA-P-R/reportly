'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AuthRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    
    if (code) {
      console.log('[HomeFallback] Found auth code on root, redirecting to callback API...');
      window.location.href = `http://localhost:3000/api/auth/callback?code=${code}&next=${next}`;
    }
  }, [searchParams, router]);

  return null;
}
