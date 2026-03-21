/**
 * Security headers applied to every response via proxy.ts.
 * CSP is tight — no unsafe-eval in production, minimal unsafe-inline.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const securityHeaders: Record<string, string> = {
  // Prevent framing (clickjacking)
  'X-Frame-Options': 'DENY',
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  // XSS filter for legacy browsers
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Disable unnecessary browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // Force HTTPS for 2 years
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Content Security Policy — tight, no unsafe-eval in production
  'Content-Security-Policy': [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""}`.trim(), // Next.js needs unsafe-eval in dev, unsafe-inline for hydration
    "style-src 'self' 'unsafe-inline'", // inline styles needed for Next.js + Tailwind
    "img-src 'self' data: https:", // data: for base64 logos
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};
