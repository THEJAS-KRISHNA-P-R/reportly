# Reportly v3.0: Industry Standard Production Specification

## 🚀 Objective
Transform the "Reportly" prototype into a high-density, multi-tenant B2B SaaS platform capable of supporting 1,000+ agencies and 10,000+ monthly reports with 99.9% reliability.

---

## 🏗️ 1. Infrastructure: Distributed Resilience
- **Redis Primary (v7+)**: Transition all ephemeral states (sessions, throttling, queue groups) to a high-availability Redis instance.
- **BullMQ Orchestration**: Move from "polling" to "event-driven".
    - **Concurrency Control**: Max 25 concurrent GA4 fetches per worker node.
    - **Job Priorities**: Priority 1 for "Instant" reports, 10 for "Scheduled" ones.
- **Worker Auto-Scaling**: CPU-bound workers for PDF generation isolated from I/O-bound workers for API fetching.

## 🏛️ 2. Multi-Tenancy: Secure Isolation
- **Subdomain Routing**: Implement `middleware.ts` to handle host extraction.
- **Theming Engine**: 
    - Store `primary_color`, `accent_color`, and `logo_url` in the `agencies` table.
    - Export a dynamic `:root` style object to ensure the UI matches the agency's brand in real-time.
- **Strict RLS**: Every table must have a `(SELECT, INSERT, UPDATE) USING (agency_id = current_setting('app.current_agency_id'))` policy.

## 💳 3. Billing: Revenue Protection
- **Dunning Lifecycle**: 
    - 0-3 Days: Retry payment silently.
    - 4-7 Days: "Grace Period" active (dashboard warning).
    - 8+ Days: "Degraded Access" (read-only mode).
- **Automated Retention**: Use Resend + BullMQ to send automated billing recovery sequences.

## 👁️ 4. Observability: Proactive Monitoring
- **Platform Pulse**: Real-time monitoring of:
    - **Token Fill Rate**: AI token consumption per agency.
    - **Backlog Pressure**: Average wait time in the `report-generation` queue.
    - **Third-Party Latency**: P99 response times for Google and Meta APIs.
- **Stuck Job Detection**: Auto-reset and retry jobs that stay `active` for >3x their expected duration.

## 🧹 5. Automation: Maintenance & Lifecycle
- **Self-Cleaning Tables**: CRON jobs for weekly purging of:
    - Audit logs > 90 days.
    - Metric snapshots > 2 years.
- **Credential Rotation**: Automated background refresh for OAuth tokens 24h before expiry to prevent report failure.

---

## 🏁 Transformation Scorecard
| Stage | Milestone | Outcome |
| :--- | :--- | :--- |
| **Phase 1** | Redis & BullMQ Core | 100% Reliable, Zero-Loss Pipeline. |
| **Phase 2** | SuperAdmin Control | Active Platform Management & DLQ. |
| **Phase 3** | Subdomains & Caching | Enterprise-Grade Performance & Brand. |
| **Phase 4** | Fidelity & Fallbacks | Human-Equivalent Accuracy & Reliability. |
| **Phase 5** | Dunning & RLS Audit | Financial Security & Tenant Privacy. |
