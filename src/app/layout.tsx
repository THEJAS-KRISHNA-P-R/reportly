import type { Metadata } from 'next';
import './globals.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-mono/400.css';
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Reportly — Automated client reporting for agencies',
  description: 'Reportly pulls your Google Analytics data, writes the narrative, and delivers a branded PDF to your clients — automatically, every month.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "font-sans")}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
