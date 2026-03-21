# REPORTLY — Agent Context File
> **Who this is for:** AI coding agents (Cursor, GitHub Copilot, Claude Code, etc.) working on the Reportly codebase.
> **How to use:** Include this file in your agent's context window at the start of every coding session. Reference it for architecture decisions, naming, constraints, and non-negotiable rules.
> **Tone:** Dense. Technical. No fluff. Decisions already made — implement them, don't re-debate them.

---

## 0. TL;DR for Agents
- B2B SaaS, multi-tenant, agency reporting automation
- Stack: Next.js App Router + Supabase + Upstash Redis + Railway (workers) + Vercel (frontend)
- AI: Claude Haiku API. Fallback: rule-based Node.js engine. Never trust AI output without validation.
- PDF: Puppeteer on Railway. Never on Vercel (60s timeout).
- Email: Resend. Never send without agency approval. Never send incomplete reports.
- MVP scope: GA4 only, monthly only, 1 template.
- Primary rule: **fail loudly, degrade gracefully, never guess.**

---

## 1. Project Structure (Expected)
```
/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Login, register, verify pages
│   ├── (dashboard)/            # Agency dashboard (protected)
│   │   ├── clients/            # Client management
│   │   ├── reports/            # Report history, review, approval
│   │   └── settings/           # Agency branding, billing
│   ├── api/                    # API routes
│   │   ├── auth/               # NextAuth handlers
│   │   ├── oauth/              # GA4 + Meta OAuth callbacks
│   │   ├── clients/            # CRUD for clients
│   │   ├── reports/            # Report generation trigger, approval
│   │   ├── jobs/               # Job status endpoints
│   │   └── admin/              # Internal admin routes (IP-protected)
│   └── layout.tsx
├── lib/
│   ├── supabase/               # Supabase client (server + client)
│   ├── oauth/                  # GA4 + Meta OAuth helpers, token encryption
│   ├── fetchers/               # ga4.ts, meta.ts — data fetch + raw storage
│   ├── validators/             # Data validation layer (CRITICAL — see Section 4)
│   ├── ai/                     # Claude Haiku prompt builder + caller
│   ├── fallback/               # Rule-based narrative engine
│   ├── confidence/             # Confidence scoring logic
│   ├── pdf/                    # Puppeteer PDF generation (called via Railway)
│   ├── email/                  # Resend email sender
│   ├── queue/                  # BullMQ job definitions + queue client
│   └── audit/                  # Audit log writer
├── workers/                    # Railway background workers
│   ├── report-worker.ts        # Main report generation pipeline
│   ├── fetch-worker.ts         # Data fetch jobs
│   └── dlq-worker.ts           # Dead Letter Queue processor
├── prompts/
│   └── narrative-v1.txt        # Versioned AI prompt template
├── supabase/
│   └── migrations/             # All schema migrations
└── .env.local                  # Never commit. See Section 2.
```

---

## 2. Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only, never expose to client

# Encryption (AES-256 for OAuth tokens)
TOKEN_ENCRYPTION_KEY=               # 32-byte hex string, rotate quarterly

# OAuth — Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# OAuth — Meta (V2)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=

# AI
ANTHROPIC_API_KEY=                  # Never expose to frontend

# Email
RESEND_API_KEY=                     # Never expose to frontend
RESEND_FROM_DOMAIN=                 # e.g. reports.youragency.com

# Queue
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# PDF Worker (Railway internal URL)
RAILWAY_WORKER_URL=
RAILWAY_WORKER_SECRET=              # Shared secret for worker auth

# Admin
ADMIN_IP_ALLOWLIST=                 # Comma-separated IPs for /api/admin routes

# Feature Flags (override DB flags for local dev)
FF_AI_ENABLED=true
FF_EMAIL_ENABLED=true
FF_META_ENABLED=false               # V2 — disabled in MVP
```

---

## 3. Database Schema (Supabase / PostgreSQL)
All tables have Row-Level Security enabled. Agency ID is the isolation boundary.

```sql
-- Core agency account
agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  logo_url text,
  brand_color text DEFAULT '#1E3A5F',
  plan text DEFAULT 'starter',
  created_at timestamptz DEFAULT now()
)

-- Agency team members
agency_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at timestamptz DEFAULT now()
)

-- Agency clients (soft delete via deleted_at)
clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_email text,
  report_emails text[] NOT NULL,   -- multiple delivery addresses
  schedule_day int CHECK (schedule_day BETWEEN 1 AND 28) DEFAULT 1,
  timezone text DEFAULT 'Asia/Kolkata',
  deleted_at timestamptz,          -- NULL = active, timestamp = soft-deleted
  created_at timestamptz DEFAULT now()
)

-- OAuth tokens (AES-256 encrypted before insert)
api_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  platform text CHECK (platform IN ('ga4', 'meta', 'gsc', 'google_ads')),
  access_token_enc text NOT NULL,   -- encrypted
  refresh_token_enc text NOT NULL,  -- encrypted
  account_id text,                  -- GA4 property ID or Meta account ID
  status text CHECK (status IN ('connected', 'disconnected', 'error')) DEFAULT 'connected',
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, platform)
)

-- Raw + validated metrics per reporting period
metric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  raw_api_response jsonb NOT NULL,   -- full API response snapshot
  validated_metrics jsonb,           -- post-validation metric set
  validation_warnings text[],        -- list of flagged metric names
  freshness_status text CHECK (freshness_status IN ('fresh', 'preliminary', 'stale')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, platform, period_start, period_end)
)

-- Generated reports
reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  prompt_version text NOT NULL,
  template_version text NOT NULL,
  logic_version text NOT NULL,
  ai_narrative_raw text,             -- raw AI output
  ai_narrative_edited text,          -- agency-edited version
  rule_based_narrative text,         -- fallback narrative if AI failed
  final_narrative text,              -- what was actually sent
  narrative_source text CHECK (narrative_source IN ('ai', 'rule_based', 'none')),
  confidence_summary jsonb,          -- {overall: 'high'|'partial'|'unverified', per_metric: {...}}
  pdf_url text,
  status text CHECK (status IN ('pending', 'draft', 'approved', 'sent', 'failed', 'cancelled')),
  approved_at timestamptz,
  approved_by uuid REFERENCES agency_users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, period_start, period_end)    -- idempotency: one report per client per period
)

-- Full audit trail (append-only, never delete)
audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  event_type text NOT NULL,          -- 'api_fetch', 'validation', 'ai_prompt', 'ai_response',
                                     -- 'validation_failure', 'edit', 'approval', 'email_sent', etc.
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Email delivery tracking
report_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  status text CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'bounced', 'failed')),
  sent_at timestamptz,
  opened_at timestamptz,
  resend_id text                     -- Resend's message ID for webhook matching
)

-- Background job queue (BullMQ uses Redis; this table is for visibility/audit)
job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,            -- 'fetch_data', 'generate_report', 'send_email'
  client_id uuid REFERENCES clients(id),
  report_id uuid REFERENCES reports(id),
  status text CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'dlq')),
  attempts int DEFAULT 0,
  last_error text,
  next_retry_at timestamptz,
  created_at timestamptz DEFAULT now()
)

-- Dead Letter Queue
dead_letter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_id uuid REFERENCES job_queue(id),
  error_message text,
  stack_trace text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz            -- NULL = unresolved
)

-- Versioned AI prompts
prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_tag text UNIQUE NOT NULL,  -- e.g. 'v1.0', 'v1.1'
  prompt_text text NOT NULL,
  deployed_at timestamptz,
  deprecated_at timestamptz
)

-- Feature flags
feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  description text,
  updated_at timestamptz DEFAULT now()
)
```

---

## 4. Data Validation Layer (NON-NEGOTIABLE)
File: `lib/validators/metricValidator.ts`

Every metric must pass ALL checks before use. This runs BEFORE AI, BEFORE PDF, BEFORE anything.

```typescript
type ValidationResult = {
  metric: string;
  value: number | null;
  status: 'valid' | 'unreliable' | 'preliminary';
  warnings: string[];
};

// Checks to implement:
// 1. NULL CHECK: value === null || value === undefined → status: 'unreliable'
// 2. ZERO ANOMALY: value === 0 → cross-check against prior period. If prior > 100, flag 'unreliable'
// 3. SPIKE DETECTION: Math.abs(delta_percent) > 300 → flag 'unreliable' unless prior period confirms
// 4. FRESHNESS: data_retrieved_at > 48h ago (GA4) → status: 'preliminary'
// 5. COVERAGE: if data covers <80% of reporting period → status: 'preliminary'

// Flagged metrics must NOT be passed to AI prompt
// Flagged metrics show in report with warning: "Some metrics may be delayed or incomplete"
// If >50% of critical metrics fail → block report generation entirely
```

---

## 5. Critical vs Non-Critical Pipeline Steps

```
CRITICAL (failure BLOCKS report):
  ├── GA4 data fetch (HTTP error or empty response)
  └── Data validation (>50% of metrics flagged unreliable)

NON-CRITICAL (failure DEGRADES gracefully):
  ├── AI narrative → fallback to rule-based engine
  ├── Rule-based engine → send without narrative (labeled)
  ├── Chart generation → fall back to metric tables
  ├── Custom PDF styling → fall back to default template
  ├── PDF generation → fall back to HTML email
  └── Audit log write → log to error queue, do not block
```

---

## 6. AI Prompt Rules
File: `prompts/narrative-v1.txt` (versioned — never edit in place, create new version file)

**Rules for prompt engineering:**
- Always instruct: "Only make claims that are directly supported by the metric data provided."
- Always instruct: "Do not use speculative language ('likely due to', 'possibly because') unless the data explicitly supports the connection."
- Always include: validated metrics with their period-over-period deltas
- Always include: client name, reporting period, prior month summary (if exists)
- Never include: raw API response, internal system info, prompt version tag

**Output validation scan (implement in `lib/ai/outputValidator.ts`):**
```typescript
const SPECULATIVE_PATTERNS = [
  /likely due to/i, /possibly because/i, /might be/i,
  /could indicate/i, /perhaps/i, /we suspect/i, /probably/i
];
// If any pattern found without an adjacent metric citation → reject output, activate fallback
```

**Prompt versioning rule:**
- Current active version stored in `prompt_versions` table where `deprecated_at IS NULL`
- Never change the prompt text of an existing version — create a new row with new version_tag
- Test on 20 sample metric datasets before marking a new version as deployed

---

## 7. OAuth Token Handling
File: `lib/oauth/tokenEncryption.ts`

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  return iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

export function decrypt(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
}

// RULES:
// - encrypt() before every Supabase insert of a token
// - decrypt() only inside server-side functions (API routes, workers)
// - NEVER pass decrypted tokens to any client-side code
// - NEVER log tokens — use token.substring(0, 8) + '...' max in any debug log
```

---

## 8. Queue Architecture
Technology: Upstash Redis + BullMQ

**Queue names:**
- `report-generation` — main pipeline jobs
- `data-fetch` — GA4/Meta fetch jobs
- `email-delivery` — email send jobs
- `dead-letter` — failed jobs after all retries

**Job retry config:**
```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 60000 }, // 1min, 2min, 4min
  removeOnComplete: false, // keep for audit
  removeOnFail: false,     // move to DLQ manually
}
```

**Month-end spike prevention:**
```typescript
// When scheduling monthly report jobs, add random delay:
const delayMs = Math.random() * (6 * 60 * 60 * 1000); // 0 to 6 hours
await reportQueue.add('generate', { clientId }, { delay: delayMs });
```

**Idempotency check (always run before adding job):**
```typescript
const existing = await supabase
  .from('reports')
  .select('id')
  .eq('client_id', clientId)
  .eq('period_start', periodStart)
  .single();
if (existing.data) return; // already exists — do not re-queue
```

---

## 9. Report Generation Pipeline (Worker)
File: `workers/report-worker.ts`

```
1. Check client exists and not soft-deleted → else cancel job
2. Check API connection status → else notify agency, fail job
3. Attempt token refresh → if fails: mark disconnected, notify, fail job
4. Fetch GA4 data → if fails: retry 3x → if still fails: mark job failed, notify agency, push to DLQ
5. Write raw API response to audit_logs (event_type: 'api_fetch')
6. Run data validation layer on all metrics
7. If >50% critical metrics unreliable → block report, notify agency, fail job (CRITICAL PATH FAILED)
8. Write validation results to audit_logs (event_type: 'validation')
9. Build AI prompt from validated metrics + prompt_version
10. Write prompt to audit_logs (event_type: 'ai_prompt')
11. Call Claude Haiku API (30s timeout)
12. If AI fails or times out → activate rule-based fallback engine
13. Run output validation scan on AI response
14. If output fails validation → retry once with simplified prompt → else activate fallback
15. Write AI response to audit_logs (event_type: 'ai_response')
16. Calculate confidence scores per metric and overall
17. Create report record in DB (status: 'draft')
18. Trigger PDF generation via Railway worker
19. If PDF fails → retry reduced complexity → else generate HTML fallback
20. Update report record with pdf_url
21. Notify agency dashboard (report ready for review)
--- PIPELINE PAUSES HERE — agency must approve ---
22. [On approval] Lock report (status: 'approved')
23. Trigger email delivery job
24. Send via Resend with retry logic
25. Update report_emails with delivery status
26. Update report status: 'sent'
27. Write email delivery to audit_logs (event_type: 'email_sent')
```

---

## 10. Security Rules (Enforce in Every Route and Worker)

```typescript
// Every API route must:
// 1. Validate session
const { data: { session } } = await supabase.auth.getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// 2. Validate agency ownership before any data operation
const { data: client } = await supabase
  .from('clients')
  .select('agency_id')
  .eq('id', clientId)
  .single();
if (client?.agency_id !== session.user.agency_id) return 403;

// 3. Admin routes: check IP allowlist
const ip = request.headers.get('x-forwarded-for');
const allowed = process.env.ADMIN_IP_ALLOWLIST!.split(',');
if (!allowed.includes(ip)) return 403;

// RLS on Supabase handles the second layer — but always validate in app code too
```

---

## 11. Feature Flags
Table: `feature_flags`

```typescript
// lib/featureFlags.ts
export async function isEnabled(flagName: string): Promise<boolean> {
  // Check env var override first (for local dev)
  const envKey = `FF_${flagName.toUpperCase().replace('-', '_')}`;
  if (process.env[envKey] !== undefined) return process.env[envKey] === 'true';
  // Fall back to DB
  const { data } = await supabase.from('feature_flags').select('enabled').eq('flag_name', flagName).single();
  return data?.enabled ?? false;
}

// Required flags for MVP:
// 'ai-narrative'     — disable to force rule-based only
// 'email-delivery'   — disable to generate PDFs without sending
// 'meta-integration' — disabled in MVP (V2)
// 'pdf-charts'       — disable to fall back to tables
```

---

## 12. Audit Log Events (Use Exact Event Type Strings)
```typescript
type AuditEventType =
  | 'api_fetch'           // Raw API response stored
  | 'validation'          // Validation results stored
  | 'validation_failure'  // Critical validation failure
  | 'ai_prompt'           // AI prompt sent
  | 'ai_response'         // AI response received
  | 'ai_failure'          // AI API error or timeout
  | 'fallback_activated'  // Rule-based engine used
  | 'output_rejected'     // AI output failed validation
  | 'edit'                // Agency edited narrative {before, after, editor_id}
  | 'approval'            // Agency approved {approved_by, timestamp}
  | 'pdf_generated'       // PDF created {pdf_url}
  | 'pdf_failed'          // PDF generation failed {error}
  | 'email_sent'          // Email dispatched {recipient, resend_id}
  | 'email_failed'        // Email failed {recipient, error, attempt}
  | 'job_dlq'             // Job moved to Dead Letter Queue
```

---

## 13. Non-Negotiable Implementation Rules
1. **Never send a report without agency approval.** The `status` field must be `'approved'` before any email job is queued.
2. **Never log OAuth tokens.** Use `token.slice(0, 8) + '...'` maximum.
3. **Never expose Supabase service role key to frontend.** Only in server components and API routes.
4. **Never retry immediately after 429.** Minimum 60-second backoff.
5. **Never run PDF generation on Vercel.** Always on Railway worker (60s Vercel timeout).
6. **Never create duplicate reports.** Check unique constraint on (client_id, period_start, period_end) before queuing.
7. **Never fail silently.** Every error must be logged to audit_logs and surfaced in the dashboard.
8. **Always validate data before passing to AI.** The validation layer is not optional.
9. **Always store raw API response before processing.** The snapshot goes to audit_logs first.
10. **Feature flags on everything risky.** Especially AI calls, email sends, and any new integration.

---

*Version: 2.0 | Document type: Agent Context | Load at start of every coding session.*
