# Enterprise Roadmap (Week-by-Week)

This roadmap maps all 30 Tier-1 skills to concrete module and document milestones.

## Phase 0: Baseline and Guardrails (Week 1)

Skills:
- Branch Protection Rules
- Code Review Guidelines
- Semantic Versioning Strategy
- ADR Records
- CI Pipeline (GitHub Actions)

File-level milestones:
- Add workflow: `.github/workflows/ci.yml`
- Add review checklist: `.github/pull_request_template.md`
- Add policy docs: `docs/engineering/branch-protection.md`, `docs/engineering/review-checklist.md`
- Add versioning policy: `docs/engineering/versioning.md`
- Add ADR index: `docs/adr/README.md`
- Add first ADRs: `docs/adr/0001-architecture-boundaries.md`, `docs/adr/0002-report-pipeline-criticality.md`
- Update: `README.md` with dev lifecycle and quality gates.

Exit criteria:
- Protected branch policy defined.
- CI runs lint + typecheck + tests.
- ADR process and semantic versioning documented.

## Phase 1: Data and Multi-Tenant Integrity (Week 2)

Skills:
- Multi-Tenancy Architecture
- Clean Architecture in Node.js
- Database Schema Migration
- PostgreSQL Indexing Strategies
- SQL Query Optimization

File-level milestones:
- Add migration folder if missing: `supabase/migrations/*`
- Add migration runbook: `docs/db/migration-runbook.md`
- Audit and normalize repositories: `src/lib/db/repositories/*.ts`
- Add query perf scripts: `scripts/db/explain-analyze.sql`
- Add repository contract tests: `src/tests/repositories/*.test.ts`
- Update docs: `reportly_context/01_REPORTLY_DATABASE.md` with actual schema diff.

Exit criteria:
- Agency scoping proven across all repository queries.
- Indexes added for all dashboard/report high-frequency paths.
- Migration workflow tested in local + staging.

## Phase 2: Security Hardening (Weeks 3-4)

Skills:
- Input Validation (Zod)
- RBAC Implementation
- CSRF Protection Strategies
- Content Security Policy (CSP) Setup
- XSS Prevention Guide
- OWASP Top 10 Mitigation
- Rate Limiting (Redis)
- Secret Scanning in CI/CD
- Dependency Vulnerability Scanning

File-level milestones:
- Add/expand schema validation: `src/lib/validators/inputValidator.ts`
- Harden route guards: `src/lib/security/authGuard.ts`
- Harden proxy/middleware: `src/proxy.ts`
- Tighten headers: `src/lib/security/headers.ts`
- Add sanitization utility usage in narrative render/edit paths.
- Add security scans to CI: `.github/workflows/ci.yml`
- Add threat matrix: `docs/security/owasp-control-matrix.md`
- Add security tests: `src/tests/security/*.test.ts`

Exit criteria:
- State-changing endpoints protected against CSRF.
- CSP violations reviewed and minimized.
- Security scan gates active in CI.

## Phase 3: Queue and Reliability Engine (Weeks 5-6)

Skills:
- Background Jobs with BullMQ
- Caching Strategy (Redis)
- Feature Flag Implementation
- Health Check Endpoint
- Webhooks Implementation
- Adapter Pattern in TypeScript

File-level milestones:
- Replace poller with queue workers: `src/workers/report-worker.ts`
- Add queue bootstrap/config: `src/lib/queue/*`
- Add health checks: `src/app/api/health/route.ts`
- Harden webhook endpoints: `src/app/api/webhooks/*`
- Expand feature flag checks: `src/lib/featureFlags.ts`
- Normalize adapter registry: `src/lib/modules/analytics/registry.ts`
- Update reliability docs: `reportly_context/03_REPORTLY_REUSABILITY.md`

Exit criteria:
- Job lifecycle supports retry, DLQ, idempotency, observability.
- Health endpoint returns dependency status.
- Webhooks are signed and idempotent.

## Phase 4: Testing and Quality Assurance (Weeks 7-8)

Skills:
- Unit Test Generation (Jest)
- E2E Testing (Playwright)

File-level milestones:
- Expand unit tests: `src/tests/*.test.ts`
- Add repository integration tests: `src/tests/repositories/*.test.ts`
- Expand E2E matrix: `tests/visual.spec.ts`, `tests/responsive-and-animation.spec.ts`
- Add playwright projects for device coverage: `playwright.config.ts`
- Add test report docs: `docs/qa/test-matrix.md`

Exit criteria:
- Critical pipeline and security paths covered.
- Responsive E2E runs across desktop/tablet/mobile profiles.

## Phase 5: Observability and Operations (Week 9)

Skills:
- Sentry Error Tracking Setup
- Automated Database Backups
- Blue/Green Deployment Strategy

File-level milestones:
- Sentry bootstrap and env docs: `sentry.*`, `docs/ops/sentry.md`
- Backup playbook: `docs/ops/database-backup-restore.md`
- Deploy strategy doc: `docs/ops/blue-green-rollout.md`
- Incident checklist: `docs/ops/incident-response.md`

Exit criteria:
- Error tracking verified with synthetic failures.
- Backup and restore drill performed.
- Rollback procedure tested.

## Phase 6: Release Readiness (Week 10)

Skills:
- Clean Architecture in Node.js (final conformance)
- Code Review Guidelines (enforced)
- Semantic Versioning Strategy (release flow)

File-level milestones:
- Final conformance review of boundaries across `src/app/api`, `src/lib/services`, `src/lib/db/repositories`
- Create release checklist: `docs/releases/release-checklist.md`
- Create V1 stabilization plan: `docs/releases/v1-stabilization.md`

Exit criteria:
- No blocker-level issues in reliability/security checklist.
- Release train and rollback plan are operational.

## Crosswalk: Tier-1 Skill -> Roadmap Week

- Week 1: 23, 27, 28, 29, 30
- Week 2: 1, 3, 6, 7, 8
- Weeks 3-4: 12, 13, 14, 15, 16, 17, 18, 19, 20
- Weeks 5-6: 2, 4, 5, 9, 10, 11
- Weeks 7-8: 21, 22
- Week 9: 24, 25, 26
- Week 10: consolidation and release readiness

## Definition of Done (Enterprise Track)

- All 30 Tier-1 skills are mapped to implemented and validated milestones.
- Security controls are enforced in code and CI.
- Queue pipeline is resilient under retry/DLQ/load test conditions.
- Responsive UI and animation behavior pass Playwright matrix.
- Operational runbooks and ADRs are present and maintained.
