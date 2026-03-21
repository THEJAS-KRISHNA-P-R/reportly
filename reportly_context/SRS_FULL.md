


REPORTLY
Software Requirements Specification — Full Product


SRS Document  |  Version 2.0  |  Status: Draft  |  2025






 
Field	Detail
Product Name	Reportly
Document Type	Software Requirements Specification (Full Product)
Version	2.0
Status	Draft
Intended Audience	Developer, Technical Contributors, Investors, Early Customers
Date	2025
Guiding Principle	If the system is unsure, it must slow down — not guess.

 
1. Introduction

1.1 Purpose
This SRS describes the complete functional and non-functional requirements for Reportly — a B2B SaaS platform that automates client reporting for digital marketing agencies. It covers the full product including all planned integrations, reliability systems, and operational features. For the scoped first release, see the separate MVP SRS document.

1.2 Core Ideology
Reportly is not a feature-rich dashboard. It is a reliability-first automation system operating on top of unreliable third-party APIs and probabilistic AI outputs. Every design decision is made through this lens:

Choose This	Over This
Reliability	Features
Correctness	Fancy UI
Transparency	AI magic
Failing gracefully	Failing silently
Doing less correctly	Doing more wrongly

1.3 Definitions
Term	Definition
Agency	A digital marketing company that is Reportly's primary paying customer
Client	The agency's end customer who receives the PDF report by email
OAuth	Open Authorization — secure protocol for third-party account connections
GA4	Google Analytics 4 — current Google web analytics platform
Meta Ads API	Facebook/Instagram advertising API providing campaign performance data
AI Narrative	AI-generated plain-English commentary explaining marketing metrics
Rule-Based Engine	Deterministic fallback that generates narrative from metric templates if AI fails
Confidence Layer	System that labels every AI insight: High / Partial / Unverified
Audit Trail	Permanent record of raw API data, AI prompt+output, and user edits per report
DLQ	Dead Letter Queue — holds failed jobs for manual or scheduled reprocessing
Critical Path	Steps whose failure must block the entire report (data fetch, validation)
Non-Critical Path	Steps that can degrade gracefully without blocking (charts, AI narrative, styling)
Prompt Version	Version tag on the AI prompt template used to generate a specific report
Data Freshness	The acceptable lag between data collection and report generation
ROAS	Return on Ad Spend — revenue per unit of ad spend
CPM	Cost Per Mille — cost per 1,000 ad impressions
CTR	Click-Through Rate — percentage of users who clicked an ad after seeing it

2. System Overview

2.1 System Description
Reportly is a standalone multi-tenant web application. Agencies access it via a web dashboard. Their clients receive output (PDF reports) via email and require no Reportly account. The system integrates with Google and Meta via their official OAuth APIs, uses an AI language model for narrative generation, a deterministic fallback engine for reliability, and sends all output through an authenticated email provider.

2.2 User Classes
User Class	Description	Access
Agency Admin	Owner/manager. Sets up clients, connects APIs, manages billing, approves reports.	Full
Account Manager	Staff who manage specific clients, review and edit reports before send.	Client-level
Agency Client	Receives finished PDF via email. No Reportly login.	None
System (Automated)	Cron jobs and queue workers. No human interaction.	Internal
Internal Admin (Founder)	Debug panel: view logs, re-run jobs, force reconnects, manage DLQ.	Super admin

2.3 Responsibility Architecture
Blame distribution is a first-class design concern, not an afterthought:
Component	Responsible For
Google / Meta	Accuracy and completeness of raw data
Reportly	Data validation, processing, formatting, delivery, audit trail
Agency	Final interpretation, approval, and client relationship

3. Hard System Boundaries

These rules must never be violated. They are non-negotiable constraints, not guidelines.

3.1 Data Privacy Boundary
•	Store ONLY aggregated metrics: session counts, percentages, spend amounts, conversion totals
•	NEVER store: individual user sessions, IP addresses, names, emails of website visitors, any PII
•	If an API response contains unexpected personal data fields: reject storage, log anomaly, alert system
•	Agency data strictly isolated via Supabase Row-Level Security — no cross-agency data access possible

3.2 OAuth Security Boundary
•	All OAuth tokens encrypted with AES-256 before touching the database
•	Tokens never appear in any log file under any circumstance
•	Tokens never sent to the frontend under any circumstance
•	If token refresh fails: mark connection Disconnected, notify agency immediately, skip report generation

3.3 AI Output Boundary
•	AI must NEVER invent a cause not backed by a specific, validated metric
•	AI must NEVER use speculative language ('likely due to', 'possibly because') unless metric-backed
•	All AI output must pass output validation scan before use — rejected output triggers rule-based fallback
•	Prompt template is versioned and tested on 20 sample datasets before any change is deployed

3.4 Report Integrity Boundary
A report must NEVER be sent if any of the following are true:
•	Any critical path data source returned no data or failed validation
•	Both AI generation and rule-based fallback have failed
•	PDF generation has failed and no fallback was produced
•	Agency has not explicitly approved the report

3.5 Email Delivery Boundary
•	Email domain must have SPF and DKIM configured before any production sends
•	Emails sent only after full report validation passes
•	Maximum 3 retry attempts with exponential backoff — then mark failed and notify agency
•	Never silently drop a failed email — always surface it in the dashboard

3.6 Data Validation Boundary (NEW)
Before any metric is passed to the AI or included in a report, it must pass all of the following checks:
•	Null check: metric must not be null or undefined
•	Zero-value anomaly: zero values for sessions/spend checked against prior period — flagged if implausible
•	Spike detection: delta greater than 300% in either direction flagged as Unreliable unless prior-period data confirms it
•	Missing period check: if data covers less than 80% of the reporting period, the metric is marked Preliminary
•	Freshness check: GA4 data older than 48 hours marked Preliminary; Meta data older than 72 hours marked Preliminary
Flagged metrics are excluded from the AI narrative. The report shows: 'Some metrics may be delayed or incomplete — data shown reflects available verified figures.'

4. Data Freshness Policy

Source	Acceptable Lag	Status if Exceeded	Behaviour
Google Analytics 4	Up to 48 hours	Preliminary Data	Show with warning indicator, exclude from AI trend analysis
Meta Ads API	Up to 72 hours	Preliminary Data	Show with warning indicator, exclude from AI trend analysis
Any source	More than 7 days	Stale — Do Not Use	Exclude entirely, notify agency, do not generate report

All reports must show data timestamp prominently: 'Data retrieved from Google Analytics on [date]. Data retrieved from Meta Ads on [date].'

5. Functional Requirements

5.1 Authentication and Onboarding
FR-001  Agency Registration
•	System accepts: agency name, email, password (min 12 chars, bcrypt hashed)
•	Email verification link sent on signup — account inactive until verified
•	Registration requires acceptance of Terms of Service and Privacy Policy

FR-002  Login
•	Email/password login with 7-day session expiry
•	Google SSO login supported
•	Failed login attempt limit: 5 attempts then 15-minute lockout

FR-003  Onboarding Wizard
•	Step 1: Upload agency logo (PNG, max 2MB) and set brand color (hex)
•	Step 2: Add first client (name, contact email, report delivery email, schedule)
•	Step 3: Connect first data source (GA4 or Meta Ads)
•	Step 4: Generate a preview report from demo data
•	Wizard completable in under 30 minutes for a non-technical user

5.2 Client Management
FR-004  Add Client
•	Fields: client name, contact name, report delivery email(s), reporting schedule (monthly day 1–28), timezone
•	Multiple report delivery emails supported (CC list)

FR-005  Edit and Delete Client
•	All client fields editable at any time
•	Delete is soft-delete: data retained for 90 days, then permanently purged
•	If client deleted mid-report-cycle: report generation is cancelled, agency notified
•	If client email changed: old email immediately deactivated from report delivery list

FR-006  Client Dashboard
•	Per-client status card: API health, last sync time, last report sent, next scheduled report, confidence level
•	Alert banner for any clients with broken connections or failed reports

5.3 API Integrations
FR-007  Google Analytics 4 OAuth
•	OAuth 2.0 with scope: analytics.readonly
•	Refresh token encrypted AES-256 before storage
•	Connection status displayed with last successful sync timestamp
•	Automatic token refresh attempted before each data fetch

FR-008  Meta Ads OAuth
•	OAuth 2.0 with scope: ads_read
•	Support multiple Meta ad accounts per client
•	Same security model as GA4 (encrypted tokens, never logged, never exposed to frontend)

FR-009  Google Search Console (V2)
•	OAuth 2.0 with scope: webmasters.readonly
•	Metrics: top queries, clicks, impressions, average position, CTR by query

FR-010  Google Ads (V2)
•	OAuth 2.0 with Google Ads API
•	Metrics: spend, clicks, CPC, impression share, conversion data

FR-011  Data Retrieval and Validation
•	GA4 metrics fetched: sessions, users, new users, bounce rate, avg session duration, top 5 pages, traffic source breakdown, conversion events
•	Meta metrics fetched: total spend, reach, impressions, CPM, CTR, link clicks, conversions, ROAS
•	All metrics passed through data validation boundary (Section 3.6) before storage or use
•	Period-over-period deltas calculated for all metrics
•	Raw API response snapshot stored in audit_logs table before any processing

5.4 Report Generation Pipeline
FR-012  Critical vs Non-Critical Path
This distinction governs what blocks a report and what degrades gracefully:
Pipeline Step	Classification	Failure Behaviour
Data fetch from API	CRITICAL	Block report, notify agency, do not proceed
Data validation	CRITICAL	Block report if >50% of metrics fail validation
AI narrative generation	NON-CRITICAL	Degrade to rule-based fallback, then send without narrative
Chart generation	NON-CRITICAL	Degrade to table view of same data
Custom styling / branding	NON-CRITICAL	Fall back to default template with agency name text only
PDF generation	NON-CRITICAL	Degrade to HTML report, then plain-text email summary
Audit log write	NON-CRITICAL	Log failure to error queue, do not block report

FR-013  AI Narrative Generation
•	Structured prompt includes: validated metrics, period-over-period deltas, previous report summary, client name and industry context
•	Prompt version stored with every report
•	Output validation: scan for speculative language patterns, check for metric-citation on every claim
•	If output fails validation: retry once with simplified prompt, then activate rule-based fallback
•	Confidence score assigned per insight based on: number of supporting metrics, delta magnitude, data completeness

FR-014  Rule-Based Fallback Engine
•	Activated when: AI API fails, AI output fails validation, AI times out after 30 seconds
•	Generates deterministic statements from metric templates: 'Traffic increased by X% compared to last month'
•	All statements generated only from validated metrics — no speculative language ever
•	Report clearly labeled: 'Narrative generated using automated analysis (AI narrative unavailable this period)'

FR-015  Confidence Layer
•	Every insight in the report carries a confidence label, visible to the agency during review
•	🟢 High Confidence: metric-backed, within normal range, data complete
•	🟡 Partial Confidence: some data missing, metric at edge of acceptable freshness window
•	🔴 Unverified: metric flagged by validation layer — shown in report with warning, not included in AI narrative

FR-016  PDF Generation
•	Server-side only (Puppeteer on Railway — not on Vercel due to 60s timeout limit)
•	Report structure: Header (agency logo, client name, period), Executive Summary, Metric Cards with deltas, What Changed section, AI Narrative, Charts, Recommended Actions, Footer with data source attribution
•	Every insight in the PDF links to its source metric and data source label
•	Reportly branding absent from client-facing PDF — agency brand only
•	File size maximum: 5MB
•	Report version tag printed in footer (template_version, prompt_version)

FR-017  Agency Review and Approval
•	Agency sees full draft report before any email is sent
•	Narrative section is an editable text field in the review screen
•	System stores: original AI narrative, all edits with timestamps, final approved narrative
•	Approval button triggers report lock and delivery — no further edits possible after approval
•	Agency can reject report and trigger regeneration at any time before approval

5.5 Report Delivery
FR-018  Email Delivery
•	Sender name: agency name (not Reportly) — enforced via Resend custom domain
•	Email body: 3-sentence summary, PDF attached, data timestamp visible in email body
•	SPF and DKIM authentication mandatory before any production sends
•	Retry policy: 3 attempts with exponential backoff (1 min, 5 min, 15 min)
•	All delivery statuses logged: sent, delivered, opened, bounced, failed
•	Failed delivery: mark in dashboard, alert agency, provide manual resend button

FR-019  Manual Report Trigger
•	Agency can manually trigger report generation for any client at any time
•	Manual generation goes through identical pipeline as automated — no shortcuts
•	System enforces idempotency: cannot generate duplicate report for same client/period if one already exists

5.6 Versioning and Audit Trail
FR-020  Report Versioning
•	Every generated report stores: prompt_version, template_version, logic_version
•	Prompt version changes require: test on 20 sample datasets, staging deployment, explicit version bump
•	Breaking changes (format changes visible to clients) require new template_version tag
•	Agency dashboard shows version info per report — allows comparison across months

FR-021  Audit Trail
For every generated report, the following must be stored permanently:
•	Raw API response snapshot (JSON) from each connected source
•	Processed and validated metric set used for the report
•	Complete AI prompt sent (with prompt_version)
•	Complete AI output received
•	Output validation result and any rejection reason
•	User edits: original text, all intermediate edits, final approved text, editor ID, timestamps
•	Email delivery log: recipient, timestamp, delivery status
•	Any system warnings or validation failures during generation
Audit trail data is exportable by the agency at any time. It is the primary legal defense in case of report disputes.

5.7 Background Jobs and Queue System
FR-022  Scheduled Report Generation
•	Cron job triggers on the agency-specified day of each month
•	All report jobs pushed to Redis queue — never executed synchronously
•	Random start delay of ±2–6 hours per client to prevent month-end spike
•	Priority queue: clients with simpler configurations (fewer integrations) processed first

FR-023  Rate Limit Protection
•	Global request throttler per API (GA4, Meta) with configurable limits per hour
•	Per-client cooldown: minimum 23-hour gap between data fetches for same client
•	Hard rule: never retry immediately after a 429 response — minimum backoff: 60 seconds
•	API usage metrics logged and visible in internal admin panel

FR-024  Dead Letter Queue
•	Any job that fails all retries is moved to the Dead Letter Queue (DLQ)
•	DLQ items are visible in the internal admin panel with full error context
•	Admin can manually re-trigger or permanently discard DLQ items
•	Agency automatically notified when any of their reports enters the DLQ

5.8 Internal Admin Panel
FR-025  Admin Tooling
•	View all failed jobs with error messages and stack traces
•	Re-run any specific report or data fetch job
•	View complete logs per client: API calls, AI I/O, email delivery, errors
•	Force reconnect an agency's broken API connection
•	View and manage DLQ items
•	Toggle feature flags for any risky feature without deployment
•	View API usage metrics and rate limit proximity

5.9 Report History
FR-026  Report Archive
•	All reports stored with PDF, metrics snapshot, and full audit trail
•	Accessible from agency dashboard per client
•	PDF download available for all historical reports
•	Manual resend of any past report available
•	Retention: 24 months minimum

6. Non-Functional Requirements

6.1 Performance
Requirement	Target
Dashboard page load	Under 2 seconds on standard broadband
Data fetch per client (GA4 + Meta)	Under 15 seconds
AI narrative generation	Under 20 seconds (30s timeout then fallback activates)
PDF generation	Under 30 seconds
Email delivery initiation	Within 2 minutes of PDF generation completion
System uptime	99.5% monthly uptime
Concurrent report generation	50 simultaneous (via queue — not actual concurrency)

6.2 Security
•	All OAuth tokens: AES-256 encrypted at rest, never logged, never exposed to frontend
•	All transmission: HTTPS / TLS 1.2 minimum
•	Multi-tenancy enforced: Supabase Row-Level Security on all tables
•	Passwords: bcrypt, minimum 12 salt rounds
•	All API keys (AI, email, Redis): environment variables only, never in source code
•	Admin panel: separate authentication, IP allowlist in production

6.3 Scalability
•	Architecture must support 500 agencies and 10,000 reports/month without architectural changes
•	Queue system prevents concurrency bottlenecks at month-end peak
•	Database schema supports sharding if required at scale
•	All report generation is stateless — workers can be scaled horizontally

6.4 Reliability
•	No silent failures anywhere in the pipeline
•	Every failure surfaces in the dashboard and/or notifies the agency
•	Every scheduled job has logging, retry logic, and DLQ fallback
•	Feature flags enable instant disabling of any problematic feature without deployment
•	Blue/green deployment or staging environment required before production deploys

6.5 Usability
•	Onboarding from signup to first report preview: under 30 minutes
•	All critical actions: 3 clicks or fewer from dashboard
•	Mobile-responsive dashboard (minimum 375px width)
•	All error messages: human-readable with a suggested corrective action
•	Trust UX microcopy present throughout: 'Last updated from Google: X hours ago', 'Based on verified data', 'Review before sending'

6.6 AI Prompt Governance
•	All prompt templates stored in version-controlled repository
•	Changes to prompts require: testing on minimum 20 sample metric datasets, staging validation, explicit version bump
•	Changes must be backward-compatible unless a new template_version is declared
•	AI output format validated programmatically — not just reviewed manually

7. Data Model

Table	Key Fields	Purpose
agencies	id, name, email, logo_url, brand_color, plan, created_at	Core agency account
agency_users	id, agency_id, email, role (admin/member), created_at	Agency team members
clients	id, agency_id, name, contact_email, report_emails[], schedule_day, timezone, deleted_at	Agency clients (soft delete)
api_connections	id, client_id, platform, access_token_enc, refresh_token_enc, account_id, status, last_synced_at	OAuth tokens
metric_snapshots	id, client_id, platform, period_start, period_end, raw_api_response (json), validated_metrics (json), validation_warnings[], freshness_status, created_at	Validated metrics per period
reports	id, client_id, period_start, period_end, prompt_version, template_version, logic_version, ai_narrative_raw, ai_narrative_edited, rule_based_narrative, final_narrative, confidence_summary, pdf_url, status, approved_at, approved_by	Generated reports
audit_logs	id, report_id, event_type, payload (json), created_at	Full audit trail per report event
report_emails	id, report_id, recipient_email, status, sent_at, opened_at	Email delivery tracking
job_queue	id, job_type, client_id, status, attempts, next_retry_at, created_at	Background job queue
dead_letter_queue	id, original_job_id, error_message, stack_trace, created_at, resolved_at	Failed job archive
feature_flags	id, flag_name, enabled, description, updated_at	Runtime feature toggles
prompt_versions	id, version_tag, prompt_text, tested_on_samples, deployed_at, deprecated_at	AI prompt history

8. External Interfaces

Interface	Type	Auth	Quota / Limits
Google Analytics Data API v1	REST	OAuth 2.0 (analytics.readonly)	10,000 requests/day — cache aggressively
Meta Marketing API v18+	REST	OAuth 2.0 (ads_read)	Varies by endpoint — implement backoff
Google Search Console API (V2)	REST	OAuth 2.0 (webmasters.readonly)	1,200 queries/minute per user
Google Ads API (V2)	REST	OAuth 2.0 (adwords)	Standard developer token limits
Anthropic Claude Haiku API	REST	API Key (server-side only)	RPM limits — queue manages concurrency
Resend API	REST	API Key (server-side only)	3,000 free/month, then $20/month
Supabase	PostgreSQL + REST + Realtime	Service Role Key (server-side)	Scales with plan
Upstash Redis	REST	REST Token	10,000 req/day free tier
Vercel	Platform (Next.js + Cron)	Deploy token	60s function timeout — PDF on Railway
Railway	Platform (Node workers)	Deploy token	Scales with plan

9. Failure Scenarios and Fallbacks

Scenario	Detection	Fallback Chain
API returns null or empty data	Data validation layer	Flag metric Unreliable → exclude from narrative → report with warning
API data spike >300%	Data validation layer	Flag metric Unreliable → exclude → show in report with note
Data older than freshness threshold	Freshness check on fetch	Mark Preliminary → include with warning indicator
API rate limit (429)	HTTP response code	Backoff 60s min → retry 3× → mark Unavailable → skip report → notify agency
Token expired	API call failure	Attempt refresh → if fails: mark Disconnected → skip report → notify agency
AI API failure or timeout	HTTP error / 30s timeout	Retry with simplified prompt → rule-based engine → send without narrative (labeled)
AI output fails validation	Output validation scan	Retry once → rule-based engine → send without narrative (labeled)
PDF generation failure	Puppeteer error	Retry reduced complexity → HTML fallback → plain-text email summary
Month-end cron overload	Queue depth monitoring	Redis queue with ±2–6h random delay → batch processing → notify delay
Email delivery failure	Resend webhook	Retry 3× with backoff → mark failed in dashboard → notify agency
Client deleted mid-cycle	Soft-delete check before job runs	Cancel job → mark report cancelled → notify agency
Both AI and rule-based engine fail	Both return error/empty	Block report → notify agency → log to DLQ → admin intervention
Deployment breaks production	Uptime monitoring / error rate spike	Rollback to previous deployment → feature flag to disable broken feature

10. Security Requirements

10.1 Data Privacy
•	No PII of agency's website visitors ever stored — aggregated metrics only
•	Agency and client data covered by published Privacy Policy
•	Full data deletion available to any agency on request — executed within 30 days
•	GDPR-aware data handling (relevant for future global expansion)

10.2 API Credential Security
•	AES-256 encryption for all OAuth tokens at rest
•	Encryption keys in environment variables, rotated quarterly
•	No tokens in logs, no tokens in frontend responses, no tokens in error messages

10.3 Access Control
•	Supabase RLS enforces agency-level data isolation at the database level
•	All API routes validate authenticated session before any processing
•	Admin-only actions require re-authentication
•	Internal admin panel restricted to founder IP allowlist in production

11. Deployment and Operational Requirements

11.1 Environments
•	Local: developer machine with local Supabase and mock API responses
•	Staging: full production clone with real APIs, test agency accounts, no real client data
•	Production: live system with all monitoring, logging, and alerting active

11.2 Deployment Rules
•	All changes deployed to staging first — minimum 24 hours in staging before production
•	Prompt version changes require testing on 20 sample datasets before staging deploy
•	Every deployment must have a documented one-command rollback path
•	Feature flags required for any feature that touches report generation, email delivery, or AI calls

11.3 Monitoring and Alerting
•	Uptime monitoring on all public routes and cron jobs
•	Alert on: error rate spike, job queue depth > threshold, DLQ items > 0, email bounce rate > 5%
•	API usage dashboard showing proximity to rate limits per integration

12. Full Product Release Criteria (V1)

V1 is considered releasable when:
1.	All 26 functional requirements (FR-001 through FR-026) pass acceptance tests
2.	Data validation layer rejects null, spike, and stale data correctly in 100% of test cases
3.	Rule-based fallback produces a coherent narrative for all 20 sample metric datasets
4.	Audit trail captures all required fields for 100% of generated reports
5.	DLQ correctly receives all failed jobs and surfaces them in admin panel
6.	Rate limit protection verified: no 429 errors generated under 50-client simultaneous load test
7.	Rollback from production to previous version verified under 5 minutes
8.	All OAuth tokens confirmed never-logged and never-exposed via automated security scan
9.	Three real agencies have successfully generated, reviewed, and approved reports in staging
10.	All non-functional requirements in Section 6 verified via load and performance testing

13. Future Scope

Feature	Version	Priority
Google Search Console integration	V2	High
Google Ads integration	V2	High
Weekly report scheduling	V2	Medium
Client-facing web portal (no email needed)	V2	Medium
Team member roles and permissions	V2	Medium
Custom report templates	V2	Low
Multi-language reports (Malayalam, Hindi)	V3	Medium
Competitor benchmarking (industry averages)	V3	Low
AI chatbot for report Q&A	V3	Low
Mobile app for agency dashboard	V3	Low
Slack / WhatsApp report notifications	V3	Medium
Agency-level cross-client analytics	V3	Low
Automated anomaly alert system (between reports)	V3	Medium



Reportly Full SRS v2.0  |  Confidential — Internal and Investor Use Only
