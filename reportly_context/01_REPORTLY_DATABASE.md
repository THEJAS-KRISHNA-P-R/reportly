# REPORTLY — Database & Query Reference
> **Authority:** All database decisions, schema definitions, query patterns, and migration rules live here. No DB logic exists anywhere else.
> **Rule:** Every query in the codebase must be traceable back to a function in `lib/db/repositories/`. If a query isn't in this file's patterns, it shouldn't exist.

---

## 0. Core Database Principles

- **One client, one place.** `lib/db/client.ts` is the only file that imports from `@supabase/supabase-js`. Everything else uses repositories.
- **Agency boundary on every query.** No query fetches data without scoping to `agency_id`. RLS is the last line of defense — the app enforces it first.
- **Parameterized always.** No string interpolation in queries. Ever.
- **Repositories return domain types.** Never return raw Supabase response shapes to services.
- **Soft delete everywhere.** `deleted_at IS NULL` on every active-record query. No `DELETE` statements in application code.
- **Idempotency built in.** Upserts and unique constraints prevent duplicate data at the DB level, not just the app level.

---

## 1. Supabase Client Setup

```typescript
// lib/db/client.ts — THE ONLY FILE that imports supabase

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase'; // generated types

// Server component client (reads cookies for session)
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

// Service role client — workers and server-side jobs only, bypasses RLS
// NEVER use in API routes that handle user requests
export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server only, never expose
    { auth: { persistSession: false } }
  );
}
```

---

## 2. Full Hardened Schema

```sql
-- ============================================================
-- 001_initial_schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AGENCIES
-- ============================================================
CREATE TABLE agencies (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email             text        UNIQUE NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  email_verified    boolean     NOT NULL DEFAULT false,
  logo_url          text        CHECK (logo_url IS NULL OR logo_url ~* '^https://'),
  brand_color       text        NOT NULL DEFAULT '#1E3A5F'
                                CHECK (brand_color ~* '^#[0-9A-Fa-f]{6}$'),
  plan              text        NOT NULL DEFAULT 'starter'
                                CHECK (plan IN ('starter','growth','pro','enterprise')),
  plan_client_limit int         NOT NULL DEFAULT 5 CHECK (plan_client_limit > 0),
  is_active         boolean     NOT NULL DEFAULT true,
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER agencies_updated_at
  BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AGENCY USERS
-- ============================================================
CREATE TABLE agency_users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       uuid        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email           text        NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  role            text        NOT NULL DEFAULT 'member'
                              CHECK (role IN ('admin','member')),
  is_active       boolean     NOT NULL DEFAULT true,
  last_login_at   timestamptz,
  failed_attempts int         NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, email)
);
CREATE TRIGGER agency_users_updated_at
  BEFORE UPDATE ON agency_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       uuid        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name            text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  contact_email   text        CHECK (contact_email IS NULL
                                OR contact_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  report_emails   text[]      NOT NULL
                              CHECK (array_length(report_emails, 1) BETWEEN 1 AND 10),
  schedule_day    int         NOT NULL DEFAULT 1 CHECK (schedule_day BETWEEN 1 AND 28),
  timezone        text        NOT NULL DEFAULT 'Asia/Kolkata'
                              CHECK (char_length(timezone) <= 50),
  is_active       boolean     NOT NULL DEFAULT true,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_clients_agency_active
  ON clients(agency_id) WHERE deleted_at IS NULL;

-- ============================================================
-- API CONNECTIONS
-- ============================================================
CREATE TABLE api_connections (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform          text        NOT NULL
                                CHECK (platform IN ('ga4','meta','gsc','google_ads')),
  access_token_enc  text        NOT NULL,   -- AES-256 encrypted, never plaintext
  refresh_token_enc text        NOT NULL,   -- AES-256 encrypted, never plaintext
  account_id        text        CHECK (char_length(account_id) <= 100),
  account_name      text        CHECK (char_length(account_name) <= 200),
  scopes_granted    text[],
  status            text        NOT NULL DEFAULT 'connected'
                                CHECK (status IN ('connected','disconnected','error','revoked')),
  last_synced_at    timestamptz,
  last_error        text        CHECK (char_length(last_error) <= 500),
  token_expires_at  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform)
);
CREATE TRIGGER api_connections_updated_at
  BEFORE UPDATE ON api_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_connections_client
  ON api_connections(client_id, platform);
CREATE INDEX idx_connections_expiring
  ON api_connections(token_expires_at)
  WHERE status = 'connected' AND token_expires_at IS NOT NULL;

-- ============================================================
-- METRIC SNAPSHOTS
-- ============================================================
CREATE TABLE metric_snapshots (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform            text        NOT NULL
                                  CHECK (platform IN ('ga4','meta','gsc','google_ads')),
  period_start        date        NOT NULL,
  period_end          date        NOT NULL CHECK (period_end >= period_start),
  raw_api_response    jsonb       NOT NULL,  -- immutable after insert
  validated_metrics   jsonb,
  validation_warnings text[],
  freshness_status    text        NOT NULL DEFAULT 'fresh'
                                  CHECK (freshness_status IN ('fresh','preliminary','stale')),
  data_retrieved_at   timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform, period_start, period_end)
);
-- Immutability: prevent raw_api_response from being changed after insert
CREATE OR REPLACE RULE protect_raw_snapshot AS
  ON UPDATE TO metric_snapshots
  WHERE OLD.raw_api_response IS DISTINCT FROM NEW.raw_api_response
  DO INSTEAD NOTHING;
CREATE INDEX idx_snapshots_client_period
  ON metric_snapshots(client_id, period_start DESC);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period_start          date        NOT NULL,
  period_end            date        NOT NULL CHECK (period_end >= period_start),
  prompt_version        text        NOT NULL CHECK (char_length(prompt_version) <= 20),
  template_version      text        NOT NULL CHECK (char_length(template_version) <= 20),
  logic_version         text        NOT NULL CHECK (char_length(logic_version) <= 20),
  ai_narrative_raw      text        CHECK (char_length(ai_narrative_raw) <= 10000),
  ai_narrative_edited   text        CHECK (char_length(ai_narrative_edited) <= 10000),
  rule_based_narrative  text        CHECK (char_length(rule_based_narrative) <= 10000),
  final_narrative       text        CHECK (char_length(final_narrative) <= 10000),
  narrative_source      text        CHECK (narrative_source IN ('ai','rule_based','none')),
  confidence_summary    jsonb,
  pdf_url               text        CHECK (pdf_url IS NULL OR pdf_url ~* '^https://'),
  pdf_generated_at      timestamptz,
  status                text        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                      'pending','generating','draft',
                                      'approved','sent','failed','cancelled')),
  generation_started_at timestamptz,
  approved_at           timestamptz,
  approved_by           uuid        REFERENCES agency_users(id) ON DELETE SET NULL,
  sent_at               timestamptz,
  cancelled_reason      text        CHECK (char_length(cancelled_reason) <= 300),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, period_start, period_end)
);
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Status machine enforced at DB level
CREATE OR REPLACE FUNCTION enforce_report_status_machine()
RETURNS TRIGGER AS $$
DECLARE
  allowed jsonb := '{
    "pending":    ["generating","cancelled"],
    "generating": ["draft","failed","cancelled"],
    "draft":      ["approved","cancelled"],
    "approved":   ["sent","failed"],
    "sent":       [],
    "failed":     ["pending"],
    "cancelled":  []
  }';
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NOT (allowed->OLD.status) @> to_jsonb(NEW.status) THEN
    RAISE EXCEPTION 'Invalid status transition: % → %', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER report_status_machine
  BEFORE UPDATE OF status ON reports
  FOR EACH ROW EXECUTE FUNCTION enforce_report_status_machine();

CREATE INDEX idx_reports_client_period ON reports(client_id, period_start DESC);
CREATE INDEX idx_reports_status
  ON reports(status) WHERE status NOT IN ('sent','cancelled');

-- ============================================================
-- AUDIT LOGS — append-only, immutable
-- ============================================================
CREATE TABLE audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid        NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  agency_id   uuid        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  event_type  text        NOT NULL CHECK (event_type IN (
    'api_fetch','validation','validation_failure',
    'ai_prompt','ai_response','ai_failure',
    'fallback_activated','output_rejected',
    'edit','approval',
    'pdf_generated','pdf_failed',
    'email_sent','email_failed',
    'job_dlq','token_refresh','token_revoked',
    'rate_limit_hit','security_event'
  )),
  actor_id    uuid        REFERENCES agency_users(id) ON DELETE SET NULL,
  payload     jsonb       NOT NULL,
  ip_address  inet,
  user_agent  text        CHECK (char_length(user_agent) <= 300),
  created_at  timestamptz NOT NULL DEFAULT now()
  -- No updated_at — audit logs never change
);
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
CREATE INDEX idx_audit_report   ON audit_logs(report_id, created_at DESC);
CREATE INDEX idx_audit_agency   ON audit_logs(agency_id, created_at DESC);

-- ============================================================
-- REPORT EMAILS
-- ============================================================
CREATE TABLE report_emails (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       uuid        NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  recipient_email text        NOT NULL
                              CHECK (recipient_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN (
                                'pending','sent','delivered','opened',
                                'bounced','failed','spam')),
  provider_id     text        CHECK (char_length(provider_id) <= 200),
  attempt_count   int         NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error      text        CHECK (char_length(last_error) <= 500),
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  bounced_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER report_emails_updated_at
  BEFORE UPDATE ON report_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- JOB QUEUE
-- ============================================================
CREATE TABLE job_queue (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bull_job_id   text        UNIQUE,
  job_type      text        NOT NULL
                            CHECK (job_type IN (
                              'fetch_data','generate_report',
                              'send_email','token_refresh')),
  agency_id     uuid        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id     uuid        REFERENCES clients(id) ON DELETE CASCADE,
  report_id     uuid        REFERENCES reports(id) ON DELETE CASCADE,
  payload       jsonb       NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'queued'
                            CHECK (status IN (
                              'queued','processing','completed',
                              'failed','dlq','cancelled')),
  attempts      int         NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts  int         NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  last_error    text        CHECK (char_length(last_error) <= 1000),
  scheduled_for timestamptz,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER job_queue_updated_at
  BEFORE UPDATE ON job_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_jobs_queued
  ON job_queue(scheduled_for, status) WHERE status = 'queued';

-- ============================================================
-- DEAD LETTER QUEUE
-- ============================================================
CREATE TABLE dead_letter_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid        NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  agency_id       uuid        NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  error_message   text        CHECK (char_length(error_message) <= 2000),
  stack_trace     text        CHECK (char_length(stack_trace) <= 5000),
  context         jsonb,
  resolved_at     timestamptz,
  resolved_by     uuid        REFERENCES agency_users(id) ON DELETE SET NULL,
  resolution_note text        CHECK (char_length(resolution_note) <= 500),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER dlq_updated_at
  BEFORE UPDATE ON dead_letter_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PROMPT VERSIONS
-- ============================================================
CREATE TABLE prompt_versions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_tag   text        UNIQUE NOT NULL CHECK (version_tag ~* '^v[0-9]+\.[0-9]+$'),
  prompt_text   text        NOT NULL CHECK (char_length(prompt_text) BETWEEN 100 AND 5000),
  test_results  jsonb,
  sample_count  int         CHECK (sample_count >= 20),
  deployed_at   timestamptz,
  deprecated_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_one_active_prompt
  ON prompt_versions(id)
  WHERE deployed_at IS NOT NULL AND deprecated_at IS NULL;

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
CREATE TABLE feature_flags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name   text        UNIQUE NOT NULL CHECK (flag_name ~* '^[a-z][a-z0-9-]+$'),
  enabled     boolean     NOT NULL DEFAULT false,
  description text        NOT NULL CHECK (char_length(description) BETWEEN 10 AND 300),
  updated_by  uuid        REFERENCES agency_users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE agencies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_connections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_emails    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Agencies see only themselves
CREATE POLICY agency_isolation ON agencies
  FOR ALL USING (id::text = auth.jwt()->>'agency_id');

-- All other tables: scoped via agency_id column
CREATE POLICY clients_isolation ON clients
  FOR ALL USING (agency_id::text = auth.jwt()->>'agency_id');
CREATE POLICY connections_isolation ON api_connections
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients
      WHERE agency_id::text = auth.jwt()->>'agency_id'
        AND deleted_at IS NULL
    )
  );
CREATE POLICY reports_isolation ON reports
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients
      WHERE agency_id::text = auth.jwt()->>'agency_id'
        AND deleted_at IS NULL
    )
  );
CREATE POLICY audit_isolation ON audit_logs
  FOR SELECT USING (agency_id::text = auth.jwt()->>'agency_id');
-- No INSERT/UPDATE/DELETE policies on audit_logs for users — service role only

-- Seed default feature flags
INSERT INTO feature_flags (flag_name, enabled, description) VALUES
  ('ai-narrative',    true,  'Enable Claude Haiku AI narrative generation'),
  ('email-delivery',  false, 'Enable automated email delivery to clients'),
  ('meta-integration',false, 'Enable Meta Ads OAuth and data fetching (V2)'),
  ('pdf-charts',      true,  'Include charts in PDF reports'),
  ('admin-panel',     true,  'Enable internal admin panel routes');
```

---

## 3. Repository Patterns

### 3.1 Base Repository Pattern

```typescript
// lib/db/repositories/_base.ts
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/db/client';
import { ReportlyError } from '@/lib/types/errors';

export function handleDbError(error: unknown, context: string): never {
  const msg = error instanceof Error ? error.message : 'Unknown DB error';
  throw new ReportlyError(
    'DB_ERROR',
    `[${context}] ${msg}`,
    'A database error occurred. Please try again.',
    500,
    { context }
  );
}
```

### 3.2 Client Repository

```typescript
// lib/db/repositories/clientRepo.ts
import { createSupabaseServerClient } from '@/lib/db/client';
import type { Client, CreateClientInput, UpdateClientInput } from '@/lib/types/report';
import { handleDbError } from './_base';

export async function getClientsByAgency(agencyId: string): Promise<Client[]> {
  const db = createSupabaseServerClient();
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('agency_id', agencyId)        // agency scope — always first
    .is('deleted_at', null)            // active only
    .order('created_at', { ascending: false });
  if (error) handleDbError(error, 'getClientsByAgency');
  return data ?? [];
}

export async function getClientById(clientId: string, agencyId: string): Promise<Client | null> {
  const db = createSupabaseServerClient();
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('agency_id', agencyId)        // ALWAYS double-scope: id + agency_id
    .is('deleted_at', null)
    .single();
  if (error) return null;             // not found → null, not throw
  return data;
}

export async function createClient(agencyId: string, input: CreateClientInput): Promise<Client> {
  const db = createSupabaseServerClient();
  const { data, error } = await db
    .from('clients')
    .insert({ ...input, agency_id: agencyId })  // agency_id from session, not input
    .select()
    .single();
  if (error) handleDbError(error, 'createClient');
  return data!;
}

export async function softDeleteClient(clientId: string, agencyId: string): Promise<void> {
  const db = createSupabaseServerClient();
  const { error } = await db
    .from('clients')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', clientId)
    .eq('agency_id', agencyId);       // never skip agency scope on mutations
  if (error) handleDbError(error, 'softDeleteClient');
}

export async function getClientsScheduledForDay(day: number): Promise<Client[]> {
  // Used by cron job — uses service role (bypasses RLS intentionally)
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('clients')
    .select('*, agencies!inner(id, name, logo_url, brand_color)')
    .eq('schedule_day', day)
    .eq('is_active', true)
    .is('deleted_at', null);
  if (error) handleDbError(error, 'getClientsScheduledForDay');
  return data ?? [];
}
```

### 3.3 Report Repository

```typescript
// lib/db/repositories/reportRepo.ts

export async function getOrCreateReport(
  clientId: string,
  agencyId: string,
  periodStart: string,
  periodEnd: string,
  versions: { prompt: string; template: string; logic: string }
): Promise<{ report: Report; created: boolean }> {
  // Idempotency: upsert on unique constraint (client_id, period_start, period_end)
  const db = createSupabaseServerClient();
  const existing = await getReportByPeriod(clientId, agencyId, periodStart, periodEnd);
  if (existing) return { report: existing, created: false };
  const { data, error } = await db
    .from('reports')
    .insert({
      client_id:        clientId,
      period_start:     periodStart,
      period_end:       periodEnd,
      prompt_version:   versions.prompt,
      template_version: versions.template,
      logic_version:    versions.logic,
      status:           'pending',
    })
    .select()
    .single();
  if (error) handleDbError(error, 'getOrCreateReport');
  return { report: data!, created: true };
}

export async function transitionReportStatus(
  reportId: string,
  agencyId: string,
  newStatus: ReportStatus,
  meta?: Partial<Report>
): Promise<Report> {
  // DB trigger enforces valid transitions — this just calls update
  // Invalid transition → DB raises exception → caught as DB_ERROR
  const db = createSupabaseServerClient();
  const { data, error } = await db
    .from('reports')
    .update({ status: newStatus, ...meta })
    .eq('id', reportId)
    .eq('client_id', db                // cross-join check via subquery
      .from('clients')
      .select('id')
      .eq('agency_id', agencyId)
    )
    .select()
    .single();
  if (error) handleDbError(error, 'transitionReportStatus');
  return data!;
}
```

### 3.4 Audit Repository

```typescript
// lib/db/repositories/auditRepo.ts
// Uses service role — audit logs written from workers and API routes equally

export async function writeAuditEvent(event: {
  reportId: string;
  agencyId: string;
  eventType: AuditEventType;
  payload: Record<string, unknown>;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const db = createSupabaseServiceClient();
  const sanitizedPayload = redactSensitiveKeys(event.payload);
  const { error } = await db.from('audit_logs').insert({
    report_id:  event.reportId,
    agency_id:  event.agencyId,
    event_type: event.eventType,
    payload:    sanitizedPayload,
    actor_id:   event.actorId ?? null,
    ip_address: event.ipAddress ?? null,
    user_agent: event.userAgent ?? null,
  });
  // Audit log failure must NEVER block the main flow
  // Log to stderr only, do not throw
  if (error) console.error('[AuditRepo] Failed to write audit event:', error.message);
}

function redactSensitiveKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = ['token', 'key', 'secret', 'password', 'authorization', 'cookie'];
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE.some(s => k.toLowerCase().includes(s))
        ? [k, '[REDACTED]']
        : [k, typeof v === 'object' && v !== null
            ? redactSensitiveKeys(v as Record<string, unknown>)
            : v]
    )
  );
}
```

### 3.5 Connection Repository

```typescript
// lib/db/repositories/connectionRepo.ts

export async function getConnection(
  clientId: string,
  platform: Platform
): Promise<ApiConnection | null> {
  // Returns decrypted tokens — called only in server-side workers
  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('api_connections')
    .select('*')
    .eq('client_id', clientId)
    .eq('platform', platform)
    .eq('status', 'connected')
    .single();
  if (error || !data) return null;
  return {
    ...data,
    access_token:  decrypt(data.access_token_enc),   // decrypt here, in repo
    refresh_token: decrypt(data.refresh_token_enc),  // never pass encrypted tokens to modules
  };
}

export async function upsertConnection(
  clientId: string,
  platform: Platform,
  tokens: { accessToken: string; refreshToken: string; expiresAt?: Date },
  meta: { accountId: string; accountName: string; scopes: string[] }
): Promise<void> {
  const db = createSupabaseServiceClient();
  const { error } = await db.from('api_connections').upsert({
    client_id:          clientId,
    platform,
    access_token_enc:   encrypt(tokens.accessToken),   // encrypt here, in repo
    refresh_token_enc:  encrypt(tokens.refreshToken),  // before it ever touches the DB
    token_expires_at:   tokens.expiresAt?.toISOString(),
    account_id:         meta.accountId,
    account_name:       meta.accountName,
    scopes_granted:     meta.scopes,
    status:             'connected',
    last_error:         null,
  }, { onConflict: 'client_id,platform' });
  if (error) handleDbError(error, 'upsertConnection');
}
```

---

## 4. Query Rules Reference

| Rule | Correct | Wrong |
|---|---|---|
| Always scope by agency | `.eq('agency_id', agencyId)` | `.eq('id', clientId)` alone |
| Soft delete filter | `.is('deleted_at', null)` | No deleted_at filter |
| Parameterized queries | `.eq('id', userId)` | `.rpc(\`WHERE id = '${userId}'\`)` |
| Not-found handling | `return null` | `throw new Error('not found')` |
| Token storage | `encrypt(token)` before insert | Raw token in DB |
| Token retrieval | `decrypt(data.token_enc)` in repo | Decrypting in service/module |
| Audit log failure | `console.error` only | `throw` — blocks main flow |
| Mutations | Always include agency scope | Trust RLS alone |

---

## 5. Migration Rules

- Every schema change = new numbered migration file (`002_add_xyz.sql`)
- Never edit existing migration files — they are immutable history
- Migrations must be backward-compatible OR gated by a feature flag
- Test every migration on a copy of production data before applying
- Always include a rollback SQL comment at the top of each migration file

```sql
-- 002_add_client_notes.sql
-- ROLLBACK: ALTER TABLE clients DROP COLUMN IF EXISTS notes;

ALTER TABLE clients
  ADD COLUMN notes text CHECK (char_length(notes) <= 1000);
```

---

*Version: 1.0 | This file is the single source of truth for all DB decisions.*
