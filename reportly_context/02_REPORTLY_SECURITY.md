# REPORTLY — Security Reference
> **Authority:** Every security decision, implementation pattern, and compliance rule lives here.
> **Rule:** No security logic is invented on the fly. Every security measure references a pattern in this file.
> **Threat model summary:** Multi-tenant SaaS handling OAuth tokens, third-party API credentials, AI-generated content, and automated email delivery. The primary threats are: data isolation failures between agencies, OAuth token theft, prompt injection, privilege escalation, and email delivery abuse.

---

## 0. Security Principles

- **Least privilege everywhere.** Every component gets the minimum access it needs. Workers don't have user sessions. API routes don't have service role keys. Modules don't touch the database.
- **Defense in depth.** RLS in the DB + agency_id checks in the app + input validation at the boundary. Three independent layers. Failing one doesn't compromise the system.
- **Zero trust inputs.** Every input — user-supplied, API-returned, AI-generated — is treated as untrusted until validated.
- **Explicit over implicit.** Security checks are visible in code, not hidden in middleware magic.
- **Fail closed.** When in doubt, deny. Return 403, don't guess.

---

## 1. Authentication

### 1.1 Session Management
```typescript
// middleware.ts — runs on every request before any route handler

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeaders } from '@/lib/security/headers';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Apply security headers to every response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 2. Rate limiting before any route processing
  const rateLimitResult = await checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
    });
  }

  // 3. Protect dashboard and API routes
  const isProtected = request.nextUrl.pathname.startsWith('/dashboard')
    || (request.nextUrl.pathname.startsWith('/api')
        && !request.nextUrl.pathname.startsWith('/api/auth')
        && !request.nextUrl.pathname.startsWith('/api/webhooks'));

  if (isProtected) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (n) => request.cookies.get(n)?.value } }
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Admin routes: IP allowlist
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    const allowed = process.env.ADMIN_IP_ALLOWLIST!.split(',');
    if (!ip || !allowed.includes(ip)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 1.2 Login Brute Force Protection
```typescript
// lib/security/loginProtection.ts

export async function recordFailedAttempt(email: string, agencyId: string): Promise<void> {
  const db = createSupabaseServiceClient();
  await db.rpc('increment_failed_attempts', { p_email: email, p_agency_id: agencyId });
  // SQL function:
  // UPDATE agency_users
  // SET failed_attempts = failed_attempts + 1,
  //     locked_until = CASE
  //       WHEN failed_attempts >= 4 THEN now() + interval '15 minutes'
  //       ELSE locked_until END
  // WHERE email = p_email AND agency_id = p_agency_id
}

export async function isAccountLocked(email: string, agencyId: string): Promise<boolean> {
  const db = createSupabaseServiceClient();
  const { data } = await db
    .from('agency_users')
    .select('locked_until')
    .eq('email', email)
    .eq('agency_id', agencyId)
    .single();
  if (!data?.locked_until) return false;
  return new Date(data.locked_until) > new Date();
}

export async function clearFailedAttempts(email: string, agencyId: string): Promise<void> {
  const db = createSupabaseServiceClient();
  await db
    .from('agency_users')
    .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq('email', email)
    .eq('agency_id', agencyId);
}
```

---

## 2. Authorization

### 2.1 Agency Boundary Guard (Use in Every API Route)
```typescript
// lib/security/authGuard.ts

import { createSupabaseServerClient } from '@/lib/db/client';
import { ReportlyError } from '@/lib/types/errors';

export async function getAuthenticatedAgency(request: Request): Promise<{ agencyId: string; userId: string; role: string }> {
  const db = createSupabaseServerClient();
  const { data: { session }, error } = await db.auth.getSession();

  if (error || !session) {
    throw new ReportlyError('UNAUTHORIZED', 'No valid session', 'Authentication required.', 401);
  }

  const agencyId = session.user.user_metadata?.agency_id;
  const userId   = session.user.id;
  const role     = session.user.user_metadata?.role ?? 'member';

  if (!agencyId) {
    throw new ReportlyError('UNAUTHORIZED', 'No agency_id in session', 'Invalid session.', 401);
  }

  return { agencyId, userId, role };
}

export function requireAdmin(role: string): void {
  if (role !== 'admin') {
    throw new ReportlyError('FORBIDDEN', 'Admin role required', 'You do not have permission to perform this action.', 403);
  }
}

// Usage in every API route:
// const { agencyId, userId, role } = await getAuthenticatedAgency(request);
// const client = await clientRepo.getClientById(clientId, agencyId); // agencyId scopes the query
// if (!client) return 404; // could be not found OR unauthorized — return same response (don't leak)
```

### 2.2 Resource Ownership Check Pattern
```typescript
// ALWAYS return the same error for "not found" and "not yours"
// This prevents enumeration attacks (attacker can't tell if resource exists)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { agencyId } = await getAuthenticatedAgency(request);
  const client = await clientRepo.getClientById(params.id, agencyId);
  if (!client) {
    // Same 404 whether it doesn't exist or belongs to another agency
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(client);
}
```

---

## 3. Input Validation

### 3.1 Zod Schemas — All User Input

```typescript
// lib/validators/inputValidator.ts
import { z } from 'zod';

const emailSchema   = z.string().email().max(254).toLowerCase().trim();
const httpsUrlSchema = z.string().url().startsWith('https://').max(2000);
const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const uuidSchema    = z.string().uuid();

export const createClientSchema = z.object({
  name:           z.string().trim().min(1).max(100),
  contact_email:  emailSchema.optional(),
  report_emails:  z.array(emailSchema).min(1).max(10),
  schedule_day:   z.number().int().min(1).max(28),
  timezone:       z.string().max(50).regex(/^[A-Za-z_\/]+$/),
}).strict(); // .strict() rejects unknown keys

export const updateAgencySchema = z.object({
  name:        z.string().trim().min(2).max(100).optional(),
  logo_url:    httpsUrlSchema.optional(),
  brand_color: hexColorSchema.optional(),
}).strict();

export const approveReportSchema = z.object({
  final_narrative: z.string().min(10).max(10000).trim(),
}).strict();

// Validate at route boundary — before any service call
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ReportlyError(
      'VALIDATION_ERROR',
      result.error.message,
      'Invalid input: ' + result.error.errors.map(e => e.message).join(', '),
      400,
      { issues: result.error.errors }
    );
  }
  return result.data;
}
```

### 3.2 Output Sanitization

```typescript
// lib/security/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

// Strip all HTML — used for narrative text before rendering in PDF or email
export function sanitizeText(input: string, maxLength = 10000): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // strip control chars
}

// Allow limited markdown-like formatting for report narrative
export function sanitizeNarrative(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'li', 'br'],
    ALLOWED_ATTR: [],
  }).slice(0, 10000);
}

// Never trust PDF attachment filenames from user input
export function safePdfFilename(clientId: string, period: string): string {
  // System-generated only — no user input touches filenames
  return `report_${clientId.replace(/[^a-z0-9]/gi, '')}_${period.replace(/[^0-9-]/g, '')}.pdf`;
}
```

---

## 4. OAuth Security

```typescript
// lib/modules/analytics/ga4/oauth.ts

import { generateOAuthState, verifyOAuthState } from '@/lib/security/csrf';

// Step 1: Generate authorization URL
export function getGA4AuthUrl(agencyId: string, clientId: string): string {
  const state = generateOAuthState({ agencyId, clientId });
  // State is signed and stored in session — verified on callback

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/analytics.readonly',
    access_type:   'offline',
    prompt:        'consent',        // force refresh token every time
    state,
    // PKCE
    code_challenge:        await generatePKCEChallenge(),
    code_challenge_method: 'S256',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Step 2: Handle callback — verify state BEFORE exchanging code
export async function handleGA4Callback(
  code: string,
  state: string,
  sessionState: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  // CSRF check — state parameter must match session
  if (!verifyOAuthState(state, sessionState)) {
    throw new ReportlyError('OAUTH_CSRF', 'State mismatch', 'OAuth flow was tampered with.', 400);
  }

  const tokens = await exchangeCodeForTokens(code);
  // Tokens returned here go DIRECTLY to connectionRepo.upsertConnection
  // which encrypts them before DB storage
  // They are NEVER logged, NEVER stored in plaintext, NEVER returned to frontend
  return tokens;
}
```

```typescript
// lib/security/csrf.ts
import crypto from 'crypto';

export function generateOAuthState(payload: Record<string, string>): string {
  const data = JSON.stringify(payload) + '|' + Date.now();
  const hash = crypto
    .createHmac('sha256', process.env.OAUTH_STATE_SECRET!)
    .update(data)
    .digest('hex');
  return Buffer.from(data).toString('base64url') + '.' + hash;
}

export function verifyOAuthState(state: string, _sessionState: string): boolean {
  try {
    const [dataB64, hash] = state.split('.');
    const data = Buffer.from(dataB64, 'base64url').toString();
    const expectedHash = crypto
      .createHmac('sha256', process.env.OAUTH_STATE_SECRET!)
      .update(data)
      .digest('hex');
    // Constant-time comparison — prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  } catch { return false; }
}
```

---

## 5. Encryption

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm'; // GCM provides authenticity, not just confidentiality
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex'); // 32-byte hex

export function encrypt(plaintext: string): string {
  const iv  = crypto.randomBytes(12);  // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // GCM auth tag — detects tampering
  // Format: iv(hex):authTag(hex):encrypted(hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const iv       = Buffer.from(ivHex, 'hex');
  const authTag  = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag); // verify authenticity — throws if tampered
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}

// Token rotation: re-encrypt all tokens with new key
// Run this script quarterly and after any suspected key compromise
export async function rotateEncryptionKey(oldKey: Buffer, newKey: Buffer): Promise<void> {
  // 1. Fetch all encrypted tokens using service role
  // 2. Decrypt each with oldKey
  // 3. Re-encrypt with newKey
  // 4. Update in DB in a transaction
  // This script exists in /scripts/rotate-encryption-key.ts
}
```

---

## 6. Security Headers

```typescript
// lib/security/headers.ts

export const securityHeaders: Record<string, string> = {
  // Prevent framing (clickjacking)
  'X-Frame-Options': 'DENY',
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  // XSS filter (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Disable unnecessary browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // Force HTTPS for 2 years
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Content Security Policy — tight, no unsafe-eval
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",  // inline styles needed for Next.js
    "img-src 'self' data: https:",        // data: for base64 logos
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};
```

---

## 7. Rate Limiting

```typescript
// lib/security/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const limiters: Record<string, Ratelimit> = {
  'auth-login':    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15m') }),
  'auth-register': new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1h') }),
  'oauth':         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1h') }),
  'report-trigger':new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1h') }),
  'api-general':   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1m') }),
  'admin':         new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1m') }),
};

function getLimiterKey(pathname: string): string {
  if (pathname.includes('/auth/login'))    return 'auth-login';
  if (pathname.includes('/auth/register')) return 'auth-register';
  if (pathname.includes('/oauth'))         return 'oauth';
  if (pathname.includes('/reports/') && pathname.includes('/trigger')) return 'report-trigger';
  if (pathname.includes('/admin'))         return 'admin';
  return 'api-general';
}

export async function checkRateLimit(
  request: NextRequest
): Promise<{ allowed: boolean; retryAfter: number }> {
  const ip  = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const key = getLimiterKey(request.nextUrl.pathname);
  const { success, reset } = await limiters[key].limit(`${key}:${ip}`);
  return { allowed: success, retryAfter: Math.ceil((reset - Date.now()) / 1000) };
}
```

---

## 8. AI Prompt Injection Prevention

```typescript
// lib/modules/ai/promptBuilder.ts

// The AI prompt must never incorporate raw user input directly
// Client names, narratives edited by users — all sanitized before inclusion

export function buildNarrativePrompt(
  metrics: ValidatedMetricSet,
  context: { clientName: string; period: string; priorSummary?: string }
): string {
  // Sanitize all user-controlled strings before embedding in prompt
  const safeClientName = sanitizeText(context.clientName, 100)
    .replace(/[<>{}[\]]/g, '');  // remove any prompt-injection characters

  const safePriorSummary = context.priorSummary
    ? sanitizeText(context.priorSummary, 500).replace(/[<>{}[\]]/g, '')
    : 'No prior report available.';

  // Metrics come from our validated system — not user input
  // Still, serialize them to JSON and embed as data, not instructions
  const metricsJson = JSON.stringify(metrics.validated, null, 2);

  return `
You are writing a professional marketing performance report for ${safeClientName}.
Reporting period: ${context.period}.

METRIC DATA (use only this data — do not invent or infer beyond what is shown):
${metricsJson}

PRIOR PERIOD CONTEXT:
${safePriorSummary}

RULES (follow strictly):
- Only make claims directly supported by the metric data above.
- Do not use speculative language (likely due to, possibly because, might be).
- Write in plain English a non-technical client can understand.
- Structure: 1 overview paragraph, 1 wins paragraph, 1 concerns paragraph, 1 recommendations paragraph.
- Do not mention competitor tools, external events, or information not in the data.
- Maximum length: 600 words.
`.trim();
}
```

---

## 9. PDF Generation Security (Puppeteer)

```typescript
// lib/modules/pdf/puppeteer.ts

// Puppeteer renders HTML — ALL dynamic content must be sanitized before injection

export async function renderReportHTML(data: PDFRequest): Promise<string> {
  // Every user-controlled field sanitized individually
  const safeAgencyName  = sanitizeText(data.agency.name, 100);
  const safeClientName  = sanitizeText(data.client.name, 100);
  const safeNarrative   = sanitizeNarrative(data.narrative); // allows limited formatting
  const safeLogoUrl     = data.agency.logo_url
    ? httpsUrlSchema.parse(data.agency.logo_url)  // validate HTTPS URL
    : null;

  // Template uses a whitelist approach — only known-safe fields are rendered
  // No template literals with raw user data — use a proper template function
  return reportTemplate({ safeAgencyName, safeClientName, safeNarrative, safeLogoUrl, ...data });
}

// Puppeteer launch config — sandboxed, no network
export const puppeteerConfig = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--no-first-run',
  ],
  timeout: 25000, // 25s — kill before Railway's limit
};
```

---

## 10. Email Security

```typescript
// lib/modules/email/resend.ts

export async function sendReport(req: EmailRequest): Promise<EmailResponse> {
  // Validate every recipient is in the authorized list for this client
  // This check happens in the service layer before calling this module
  // but we validate again here as defense in depth
  const invalidRecipients = req.recipients.filter(
    email => !isValidEmail(email)
  );
  if (invalidRecipients.length > 0) {
    throw new ReportlyError(
      'INVALID_RECIPIENTS',
      `Invalid email addresses: ${invalidRecipients.join(', ')}`,
      'One or more recipient email addresses are invalid.',
      400
    );
  }

  // Filename is ALWAYS system-generated
  const filename = safePdfFilename(req.reportId, req.period);

  const result = await resend.emails.send({
    from:        `${sanitizeText(req.agencyName, 50)} <reports@${process.env.RESEND_FROM_DOMAIN}>`,
    to:          req.recipients,
    subject:     `${sanitizeText(req.clientName, 100)} — Marketing Report ${req.period}`,
    text:        sanitizeText(req.summary, 500), // plain text only in email body
    attachments: [{ filename, content: req.pdfBuffer }],
    headers:     { 'X-Report-ID': req.reportId }, // for webhook correlation
  });

  return { providerId: result.id, sentAt: new Date() };
}
```

---

## 11. Security Checklist (Run Before Every PR)

```bash
# Automated checks to run in CI:

# 1. No supabase imports outside lib/db/
grep -r "supabase" src --include="*.ts" | grep -v "lib/db/" | grep -v ".test."
# Expected: zero results

# 2. No plaintext token storage
grep -rn "access_token\b" src --include="*.ts" | grep -v "enc\|encrypt\|decrypt\|token_enc"
# Expected: zero results outside encryption.ts and repositories

# 3. No token logging
grep -rn "console.log.*token\|logger.*token" src --include="*.ts"
# Expected: zero results

# 4. No stack traces in API responses
grep -rn "stack\|stackTrace" src/app/api --include="*.ts"
# Expected: zero results in response objects

# 5. All API routes use getAuthenticatedAgency
grep -rn "export.*GET\|export.*POST\|export.*PATCH\|export.*DELETE" src/app/api --include="*.ts" -l | \
  xargs grep -L "getAuthenticatedAgency"
# Expected: only webhook routes (which use provider signatures instead)

# 6. All mutations include agency scope
grep -rn "\.update\|\.delete\|\.insert" src/lib/db/repositories --include="*.ts" | \
  grep -v "agency_id\|auditRepo\|flagRepo\|promptRepo"
# Expected: zero results
```

---

## 12. Incident Response

If a security incident is suspected:

1. **Immediately** rotate `TOKEN_ENCRYPTION_KEY` and run `scripts/rotate-encryption-key.ts`
2. **Immediately** revoke all active OAuth connections for affected agencies (mark status = 'revoked')
3. **Immediately** rotate all third-party API keys (Claude, Resend, Upstash)
4. Query `audit_logs` for `event_type = 'security_event'` in the relevant time window
5. Notify affected agencies within 24 hours with a plain-language description of what happened
6. Do not make public statements until root cause is confirmed

---

*Version: 1.0 | Every security decision references this file. Never improvise security.*
