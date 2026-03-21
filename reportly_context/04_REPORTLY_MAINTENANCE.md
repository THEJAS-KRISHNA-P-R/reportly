# REPORTLY — Maintenance, Engineering Practices & Operational Standards
> **Authority:** How the codebase is maintained, evolved, deployed, and kept healthy over time.
> **Rule:** Every operational decision — deployment, logging, versioning, dependency updates, incident response — references this file.

---

## 0. Core Maintenance Philosophy

- **The codebase must be understandable by a fresh developer in under 2 hours.** If it isn't, the code is too complex.
- **Prod is sacred.** No untested code touches production. No exceptions.
- **Observability before features.** You cannot fix what you cannot see.
- **Make it easy to do the right thing.** Linting, type checking, and CI catch mistakes — not code reviews.

---

## 1. Git Workflow

### Branch Naming
```
feature/   — new functionality    → feature/ga4-oauth
fix/       — bug fixes            → fix/null-metric-validation
chore/     — maintenance tasks    → chore/update-dependencies
security/  — security changes     → security/rotate-encryption-key
migration/ — DB schema changes    → migration/add-client-notes
```

### Commit Message Format (Conventional Commits)
```
type(scope): short description

feat(ga4):     add GA4 OAuth connection flow
fix(validator):handle null bounce rate from API
security(auth):add PKCE to OAuth flow
chore(deps):   update @anthropic-ai/sdk to 0.24.0
migration(db): add notes column to clients table
test(pipeline):add integration tests for fallback step
docs(readme):  update environment variable list
```

### PR Rules
- Every PR requires at least one passing CI run
- Every PR must reference a specific feature/fix — no "misc changes" PRs
- PRs touching `lib/db/repositories/` require a database test
- PRs touching `lib/security/` require the security checklist from `02_REPORTLY_SECURITY.md`
- PRs touching `lib/modules/ai/` require testing on 5 sample metric datasets
- No PR merges on Friday afternoons or before holidays

---

## 2. Environments

### Environment Definitions
```
local       — developer machine. Local Supabase, mock external APIs, FF_EMAIL_ENABLED=false
staging     — full production clone. Real APIs, test agency accounts, no real client data
production  — live system. All monitoring active.
```

### Environment Promotion Rules
```
local → staging:    any time, automated on PR merge to main
staging → production: manual trigger only, after staging validation passes
```

### Environment Variable Management
```bash
# Each environment has its own set:
.env.local        — local only, never committed
.env.staging      — managed in Vercel dashboard
.env.production   — managed in Vercel dashboard, restricted access

# Never share production keys with staging
# Staging uses separate Google OAuth client, separate Resend domain, separate Anthropic key
```

---

## 3. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml (structure)

on: [push, pull_request]

jobs:
  lint:
    - ESLint with strict TypeScript rules
    - Prettier format check
    - Run security grep checks from 02_REPORTLY_SECURITY.md Section 11

  type-check:
    - tsc --noEmit
    - Check no 'any' types introduced (custom ESLint rule)

  unit-tests:
    - Jest unit tests for all utilities, validators, and modules
    - Coverage threshold: 80% on lib/validators/, lib/utils/, lib/security/

  integration-tests:
    - Spin up local Supabase (via supabase CLI)
    - Run repository integration tests
    - Tear down

  security-scan:
    - npm audit --audit-level=high
    - Check for secrets in code (gitleaks or similar)
    - Verify no direct supabase imports outside lib/db/

  staging-deploy:
    - Only on merge to main
    - Deploy to Vercel staging + Railway staging
    - Run smoke tests against staging

  production-deploy:
    - Manual trigger only (workflow_dispatch)
    - Requires staging-deploy green
    - Deploy with zero-downtime (Vercel automatic)
    - Post-deploy smoke test
    - On failure: automatic rollback
```

---

## 4. Deployment Rules

### Zero-Downtime Deployment
- Vercel handles frontend deployments automatically — zero downtime
- Railway worker deployments: use rolling restart (Railway default)
- Database migrations run BEFORE code deployment, never after
- All migrations must be backward-compatible with the current production code

### Migration Safety
```
SAFE (run before deploy):
  ADD COLUMN with DEFAULT or nullable
  ADD INDEX (CONCURRENTLY in Postgres)
  ADD TABLE
  ADD CONSTRAINT on new column

UNSAFE (requires maintenance window or multi-step):
  DROP COLUMN (use deprecated label for one release cycle first)
  RENAME COLUMN (add new column → backfill → remove old, across 2 deploys)
  CHANGE COLUMN TYPE (same multi-step)
  REMOVE NOT NULL (safe) vs ADD NOT NULL (unsafe — backfill first)
```

### Rollback Procedure
```bash
# Application rollback (Vercel):
vercel rollback [deployment-url]    # instant — previous deployment is still live

# Worker rollback (Railway):
# Use Railway dashboard → select previous deployment → redeploy

# Database rollback:
# Run the rollback SQL from the migration file comments
# Every migration file must include: -- ROLLBACK: <sql>

# Feature flag immediate disable (fastest rollback):
# In admin panel → Feature Flags → toggle off
# Takes effect within 30 seconds (cache TTL)
```

---

## 5. Logging Standards

### What to Log (and Where)

```typescript
// lib/utils/logger.ts — structured logger, one instance

import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: ['*.token', '*.key', '*.secret', '*.password', '*.authorization'],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err, // standard error serializer
  },
});

// Structured logging — always include context fields:
logger.info({ reportId, agencyId, clientId, step: 'data_fetch' }, 'Starting GA4 data fetch');
logger.error({ reportId, agencyId, err }, 'GA4 data fetch failed after 3 attempts');

// NEVER:
console.log(token);              // never log tokens
logger.info(rawApiResponse);     // never log full API responses (use audit_logs table)
logger.error(error.stack);       // never expose stack traces in structured logs
```

### Log Levels
```
DEBUG — local/staging only. Detailed flow tracing.
INFO  — production. Key lifecycle events: job started, report generated, email sent.
WARN  — production. Degraded operation: fallback activated, metric flagged, retry attempt.
ERROR — production. Failure requiring attention: job failed, DLQ entry, API unreachable.
```

### What Goes Where
```
Application logs (Logtail/stdout):
  Job lifecycle events (started, completed, failed)
  API call outcomes (success, retry, failure)
  System warnings (fallback activated, circuit breaker opened)

Audit logs (audit_logs table):
  Everything that happened to a specific report
  Security events (failed auth attempts, invalid access)
  User actions (edits, approvals)

Error monitoring (Sentry or similar):
  Unhandled exceptions
  Performance degradations
  Alert on: error rate > 1%, P95 latency > 5s
```

---

## 6. Monitoring and Alerting

### What to Monitor in Production

```typescript
// Key metrics to track:

// Business metrics (check daily)
const businessMetrics = [
  'reports_generated_today',
  'reports_failed_today',
  'reports_awaiting_approval',
  'dlq_items_unresolved',
  'agencies_with_broken_connections',
];

// System metrics (alert immediately)
const systemAlerts = {
  error_rate:          '> 1% of requests in 5 min window',
  dlq_count:           '> 0 unresolved items',
  job_queue_depth:     '> 100 queued jobs',
  api_rate_limit:      '> 80% of GA4 quota used',
  email_bounce_rate:   '> 5% of sent emails',
  token_expiry_soon:   'any token expiring in < 24 hours',
};
```

### Alert Routing
```
Critical (page immediately):
  Report pipeline completely blocked
  Database connection failure
  All email delivery failing
  Security event detected

High (notify within 30 min):
  DLQ has new items
  Multiple client connections broken
  AI API circuit breaker opened

Medium (next business day):
  Dependency security advisory
  Approaching API quota limits
  Staging deployment failed
```

---

## 7. Dependency Management

### Dependency Principles
- **Fewer dependencies = fewer attack surfaces.** Every new dependency is a security and maintenance decision, not just a feature decision.
- **Pin exact versions in production.** `"@anthropic-ai/sdk": "0.24.0"` not `"^0.24.0"`.
- **Review changelogs before updating.** Breaking changes in AI SDKs are common.
- **Run `npm audit` in CI on every PR.** High severity audits block the build.

### Update Schedule
```
Weekly:   npm audit — check for security advisories
Monthly:  Review and apply patch versions (0.x.Y)
Quarterly: Evaluate minor version updates (0.X.y), test in staging first
As needed: Major version updates with full regression testing
```

### When a Critical Security Vulnerability is Found
1. Pin the affected package to the last safe version immediately
2. Create a `security/patch-[package-name]` branch
3. Apply fix and run full test suite
4. Deploy to staging, validate, deploy to production same day
5. Document in `SECURITY_CHANGELOG.md`

---

## 8. Technical Debt Management

### How Technical Debt is Tracked

Every piece of intentional technical debt gets a comment:
```typescript
// TODO(tech-debt): This validation is simplified for MVP.
// Full validation should check historical seasonality before flagging spikes.
// Track in: https://github.com/yourrepo/issues/42
// Priority: Medium | Target: V2 release
```

### Debt Categories
```
CRITICAL:  Blocks scale or creates security risk. Fix before next release.
HIGH:      Causes friction in development. Fix in next sprint.
MEDIUM:    Known limitation. Fix in current quarter.
LOW:       Nice to have. Fix when touching that area anyway.
```

### Monthly Tech Debt Review
- List all `TODO(tech-debt)` comments in codebase: `grep -rn "TODO(tech-debt)" src/`
- Triage by category
- Schedule at least 20% of each sprint for debt reduction

---

## 9. Versioning Strategy (Semantic Versioning)

```
MAJOR (X.0.0): Breaking change visible to agencies (new auth flow, changed report format)
MINOR (0.X.0): New feature (new data integration, new report section)
PATCH (0.0.X): Bug fix, performance improvement, security patch

Report template versioning (separate from app version):
  template_version: "1.0" → "1.1" for layout changes, "2.0" for complete redesign
  prompt_version:   "v1.0" → "v1.1" for wording tweaks, "v2.0" for structural changes
  logic_version:    "1.0" → bumps when metric calculation logic changes
```

---

## 10. Performance Standards

### Targets (Non-Negotiable for V1 Ship)
```
Dashboard page load:      < 2 seconds
API response (reads):     < 500ms P95
API response (mutations): < 1000ms P95
Report generation:        < 3 minutes end-to-end
PDF generation:           < 30 seconds
Email delivery:           < 2 minutes post-approval
Database queries:         < 100ms P95
```

### Performance Review Process
- Run `EXPLAIN ANALYZE` on any new query before merging
- Check Vercel analytics for Core Web Vitals on every release
- Load test the queue system before each month-end (first 3 months)

### Common Performance Rules
```typescript
// 1. Never SELECT * — select only needed columns
await db.from('reports').select('id, status, period_start, client_id'); // not select('*')

// 2. Always paginate large lists
await db.from('audit_logs').select('*').range(0, 49); // max 50 per page

// 3. Use indexes — all WHERE clauses use indexed columns
// All indexes are defined in the schema migration — check before adding new queries

// 4. Batch operations — never loop individual inserts
await db.from('report_emails').insert(recipients.map(email => ({ report_id, recipient_email: email })));
```

---

## 11. Documentation Standards

### What Must Be Documented
```
Every public function in lib/: JSDoc comment with @param, @returns, @throws
Every module's index.ts: Module-level comment explaining what it does and does not do
Every migration file: What it changes + rollback SQL
Every feature flag: Description in feature_flags table + comment in code where it's checked
Every environment variable: Documented in .env.example with description and example value
```

### JSDoc Template
```typescript
/**
 * Fetches validated GA4 metrics for a client for the given period.
 * Automatically refreshes the OAuth token if expired.
 *
 * @param clientId - The Reportly client UUID
 * @param period   - The reporting period (start and end dates)
 * @returns        - Validated metric set with freshness status
 * @throws ReportlyError FETCH_FAILED if data cannot be retrieved after retries
 * @throws ReportlyError TOKEN_EXPIRED if token refresh fails
 */
export async function fetchGA4Metrics(clientId: string, period: ReportPeriod): Promise<FetchResult>
```

---

## 12. Onboarding a New Developer

If someone new joins this project, they should:

1. Read `REPORTLY_CLAUDE_CONTEXT.md` — understand what we're building and why
2. Read `01_REPORTLY_DATABASE.md` — understand the data model
3. Read `02_REPORTLY_SECURITY.md` — understand the security model before touching any code
4. Read `03_REPORTLY_REUSABILITY.md` — understand the architectural patterns
5. Read this file — understand how we maintain it
6. Run the project locally using the bootstrap prompt
7. Write a simple new feature (e.g., add a new field to client notes) from scratch — tests + PR + review
8. Shadow a real incident in the DLQ admin panel before owning production

---

*Version: 1.0 | A codebase is a living system — this file evolves with it.*
