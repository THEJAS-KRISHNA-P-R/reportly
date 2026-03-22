import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/nav';
import { Hero }        from '@/components/marketing/hero';
import { Problem }     from '@/components/marketing/problem';
import { HowItWorks }  from '@/components/marketing/how-it-works';
import { Features }    from '@/components/marketing/features';
import { Stats }       from '@/components/marketing/stats';
import { Pricing }     from '@/components/marketing/pricing';
import { Footer }      from '@/components/marketing/footer';

export const metadata: Metadata = {
  title: 'Reportly — Automated Marketing Reports for Agencies',
  description:
    'Pull GA4 data, generate AI-written narratives, and send white-labelled PDF reports to your clients — automatically, every month.',
  openGraph: {
    title: 'Reportly — Automated Marketing Reports for Agencies',
    description:
      'Automated Google Analytics reports with AI insights for digital agencies.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Stats />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
