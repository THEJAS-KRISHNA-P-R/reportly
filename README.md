# Reportly

AI-assisted agency reporting platform with a reliability-first architecture:

- Multi-tenant agency/client data model
- OAuth analytics ingestion
- Validation-first report generation pipeline
- Queue-backed background execution and retry/DLQ handling
- Audit trail and correlation-based observability
- Admin tooling for operations and incident response

This repository contains the full web app, API layer, worker orchestration logic, pipeline steps, tests, and product context docs.

## Table of Contents

- [1. Product Overview](#1-product-overview)
- [2. Core Capabilities](#2-core-capabilities)
- [3. Architecture](#3-architecture)
- [4. Request to Report Flow](#4-request-to-report-flow)
- [5. Correlation and Observability](#5-correlation-and-observability)
- [6. Security Model](#6-security-model)
- [7. Queue Reliability Model](#7-queue-reliability-model)
- [8. Project Structure](#8-project-structure)
- [9. Prerequisites](#9-prerequisites)
- [10. Local Setup](#10-local-setup)
- [11. Environment Variables](#11-environment-variables)
- [12. Commands](#12-commands)
- [13. API Surface](#13-api-surface)
- [14. Testing Strategy](#14-testing-strategy)
- [15. Deployment and Operations](#15-deployment-and-operations)
- [16. Troubleshooting](#16-troubleshooting)
- [17. Source of Truth Docs](#17-source-of-truth-docs)

## 1. Product Overview

Reportly automates digital marketing report generation for agencies while preserving trust and human control.

At a high level, the platform:

1. Ingests analytics data through authenticated integrations.
2. Validates data quality before any narrative generation.
3. Runs a multi-step report pipeline (fetch -> validate -> narrative -> charts -> PDF -> audit).
4. Persists report artifacts and audit events.
5. Supports operational recovery through retries, stale lease recovery, and DLQ.

## 2. Core Capabilities

- Agency-scoped multi-tenancy with route and repository safeguards.
- Report generation queue with lease-aware worker execution.
- Idempotency and dedupe protections for report jobs.
- Structured logs with correlation IDs across request/job/pipeline/audit.
- Standardized API contract with typed success/error envelopes.
- Admin endpoints for DLQ, flags, and trace lookup.
- Playwright visual coverage and Jest unit/integration-style checks.

## 3. Architecture

### Application Layer

- Next.js App Router frontend and server routes.
- API routes under `src/app/api/**`.
- Proxy policy gate in `src/proxy.ts` for role/route routing decisions.

### Data Layer

- Supabase Postgres as primary data store.
- `createSupabaseServerClient` for session-aware reads/writes.
- `createSupabaseServiceClient` for background jobs and privileged server tasks.

### Worker and Queue Layer

- Queue table-backed orchestration via `job_queue` repository patterns.
- Worker polling/claiming/lease heartbeat in `src/workers/report-worker.ts`.
- Retry + DLQ movement with contextual failure metadata.

### Pipeline Layer

- Step orchestration in `src/lib/pipeline/pipeline.ts`.
- Step modules in `src/lib/pipeline/steps/**`.
- Critical and non-critical step behavior with timeout boundaries.

### API Contract Layer

- Shared contract helpers in `src/lib/api-contract.ts`.
- Schema-validated body parsing through `parseJsonBody(...)` using Zod.
- Typed response envelopes:
	- Success: `{ ok: true, data: ... }`
	- Error: `{ ok: false, error: { code, message, details? } }`
- Route handlers can still temporarily return legacy payloads while migration is in progress, but the standard for new/updated endpoints is the typed envelope.

## 4. Request to Report Flow

Typical flow for a report generation request:

1. API route authenticates and validates request payload.
2. Report record is created.
3. Queue job is created with idempotency metadata and correlation ID.
4. Worker claims queued job with lease owner token.
5. `runReportGeneration` starts pipeline and updates status transitions.
6. Pipeline steps execute with timeout, criticality, and fallback handling.
7. Audit events are written for key milestones.
8. Job/report transition to completed, failed, retried, or DLQ.

## 5. Correlation and Observability

Correlation utility: `src/lib/observability/correlation.ts`

Current behavior:

- Reads incoming `x-correlation-id` (fallback `x-request-id`).
- Normalizes/validates ID format.
- Generates correlation IDs for system-triggered flows.
- Propagates IDs into:
	- API responses
	- job payloads
	- worker/service/pipeline logs
	- audit payload rows (`correlationId`, `pipelineStep`, `jobId`)

Admin trace endpoint:

- `GET /api/admin/traces?correlationId=<id>&limit=<n>`
- Returns matching jobs + audit rows + merged timeline in one response.

## 6. Security Model

Core controls implemented in code:

- Route policy matrix for guest/member/super-admin flows.
- Cron secret enforcement on cron paths.
- Super-admin checks for admin route handlers.
- Security headers on responses (frame, mime, CSP baseline).
- Supabase session validation and agency-scoped guards in auth layer.

Primary files:

- `src/proxy.ts`
- `src/lib/security/routePolicy.ts`
- `src/lib/security/authGuard.ts`
- `src/lib/security/headers.ts`

Detailed security authority document:

- `reportly_context/02_REPORTLY_SECURITY.md`

## 7. Queue Reliability Model

Reliability primitives currently in place:

- Deterministic idempotency key generation for report jobs.
- Deduped enqueue behavior for equivalent logical runs.
- Lease owner token on claim to prevent competing completions.
- Heartbeat renewal for active processing jobs.
- Stale lease requeue recovery.
- Guarded job status transitions with expected state checks.
- Retry with backoff and DLQ handoff after exhaustion.
- In-flight pipeline dedupe by idempotency key.

Primary files:

- `src/lib/db/repositories/jobRepo.ts`
- `src/workers/report-worker.ts`
- `src/lib/services/reportService.ts`
- `src/lib/pipeline/pipeline.ts`

## 8. Project Structure

High-level structure:

```text
src/
	app/
		(auth)/
		(dashboard)/
		admin/
		api/
	components/
	hooks/
	lib/
		audit/
		db/
		modules/
		observability/
		payments/
		pipeline/
		security/
		services/
		validators/
	prompts/
	tests/
	types/
	workers/
tests/
reportly_context/
ai_skills/
```

## 9. Prerequisites

- Node.js 20+ recommended.
- pnpm installed.
- Supabase project (URL, anon key, service role key).
- Redis/Upstash credentials if rate limit and queue integrations are enabled.
- Third-party provider credentials depending on enabled features (AI, email, payments, OAuth).

## 10. Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create local environment file:

```bash
cp .env.example .env.local
```

If `.env.example` is not present, create `.env.local` manually using the variable reference below.

3. Start dev server:

```bash
pnpm dev
```

4. Optional: run worker manually in a second terminal:

```bash
pnpm tsx src/workers/report-worker.ts
```

5. Open app:

- `http://localhost:3000`

## 11. Environment Variables

Referenced by code/config in this repository:

### Core App

- `NODE_ENV`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Auth/Security

- `CRON_SECRET`
- `SUPER_ADMIN_EMAIL`
- `ADMIN_IP_ALLOWLIST`
- `OAUTH_STATE_SECRET`
- `ENCRYPTION_KEY`
- `TOKEN_ENCRYPTION_KEY`

### OAuth / Analytics Providers

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### AI Providers

- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

### Email

- `RESEND_API_KEY`
- `RESEND_FROM_DOMAIN`
- `FF_EMAIL_ENABLED`

### Payments

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

### Redis / Rate Limit

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Worker Runtime

- `WORKER_CONCURRENCY`
- `WORKER_HEARTBEAT_MS`
- `WORKER_LEASE_TIMEOUT_MS`
- `RAILWAY_WORKER_URL`
- `RAILWAY_WORKER_SECRET`

## 12. Commands

From `package.json`:

```bash
pnpm dev       # Next.js dev server
pnpm build     # Production build
pnpm start     # Start production server
pnpm lint      # ESLint
pnpm test      # Jest
```

Useful additional commands used in this repo:

```bash
pnpm -s tsc --noEmit
pnpm -s jest src/tests/correlation.test.ts src/tests/jobReliability.test.ts
pnpm -s jest
```

Playwright (if configured in your environment):

```bash
pnpm playwright test
```

## 13. API Surface

Current route handlers under `src/app/api/**`:

### Contract Standard

All newly standardized handlers should return the typed envelope below.

Success envelope:

```json
{
	"ok": true,
	"data": {
		"any": "payload"
	}
}
```

Error envelope:

```json
{
	"ok": false,
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Invalid request body",
		"details": {
			"issues": []
		}
	}
}
```

Notes for frontend consumers:

- Prefer unwrapping `ok/data` before consuming payloads.
- Keep backward compatibility while migration finishes by safely handling both raw payloads and enveloped payloads.
- This prevents runtime issues like calling array methods on envelope objects.

### Admin

- `/api/admin`
- `/api/admin/Jobs`
- `/api/admin/dlq`
- `/api/admin/flags`
- `/api/admin/traces`

### Auth

- `/api/auth/profile`
- `/api/auth/signout`

### Agencies

- `/api/agencies/me`
- `/api/agencies/onboarding`
- `/api/agencies/branding`
- `/api/agencies/sections`
- `/api/agencies/test-email`

### Clients

- `/api/clients`
- `/api/clients/[id]`
- `/api/clients/[id]/analytics`
- `/api/clients/[id]/analytics/connection`
- `/api/clients/[id]/analytics/properties`
- `/api/clients/[id]/analytics/refresh`

### Reports

- `/api/reports`
- `/api/reports/test`
- `/api/reports/[id]`
- `/api/reports/[id]/audit`
- `/api/reports/[id]/approve`
- `/api/reports/[id]/trigger`
- `/api/reports/[id]/regenerate`
- `/api/reports/[id]/recheck`

### OAuth

- `/api/oauth/ga4`
- `/api/oauth/ga4/callback`
- `/api/oauth/ga4/refresh`

### Cron

- `/api/cron/generate-reports`
- `/api/cron/reset-monthly-counts`

### Payments

- `/api/payments/create`
- `/api/payments/verify`

### Webhooks

- `/api/webhooks/resend`
- `/api/webhooks/razorpay`

## 14. Testing Strategy

### Unit and reliability tests (Jest)

Coverage includes queue reliability and supporting utilities in `src/tests/**`, including:

- idempotency behavior
- retry/circuit breaker paths
- route policy enforcement
- correlation helper behavior

### Visual and responsive tests (Playwright)

Playwright config in `playwright.config.ts` includes projects for:

- desktop chrome
- 1366 desktop
- tablet portrait
- mobile small
- mobile large

Snapshots are stored under `tests/visual.spec.ts-snapshots`.

## 15. Deployment and Operations

Config files in repo:

- `vercel.json`
- `railway.json`
- `next.config.ts`

Operational recommendations:

1. Use separate environments for local, staging, and production.
2. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
3. Restrict admin APIs with super-admin identity and IP allowlist in production.
4. Monitor correlation ID timelines for incident investigation.
5. Keep DLQ and stale lease recovery checks visible in ops runbooks.

## 16. Troubleshooting

### Reports not generating

- Verify job creation in `job_queue`.
- Check worker is running.
- Inspect `/api/admin/dlq` for failed jobs.

### reports.filter is not a function

- Cause: frontend treated enveloped API response as raw array.
- Fix: unwrap typed envelope (`ok/data`) before running array operations.
- Reference pages already patched: dashboard and reports list pages.

### OAuth failures

- Validate OAuth env vars and redirect URI.
- Confirm session and agency scoping are intact.

### Email not delivered

- Verify Resend keys/domain.
- Check webhook route activity and report email status fields.

### Incident reconstruction

- Use `/api/admin/traces?correlationId=<id>`.
- Correlate with logs and audit payload fields.

## 17. Source of Truth Docs

Core repository guidance and product context:

- `AGENTS.md`
- `ai_skills/README.md`
- `ai_skills/TIER1_SKILLS_MAP.md`
- `ai_skills/PHASED_IMPLEMENTATION_ROADMAP.md`
- `reportly_context/SRS_MVP.md`
- `reportly_context/SRS_FULL.md`
- `reportly_context/01_REPORTLY_DATABASE.md`
- `reportly_context/02_REPORTLY_SECURITY.md`
- `reportly_context/03_REPORTLY_REUSABILITY.md`
- `reportly_context/04_REPORTLY_MAINTENANCE.md`

When architecture and implementation diverge, update the roadmap/docs first, then code, as required by repo policy.
