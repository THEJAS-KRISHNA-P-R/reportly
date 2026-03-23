# Tier-1 Skills Map (TRAE -> Reportly)

This maps the 30 Tier-1 skills from `HighMark-31/TRAE-Skills` to current Reportly modules and documentation.

## Architecture

1. Multi-Tenancy Architecture
- Skill: `architecture/Multi_Tenancy_Architecture.md`
- Existing modules: `src/lib/security/authGuard.ts`, `src/lib/db/repositories/*`
- Existing docs: `reportly_context/01_REPORTLY_DATABASE.md`, `reportly_context/02_REPORTLY_SECURITY.md`
- Milestone target: strict agency scoping for every repository query and route.

2. Adapter Pattern in TypeScript
- Skill: `architecture/Adapter_Pattern_TypeScript.md`
- Existing modules: `src/lib/modules/analytics/registry.ts`, `src/types/adapters.ts`
- Existing docs: `reportly_context/03_REPORTLY_REUSABILITY.md`
- Milestone target: platform-specific logic isolated behind adapters.

3. Clean Architecture in Node.js
- Skill: `architecture/Clean_Architecture_Node.md`
- Existing modules: `src/lib/services/reportService.ts`, `src/lib/pipeline/*`
- Existing docs: `reportly_context/03_REPORTLY_REUSABILITY.md`
- Milestone target: route -> service -> repository boundaries with no leakage.

## Backend Reliability

4. Background Jobs with BullMQ
- Skill: `backend/Background_Jobs_BullMQ.md`
- Existing modules: `src/workers/report-worker.ts`, `src/lib/db/repositories/jobRepo.ts`
- Existing docs: `reportly_context/SRS_MVP.md`
- Milestone target: replace poller-only worker behavior with robust queue workers.

5. Caching Strategy (Redis)
- Skill: `backend/Caching_Strategy_Redis.md`
- Existing modules: `src/lib/security/rateLimit.ts`, queue and retry utils
- Milestone target: cache hot reads and API quota-sensitive fetch layers.

6. Database Schema Migration
- Skill: `backend/Database_Schema_Migration.md`
- Existing modules: schema and repository layer
- Existing docs: `reportly_context/01_REPORTLY_DATABASE.md`
- Milestone target: safe forward/backward migration workflow.

7. PostgreSQL Indexing Strategies
- Skill: `backend/PostgreSQL_Indexing.md`
- Existing modules: repository query patterns
- Milestone target: index every high-frequency filter/sort path.

8. SQL Query Optimization
- Skill: `backend/SQL_Query_Optimization.md`
- Existing modules: `src/lib/db/repositories/*`
- Milestone target: P95 query latency < 100ms for core dashboard paths.

9. Feature Flag Implementation
- Skill: `backend/Feature_Flag_Implementation.md`
- Existing modules: `src/lib/featureFlags.ts`
- Existing docs: SRS + maintenance docs
- Milestone target: all risky features runtime-toggleable.

10. Health Check Endpoint
- Skill: `backend/Health_Check_Endpoint.md`
- Existing modules: add `src/app/api/health/route.ts`
- Milestone target: readiness + liveness + dependency checks.

11. Webhooks Implementation
- Skill: `backend/Webhooks_Implementation.md`
- Existing modules: `src/app/api/webhooks/*` (expand)
- Milestone target: verified event signatures, idempotency, replay safety.

## Security

12. Input Validation (Zod)
- Skill: `security/Input_Validation_Zod.md`
- Existing modules: validators layer and route handlers
- Milestone target: schema validation at every route boundary.

13. Rate Limiting (Redis)
- Skill: `security/Rate_Limiting_Redis.md`
- Existing modules: `src/lib/security/rateLimit.ts`
- Milestone target: route-specific limits and standardized 429 behavior.

14. RBAC Implementation
- Skill: `security/RBAC_Implementation.md`
- Existing modules: `src/lib/security/authGuard.ts`
- Milestone target: admin/member privileges consistently enforced.

15. CSRF Protection Strategies
- Skill: `security/CSRF_Protection_Strategies.md`
- Existing modules: middleware/proxy and auth routes
- Milestone target: CSRF on all state-changing browser flows.

16. Content Security Policy (CSP) Setup
- Skill: `security/Content_Security_Policy_CSP.md`
- Existing modules: `src/lib/security/headers.ts`, `src/proxy.ts`
- Milestone target: strict CSP with explicit allowlists only.

17. XSS Prevention Guide
- Skill: `security/XSS_Prevention_Guide.md`
- Existing modules: narrative rendering, rich text editing, email/pdf output
- Milestone target: full sanitize/encode path for all user/AI content.

18. OWASP Top 10 Mitigation
- Skill: `security/OWASP_Top_10_Mitigation.md`
- Existing docs: `reportly_context/02_REPORTLY_SECURITY.md`
- Milestone target: explicit control matrix mapped to code.

19. Secret Scanning in CI/CD
- Skill: `security/Secret_Scanning_CI_CD.md`
- Existing modules: CI pipeline (to add/expand)
- Milestone target: automated secret scanning gate.

20. Dependency Vulnerability Scanning
- Skill: `security/Dependency_Vulnerability_Scanning.md`
- Existing modules: CI pipeline
- Milestone target: fail CI on high/critical vulnerabilities.

## Testing and QA

21. Unit Test Generation (Jest)
- Skill: `testing/Unit_Test_Generation_Jest.md`
- Existing modules: `src/tests/*.test.ts`
- Milestone target: broad coverage across validators, security, repositories.

22. E2E Testing (Playwright)
- Skill: `testing/E2E_Testing_Playwright.md`
- Existing modules: `tests/visual.spec.ts`
- Milestone target: responsive + critical flow E2E matrix.

## DevOps and Release

23. CI Pipeline (GitHub Actions)
- Skill: `devops/CI_Pipeline_GitHub_Actions.md`
- Milestone target: lint, typecheck, tests, security scans, deploy gates.

24. Sentry Error Tracking Setup
- Skill: `devops/Sentry_Error_Tracking.md`
- Existing modules: dependency already present in `package.json`
- Milestone target: end-to-end error tracing for web + workers.

25. Blue/Green Deployment Strategy
- Skill: `devops/Blue_Green_Deployment_Strategy.md`
- Milestone target: safe deploy and rollback playbook.

26. Automated Database Backups
- Skill: `devops/Automated_Database_Backups.md`
- Milestone target: scheduled backups + restore drills.

## Code Governance

27. Branch Protection Rules
- Skill: `code_management/Branch_Protection_Rules.md`
- Milestone target: protected main, required checks, review policy.

28. Code Review Guidelines
- Skill: `code_management/Code_Review_Guidelines.md`
- Milestone target: repeatable review checklists for reliability/security.

29. Semantic Versioning Strategy
- Skill: `code_management/Semantic_Versioning_Strategy.md`
- Milestone target: versioning for app, prompt, and template artifacts.

## Documentation

30. ADR Records
- Skill: `documentation/Architectural_Decision_Records_ADR.md`
- Milestone target: every major architecture/security decision logged in ADRs.
