# REPORTLY — Reusability, Architecture & Software Practices
> **Authority:** All modularity decisions, reusability patterns, shared utilities, and software engineering principles live here.
> **Rule:** Before writing any new class, function, or module — check if a pattern here already solves it. Code duplication is a bug.

---

## 0. Reusability Principles

- **Write once, configure many times.** A module that fetches GA4 data and a future module that fetches Meta data should share 90% of their logic through shared abstractions.
- **Interfaces over implementations.** Depend on what a thing does, not what it is. Swap Puppeteer for pdf-lib by changing one file.
- **Composition over inheritance.** Build complex behaviour from small, tested, single-purpose functions.
- **Configuration over conditionals.** A conditional that says `if platform === 'ga4' ... else if platform === 'meta'` in service code is a design failure. Use the adapter pattern instead.
- **Every utility must be independently testable.** If it needs a database connection or an API key to test, it's not a utility — it's a service.

---

## 1. Adapter Pattern — Data Source Integrations

Every data integration (GA4, Meta, Google Ads, future platforms) implements the same interface. The report pipeline never knows which platform it's talking to.

```typescript
// lib/types/adapters.ts

export interface FetchResult {
  raw: Record<string, unknown>;      // raw API response — stored in audit log
  metrics: RawMetricSet;             // transformed, not yet validated
  retrievedAt: Date;
  platform: Platform;
  periodStart: Date;
  periodEnd: Date;
}

export interface DataSourceAdapter {
  platform:   Platform;
  connect(clientId: string, authCode: string): Promise<void>;
  refresh(clientId: string): Promise<boolean>;   // returns false if refresh fails
  fetch(clientId: string, period: ReportPeriod): Promise<FetchResult>;
  isConnected(clientId: string): Promise<boolean>;
  disconnect(clientId: string): Promise<void>;
}

// lib/modules/analytics/ga4/index.ts — implements DataSourceAdapter
export const ga4Adapter: DataSourceAdapter = {
  platform: 'ga4',
  connect:     (clientId, code)   => ga4OAuth.handleCallback(clientId, code),
  refresh:     (clientId)         => ga4OAuth.refreshToken(clientId),
  fetch:       (clientId, period) => ga4Fetcher.fetchMetrics(clientId, period),
  isConnected: (clientId)         => connectionRepo.isConnected(clientId, 'ga4'),
  disconnect:  (clientId)         => connectionRepo.markDisconnected(clientId, 'ga4'),
};

// Registry — add new adapters here when new platforms are built
// lib/modules/analytics/registry.ts
import { ga4Adapter } from './ga4';

const adapters: Record<Platform, DataSourceAdapter> = {
  ga4:        ga4Adapter,
  meta:       metaAdapter,       // V2 — same interface
  gsc:        gscAdapter,        // V2
  google_ads: googleAdsAdapter,  // V2
};

export function getAdapter(platform: Platform): DataSourceAdapter {
  const adapter = adapters[platform];
  if (!adapter) throw new ReportlyError('UNSUPPORTED_PLATFORM', `No adapter for ${platform}`, 'Platform not supported.', 400);
  return adapter;
}
```

---

## 2. Pipeline Builder — Composable Report Generation

The report pipeline is a sequence of steps. Each step is independent, typed, and testable. New steps can be added or removed without touching other steps.

```typescript
// lib/pipeline/pipeline.ts

export interface PipelineStep<TInput, TOutput> {
  name:     string;
  critical: boolean;  // if true, failure blocks pipeline; if false, degrade gracefully
  run(input: TInput, context: PipelineContext): Promise<TOutput>;
  onFailure?(error: Error, context: PipelineContext): Promise<Partial<TOutput>>;
}

export interface PipelineContext {
  reportId:  string;
  agencyId:  string;
  clientId:  string;
  platform:  Platform;
  period:    ReportPeriod;
  logger:    AuditLogger;
}

export class Pipeline<T extends Record<string, unknown>> {
  private steps: PipelineStep<Partial<T>, Partial<T>>[] = [];

  addStep(step: PipelineStep<Partial<T>, Partial<T>>): this {
    this.steps.push(step);
    return this; // fluent API — chain .addStep().addStep()
  }

  async run(initial: Partial<T>, context: PipelineContext): Promise<T> {
    let state: Partial<T> = initial;

    for (const step of this.steps) {
      try {
        const result = await step.run(state, context);
        state = { ...state, ...result };
        await context.logger.log({ event: 'step_complete', step: step.name });
      } catch (error) {
        await context.logger.log({ event: 'step_failed', step: step.name, error });

        if (step.critical) {
          throw error; // block entire pipeline
        }
        // Non-critical: call onFailure for graceful degradation
        if (step.onFailure) {
          const fallback = await step.onFailure(error as Error, context);
          state = { ...state, ...fallback };
        }
        // Continue to next step regardless
      }
    }

    return state as T;
  }
}

// Usage in reportService.ts:
const reportPipeline = new Pipeline<ReportState>()
  .addStep(fetchDataStep)       // critical: true
  .addStep(validateDataStep)    // critical: true
  .addStep(generateNarrativeStep) // critical: false — falls back to rule-based
  .addStep(generateChartsStep)  // critical: false — falls back to tables
  .addStep(generatePDFStep)     // critical: false — falls back to HTML
  .addStep(auditLogStep);       // critical: false — never blocks
```

---

## 3. Shared Utilities

### 3.1 Retry with Exponential Backoff

```typescript
// lib/utils/retry.ts
// Used by: ga4 fetcher, meta fetcher, AI caller, email sender, PDF generator

export interface RetryOptions {
  maxAttempts:  number;
  baseDelayMs:  number;
  maxDelayMs:   number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?:     (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, shouldRetry, onRetry } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error;
      const isLast = attempt === maxAttempts;
      const shouldStop = shouldRetry && !shouldRetry(err);

      if (isLast || shouldStop) throw err;

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.random() * 1000; // prevent thundering herd
      onRetry?.(attempt, err);
      await sleep(delay + jitter);
    }
  }
  throw new Error('Retry exhausted'); // TypeScript needs this
}

// Pre-configured retry profiles for each use case
export const retryProfiles = {
  apiCall: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs:  30000,
    shouldRetry: (e: Error) => !e.message.includes('401'), // don't retry auth failures
  },
  aiCall: {
    maxAttempts: 2,
    baseDelayMs: 2000,
    maxDelayMs:  10000,
  },
  emailSend: {
    maxAttempts: 3,
    baseDelayMs: 60000,  // 1 min, 2 min, 4 min
    maxDelayMs:  300000,
  },
};
```

### 3.2 Circuit Breaker

```typescript
// lib/utils/circuitBreaker.ts
// Prevents hammering a failing service. Used for GA4, Meta, AI APIs.

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime?: Date;

  constructor(
    private readonly name: string,
    private readonly threshold: number = 5,     // failures before opening
    private readonly resetTimeMs: number = 60000 // 1 min before trying again
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const elapsed = Date.now() - (this.lastFailureTime?.getTime() ?? 0);
      if (elapsed < this.resetTimeMs) {
        throw new ReportlyError(
          'CIRCUIT_OPEN',
          `Circuit breaker open for ${this.name}`,
          `${this.name} is temporarily unavailable. Please try again later.`,
          503
        );
      }
      this.state = 'half-open';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Shared breaker instances — one per external service
export const breakers = {
  ga4:   new CircuitBreaker('GA4 API', 5, 60000),
  meta:  new CircuitBreaker('Meta API', 5, 60000),
  ai:    new CircuitBreaker('Claude API', 3, 30000),
  email: new CircuitBreaker('Resend', 3, 120000),
};
```

### 3.3 Notification System

```typescript
// lib/utils/notify.ts
// Single function for all "notify agency" calls — used in 12+ failure scenarios

export type NotificationEvent =
  | 'connection_error'
  | 'report_failed'
  | 'report_ready_for_review'
  | 'email_delivery_failed'
  | 'data_incomplete'
  | 'job_dlq'
  | 'token_expired';

export interface Notification {
  agencyId:   string;
  event:      NotificationEvent;
  clientName?: string;
  reportId?:  string;
  message:    string;
  actionUrl?: string;
}

export async function notifyAgency(notification: Notification): Promise<void> {
  // In MVP: in-app notification stored in DB + shown in dashboard
  // In V2: optionally also send email to agency admin
  await notificationRepo.create(notification);
  // Future: emit to Supabase realtime for live dashboard updates
}

// Usage — replaces all the scattered "notify agency" logic:
await notifyAgency({
  agencyId:   client.agency_id,
  event:      'connection_error',
  clientName: client.name,
  message:    `GA4 connection for ${client.name} requires reconnection.`,
  actionUrl:  `/dashboard/clients/${client.id}/connections`,
});
```

### 3.4 Feature Flag Checker

```typescript
// lib/utils/featureFlags.ts

const cache = new Map<string, { value: boolean; expiresAt: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function isEnabled(flagName: string): Promise<boolean> {
  // Check environment override first (for local dev / CI)
  const envKey = `FF_${flagName.toUpperCase().replace(/-/g, '_')}`;
  if (process.env[envKey] !== undefined) {
    return process.env[envKey] === 'true';
  }

  // Check cache
  const cached = cache.get(flagName);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  // Fetch from DB
  const value = await flagRepo.getFlag(flagName);
  cache.set(flagName, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
}

// Usage with graceful default:
if (await isEnabled('ai-narrative')) {
  result = await aiModule.generateNarrative(metrics);
} else {
  result = await fallbackEngine.generate(metrics);
}
```

### 3.5 Shared Date/Period Utilities

```typescript
// lib/utils/period.ts
// All report period calculations live here — never inline date math

export interface ReportPeriod {
  start: Date;
  end:   Date;
  label: string; // "March 2025"
}

export function getCurrentReportPeriod(): ReportPeriod {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); // first of last month
  const end   = new Date(now.getFullYear(), now.getMonth(), 0);     // last of last month
  return {
    start,
    end,
    label: start.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  };
}

export function getPriorPeriod(period: ReportPeriod): ReportPeriod {
  return getCurrentReportPeriod(); // shift back one more month
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]; // "2025-03-01"
}

export function isWithinFreshnessWindow(retrievedAt: Date, maxAgeHours: number): boolean {
  const ageMs = Date.now() - retrievedAt.getTime();
  return ageMs <= maxAgeHours * 60 * 60 * 1000;
}
```

---

## 4. UI Component Reusability

### 4.1 Shared Component Library (Dashboard)

```typescript
// Every UI pattern that appears more than once gets a shared component

// components/ui/MetricCard.tsx
interface MetricCardProps {
  label:      string;
  value:      string | number;
  priorValue: string | number;
  delta:      number;           // percentage
  source:     string;           // "Google Analytics"
  confidence: 'high' | 'partial' | 'unverified';
}
// Used in: dashboard overview, report review screen, PDF template

// components/ui/ConnectionStatus.tsx
interface ConnectionStatusProps {
  platform:     Platform;
  status:       'connected' | 'disconnected' | 'error' | 'revoked';
  lastSyncedAt: Date | null;
}
// Used in: client list, client detail page, onboarding wizard

// components/ui/ConfidenceBadge.tsx
interface ConfidenceBadgeProps {
  level: 'high' | 'partial' | 'unverified';
}
// Used in: report review screen, report history list

// components/ui/StatusBadge.tsx
interface StatusBadgeProps {
  status: ReportStatus;
}
// Used in: report list, client dashboard, admin panel

// components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon:    React.ReactNode;
  title:   string;
  message: string;
  action?: { label: string; href: string };
}
// Used in: every empty list in the app
```

---

## 5. Software Development Principles (Enforced)

### 5.1 SOLID Applied to Reportly

**Single Responsibility**
- `ga4Fetcher.ts` — only fetches GA4 data. Does not validate, transform, or store.
- `metricValidator.ts` — only validates metrics. Does not fetch or transform.
- `auditLogger.ts` — only writes audit events. Does not format or filter.

**Open/Closed**
- New data sources: add a new adapter file implementing `DataSourceAdapter`. Do not modify existing adapters or the pipeline.
- New pipeline steps: add a new `PipelineStep`. Do not modify existing steps.

**Liskov Substitution**
- All `DataSourceAdapter` implementations are interchangeable in the pipeline. The pipeline never checks `if platform === 'ga4'`.

**Interface Segregation**
- `DataSourceAdapter` has only 5 methods. Not 20. Each module gets the minimum interface it needs.

**Dependency Inversion**
- `reportService.ts` depends on `DataSourceAdapter` (interface), not `ga4Adapter` (implementation).
- Swap the concrete adapter by changing the registry — the service never changes.

### 5.2 DRY — Don't Repeat Yourself
- Rate limiting logic: `withRetry()` utility — one place, used everywhere
- Agency boundary check: `getAuthenticatedAgency()` — one place, used in every route
- Soft-delete filter: `is('deleted_at', null)` — enforced in repositories, not scattered in services
- Error handling: `ReportlyError` — one type, one handler per route

### 5.3 YAGNI — You Aren't Gonna Need It
- Build Meta Ads adapter only when Meta Ads is in scope (V2)
- Build weekly reports only when weekly reports are in scope (V2)
- Do not add configuration options "just in case" — add them when the case arrives
- Exception: adapter interfaces and pipeline abstractions are built now because V2 will definitely need them

### 5.4 Fail Fast
- Validate inputs at the route boundary before calling any service
- Check feature flags before starting any job — not halfway through
- Verify OAuth token validity before initiating a data fetch — not after spending quota

---

## 6. Testing Strategy

### 6.1 What Gets Tested and How

```
Unit Tests (Jest):
  lib/validators/metricValidator.ts     — all 5 validation rules, all edge cases
  lib/validators/outputValidator.ts     — all speculative language patterns
  lib/modules/ai/fallback.ts            — all metric templates with sample data
  lib/utils/retry.ts                    — all backoff calculations, shouldRetry logic
  lib/utils/circuitBreaker.ts           — all state transitions
  lib/security/encryption.ts            — encrypt/decrypt round-trip, tamper detection
  lib/security/sanitizer.ts             — XSS payloads, control characters, length limits
  lib/utils/period.ts                   — all date calculations

Integration Tests (Jest + Supabase local):
  lib/db/repositories/*                 — all queries against local Supabase
  lib/modules/analytics/ga4/transformer — real GA4 response shapes
  lib/pipeline/pipeline.ts              — full pipeline with mocked steps

End-to-End Tests (Playwright):
  Full onboarding flow
  GA4 connection flow (using Google Demo Account)
  Report generation → review → approval → delivery
  Failed delivery → dashboard shows error

Load Tests (k6):
  50 simultaneous report jobs at month-end
  API rate limit behaviour under sustained load
```

### 6.2 Test Data Strategy

```typescript
// tests/fixtures/metrics.ts — shared test fixtures

export const validGA4Metrics: ValidatedMetricSet = {
  platform: 'ga4',
  periodStart: new Date('2025-03-01'),
  periodEnd:   new Date('2025-03-31'),
  validated: {
    sessions:         { value: 12450, prior: 10200, delta: 22.1, status: 'valid' },
    users:            { value: 9830,  prior: 8100,  delta: 21.4, status: 'valid' },
    bounceRate:       { value: 42.3,  prior: 45.1,  delta: -6.2, status: 'valid' },
    avgSessionDuration: { value: 187, prior: 165,   delta: 13.3, status: 'valid' },
  },
};

export const partialGA4Metrics: ValidatedMetricSet = {
  ...validGA4Metrics,
  validated: {
    ...validGA4Metrics.validated,
    // One metric fails validation
    sessions: { value: null, prior: 10200, delta: null, status: 'unreliable' },
  },
};

export const spikeGA4Metrics: ValidatedMetricSet = {
  ...validGA4Metrics,
  validated: {
    ...validGA4Metrics.validated,
    // 400% spike — should be flagged
    sessions: { value: 51000, prior: 10200, delta: 400, status: 'unreliable' },
  },
};
```

---

## 7. Code Review Checklist

Before any PR is merged:

```
ARCHITECTURE
  [ ] No new cross-module imports (modules only communicate through index.ts)
  [ ] No direct supabase imports outside lib/db/
  [ ] New data sources implement DataSourceAdapter interface
  [ ] New pipeline steps use PipelineStep interface
  [ ] No new retry logic — uses withRetry() utility
  [ ] No new notification logic — uses notifyAgency() utility

CODE QUALITY
  [ ] No function longer than 40 lines
  [ ] No file longer than 200 lines (split if exceeded)
  [ ] No magic numbers — use named constants
  [ ] No any types — use unknown and narrow
  [ ] All async functions have try/catch or are inside Pipeline step

TESTS
  [ ] New utility functions have unit tests
  [ ] New repository functions have integration tests
  [ ] New validation rules tested with edge cases
  [ ] Test fixtures added for new data shapes

REUSABILITY
  [ ] No logic copy-pasted from another file — extract to utility instead
  [ ] New UI patterns that will appear more than once are extracted to components/ui/
  [ ] New configuration values are in constants.ts, not hardcoded
```

---

## 8. Constants File

```typescript
// lib/constants.ts — all magic numbers and config in one place

export const DATA_FRESHNESS = {
  GA4_MAX_AGE_HOURS:  48,
  META_MAX_AGE_HOURS: 72,
  STALE_THRESHOLD_HOURS: 168, // 7 days — do not use at all
} as const;

export const VALIDATION = {
  SPIKE_THRESHOLD_PERCENT:    300,
  MIN_METRICS_REQUIRED_RATIO: 0.5,  // 50% must be valid to proceed
  MAX_NARRATIVE_LENGTH:       10000,
  MAX_EDIT_LENGTH:            10000,
} as const;

export const RETRY = {
  API_MAX_ATTEMPTS:   3,
  AI_MAX_ATTEMPTS:    2,
  EMAIL_MAX_ATTEMPTS: 3,
  RATE_LIMIT_MIN_WAIT_MS: 60000,
} as const;

export const QUEUE = {
  MAX_DELAY_HOURS:  6,
  MIN_DELAY_HOURS:  0,
  BATCH_SIZE:       10,
} as const;

export const REPORT = {
  PDF_MAX_SIZE_BYTES: 5 * 1024 * 1024,  // 5MB
  AI_TIMEOUT_MS:      30000,
  PDF_TIMEOUT_MS:     25000,
} as const;

export const RATE_LIMITS = {
  LOGIN_MAX:    5,
  LOGIN_WINDOW: '15m',
  API_MAX:      100,
  API_WINDOW:   '1m',
} as const;
```

---

*Version: 1.0 | Check this file before writing any new abstraction.*
