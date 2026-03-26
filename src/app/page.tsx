import { Metadata } from 'next';

import { Suspense } from 'react';
import { MarketingNav } from '@/components/marketing/nav';
import { Hero }        from '@/components/marketing/hero';
import { Stats }       from '@/components/marketing/stats';
import { Footer }      from '@/components/marketing/footer';
import { AuthRedirectHandler } from '@/components/auth/redirect-handler';

export const metadata: Metadata = {
  title: 'Reportly - Automated Agency Reports & High-Density Insights',
  description: 'Transform raw GA4 and Meta Ads data into executive-grade narratives in seconds. Our white-labeled SaaS completely eliminates manual reporting drag for growing digital agencies.',
  openGraph: {
    title: 'Reportly - The Standard for Automated Agency Reports',
    description: 'Transform raw data into high-density, executive-grade narratives in seconds. Zero manual entry, 100% white-labeled.',
    images: ['/og-image.png'],
  },
};

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
