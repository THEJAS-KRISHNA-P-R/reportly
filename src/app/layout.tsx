import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'


export const metadata: Metadata = {
  title: {
    default: 'Reportly - High-Density Agency Intelligence',
    template: '%s | Reportly',
  },
  description: 'Automated executive-grade performance reports for modern digital agencies. GA4, Meta Ads, and Search Console integration with AI-powered narrative generation.',
  metadataBase: new URL('https://reportly.ai'),
  keywords: ['agency reports', 'automated reporting', 'GA4 reporting', 'meta ads dashboard', 'AI marketing insights'],
  authors: [{ name: 'Reportly Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reportly.ai',
    title: 'Reportly - Automated Agency Reports',
    description: 'The standard for high-density, executive-grade agency reporting.',
    siteName: 'Reportly',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Reportly Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reportly - Automated Agency Reports',
    description: 'Transform raw data into high-density executive intelligence automagically.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

import { AuthProvider } from '@/lib/auth-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Reportly",
    "applicationCategory": "BusinessApplication",
    "description": "Automated executive-grade performance reports for modern digital agencies.",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "provider": {
      "@type": "Organization",
      "name": "Reportly",
      "url": "https://reportly.ai"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
