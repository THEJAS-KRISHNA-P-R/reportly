import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'


export const metadata: Metadata = {
  title: 'Reportly - High-Density Agency Intelligence',
  description: 'Automated executive-grade performance reports for modern digital agencies. GA4, Meta Ads, and Search Console integration with AI-powered narrative generation.',
  keywords: ['agency reports', 'automated reporting', 'GA4 reporting', 'meta ads dashboard', 'AI marketing insights'],
  authors: [{ name: 'Reportly Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reportly.ai',
    title: 'Reportly - Automated Agency Reports',
    description: 'The standard for high-density, executive-grade agency reporting.',
    siteName: 'Reportly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reportly - Automated Agency Reports',
    description: 'Transform raw data into high-density executive intelligence automagically.',
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
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
