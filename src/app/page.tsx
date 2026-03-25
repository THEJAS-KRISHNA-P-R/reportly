'use client';

import { Suspense } from 'react';
import { MarketingNav } from '@/components/marketing/nav';
import { Hero }        from '@/components/marketing/hero';
import { Stats }       from '@/components/marketing/stats';
import { Footer }      from '@/components/marketing/footer';
import { AuthRedirectHandler } from '@/components/auth/redirect-handler';

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthRedirectHandler />
      </Suspense>
      <MarketingNav />
      <main>
        <Hero />
        <Stats />
      </main>
      <Footer />
    </>
  );
}
