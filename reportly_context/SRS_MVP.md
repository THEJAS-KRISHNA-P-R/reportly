


REPORTLY
Software Requirements Specification — MVP


MVP SRS  |  Version 1.0  |  Status: Build-Ready  |  2025






 
Field	Detail
Document Type	SRS — Minimum Viable Product Scope Only
Version	1.0
Status	Build-Ready
MVP Goal	Generate a reliable, trustworthy GA4 report with zero manual effort — agency always reviews before it reaches the client
Integration Scope	Google Analytics 4 ONLY (Meta Ads is V2)
Report Cadence	Monthly ONLY (weekly is V2)
Guiding Rule	If the system is unsure, it must slow down — not guess

 
1. MVP Philosophy

The MVP is not a simplified product. It is the full trust architecture applied to a deliberately narrow scope. Every reliability and safety mechanism defined in the Full SRS applies to the MVP. What changes is the feature scope — not the standards.

MVP Includes	MVP Explicitly Excludes
Google Analytics 4 integration only	Meta Ads (V2)
Monthly reports only	Weekly reports (V2)
1 standard report template	Custom templates (V2)
AI narrative + rule-based fallback	Multi-language reports (V2)
Data validation layer (full)	Google Search Console (V2)
Confidence layer (High/Partial/Unverified)	Google Ads (V2)
Audit trail per report	Client-facing web portal (V2)
Agency review and approval	Team member roles/permissions (V2)
PDF generation + email delivery	Slack/WhatsApp notifications (V2)
Rate limit protection (GA4 only)	Advanced cross-client analytics (V2)
Dead Letter Queue (basic)	Admin panel analytics / charts (V2)
Internal admin panel (basic)	Mobile app (V3)

2. MVP Functional Requirements

All MVP functional requirements are labeled MFR (MVP Functional Requirement). Requirements labeled with (V2) or (V3) are not in scope.

MFR-001  Agency Registration and Login
•	Agency registers with name, email, password (bcrypt hashed, min 12 chars)
•	Email verification required before account is active
•	Email/password login with 7-day session expiry
•	5 failed login attempts triggers 15-minute lockout
•	Acceptance of Terms of Service and Privacy Policy required at registration

MFR-002  Onboarding Wizard
•	Step 1: Upload agency logo (PNG, max 2MB) + set brand hex color
•	Step 2: Create first client (name, contact email, report delivery email(s), report day 1–28)
•	Step 3: Connect Google Analytics 4 via OAuth
•	Step 4: Generate a preview report using Google's public Demo Analytics account
Onboarding must be completable in under 30 minutes by a non-technical user.

MFR-003  Client Management
•	Add client: name, contact email, report delivery emails (multiple supported), report day, timezone
•	Edit any client field at any time
•	Delete client: soft-delete only (data retained 90 days). If deleted mid-cycle: cancel active job, notify agency
•	If client email updated: old email immediately deactivated from delivery list
•	Dashboard shows per-client: connection status, last sync time, last report sent, next scheduled report, confidence level

MFR-004  Google Analytics 4 OAuth Connection
•	OAuth 2.0 with scope: analytics.readonly
•	Refresh token encrypted AES-256 before database storage
•	Token never logged, never exposed to frontend, never in error messages
•	Automatic token refresh attempted before each scheduled data fetch
•	If refresh fails: mark Disconnected, notify agency, skip report generation for this client
•	Connection health shown in dashboard: Connected ✅ / Disconnected ❌ / Error ⚠️
•	Last successful sync timestamp shown per client

MFR-005  Automated Monthly Data Fetch
•	Cron job triggers on the agency-configured day of each month
•	All fetch jobs pushed to Redis queue — never executed synchronously
•	Random start delay ±2–6 hours per client to prevent simultaneous load spike
•	GA4 metrics fetched: sessions, users, new users, bounce rate, avg session duration, top 5 pages by sessions, traffic source breakdown
•	Period-over-period deltas calculated for all metrics
•	Raw API response stored in audit_logs before any processing

MFR-006  Data Validation Layer
Every metric must pass all four checks before use. This runs before AI, before PDF, before anything.
•	Null check: metric is not null or undefined → else flag Unreliable
•	Zero-value anomaly: zero sessions/users cross-checked against prior period → flag if implausible
•	Spike detection: delta >300% in either direction → flag Unreliable unless prior-period data confirms genuine spike
•	Freshness check: GA4 data older than 48 hours → mark Preliminary
Flagged metrics excluded from AI narrative. Report shows: 'Some metrics may be delayed or incomplete.'

MFR-007  Critical vs Non-Critical Path
Step	Classification	If It Fails
GA4 data fetch	CRITICAL	Block report. Notify agency. Do not proceed.
Data validation (if >50% metrics fail)	CRITICAL	Block report. Notify agency.
AI narrative generation	NON-CRITICAL	Activate rule-based fallback. Continue.
Chart generation	NON-CRITICAL	Skip charts. Show metric tables. Continue.
PDF generation	NON-CRITICAL	Retry reduced complexity → HTML fallback
Audit log write	NON-CRITICAL	Log failure to error queue. Do not block report.
Email delivery	NON-CRITICAL (post-approval)	Retry 3×. Mark failed. Notify agency.

MFR-008  AI Narrative Generation
•	Claude Haiku API called with a versioned, validated prompt template
•	Prompt contains: validated metrics + deltas, client name, reporting period, prior month summary (if exists)
•	prompt_version stored with every report
•	AI output must not contain speculative language ('likely due to', 'possibly because') unless backed by metric
•	Output validation scan runs on every AI response before use
•	If output fails validation: retry once with simplified prompt, then activate rule-based fallback
•	30-second timeout — fallback activates automatically on timeout

MFR-009  Rule-Based Fallback Engine
•	Activated when: AI API fails, AI output fails validation, AI times out
•	Generates deterministic statements from metric templates only
•	All statements based on validated metrics — no speculation ever
•	Example output: 'Website traffic increased by 23% compared to last month. Bounce rate decreased by 4 percentage points. The top traffic source was Organic Search, accounting for 41% of all sessions.'
•	Report clearly labeled: 'Automated summary (AI narrative unavailable this period)'

MFR-010  Confidence Layer
•	Each insight labeled during agency review screen (not visible to end client in V1)
•	🟢 High Confidence: metric-backed, data complete, within normal range
•	🟡 Partial: some data Preliminary or at freshness edge
•	🔴 Unverified: metric failed validation — shown with warning, not in AI narrative
•	Overall report confidence shown in dashboard per client

MFR-011  Agency Review and Approval
•	Agency sees full draft report before any email is sent — no exceptions
•	Narrative section is an editable rich text field in the review screen
•	Original AI output, all edits, and final approved text stored in audit trail with timestamps
•	'Approve and Send' button is the only trigger for email delivery
•	Agency can reject and regenerate at any time before approval
•	Report is locked after approval — no further edits

MFR-012  PDF Report Generation
•	Generated server-side on Railway (not Vercel — 60s timeout issue)
•	Report sections in order: Agency-branded header, Executive Summary, Metric Cards with delta indicators (▲▼), Traffic Source Breakdown, Top Pages Table, AI/Fallback Narrative, Recommended Actions (AI-generated), Footer with data source and timestamp
•	Every metric card shows: current value, prior value, delta, source label ('Google Analytics')
•	Reportly branding absent from PDF — agency brand only
•	PDF max size: 5MB
•	prompt_version and template_version printed in report footer

MFR-013  Email Delivery
•	Sender name: agency name — not Reportly (via Resend custom domain)
•	SPF + DKIM authentication configured before any production sends
•	Email contains: 3-sentence summary, PDF attachment, data retrieval timestamp
•	Retry policy: 3 attempts (1 min, 5 min, 15 min backoff)
•	All delivery statuses logged: sent / delivered / opened / bounced / failed
•	Failed delivery surfaces in dashboard with manual resend button

MFR-014  Audit Trail
Stored permanently for every report:
•	Raw GA4 API response (JSON snapshot)
•	Processed and validated metric set
•	AI prompt sent (full text + prompt_version)
•	AI response received
•	Output validation result and rejection reason (if any)
•	User edits: original, all intermediate versions, final approved text, editor ID, timestamps
•	Email delivery log: recipient, sent timestamp, delivery status
•	Any system warnings or validation failures during generation

MFR-015  Rate Limit Protection
•	GA4 API: maximum 8,000 requests/day used (keeping 2,000 buffer below 10,000 quota)
•	Per-client cooldown: minimum 23-hour gap between data fetches
•	Hard rule: never retry immediately after 429 — minimum 60-second wait
•	Rate limit proximity visible in internal admin panel

MFR-016  Dead Letter Queue
•	Any job failing all retries moves to DLQ automatically
•	Agency notified when their report enters DLQ
•	DLQ visible in internal admin panel with full error context
•	Admin can re-trigger or discard DLQ items manually

MFR-017  Internal Admin Panel (Basic)
•	View all failed jobs with error messages
•	Re-run any report or data fetch job
•	View logs per client (API calls, AI I/O, email delivery)
•	Force API reconnect for any client
•	View and manage DLQ items
•	Toggle feature flags
•	Access restricted to founder — IP allowlist in production

MFR-018  Report History
•	All generated reports stored with PDF and full audit trail
•	Accessible from agency dashboard per client
•	PDF download and manual resend available for all reports
•	12-month retention minimum

3. MVP Data Model

Table	Key Fields
agencies	id, name, email, logo_url, brand_color, created_at
clients	id, agency_id, name, contact_email, report_emails[], schedule_day, timezone, deleted_at
api_connections	id, client_id, platform ('ga4'), access_token_enc, refresh_token_enc, ga_property_id, status, last_synced_at
metric_snapshots	id, client_id, period_start, period_end, raw_api_response (json), validated_metrics (json), validation_warnings[], freshness_status
reports	id, client_id, period_start, period_end, prompt_version, template_version, ai_narrative_raw, ai_narrative_edited, rule_based_narrative, final_narrative, confidence_summary, pdf_url, status, approved_at, approved_by
audit_logs	id, report_id, event_type, payload (json), created_at
report_emails	id, report_id, recipient_email, status, sent_at, opened_at
job_queue	id, job_type, client_id, status, attempts, next_retry_at, created_at
dead_letter_queue	id, original_job_id, error_message, stack_trace, created_at
prompt_versions	id, version_tag, prompt_text, deployed_at
feature_flags	id, flag_name, enabled, description

4. MVP Tech Stack

Layer	Technology	Cost
Frontend + Backend	Next.js + React (App Router)	Free (Vercel hobby)
Database + Auth	Supabase (PostgreSQL + RLS)	Free tier → $25/month
Queue + Cache	Upstash Redis + BullMQ	Free tier → $0.20/100K req
AI Narrative	Claude Haiku API	<$5/month for 50 clients
AI Fallback	Rule-based Node.js module	Free (no API)
PDF Generation	Puppeteer on Railway	Free credit → $5–20/month
Email Delivery	Resend	3,000 free/month → $20/month
Scheduled Jobs	Vercel Cron (trigger) + Railway (execute)	Covered above
Logging	Supabase audit_logs table + Logtail free tier	Free for MVP
Domain	.in domain	~₹900/year

5. MVP Acceptance Criteria

MVP is considered shippable when every item below passes:

1.	Agency registers, verifies email, and logs in successfully
2.	Onboarding wizard completable in under 30 minutes
3.	GA4 OAuth connection established and shows Connected status
4.	Cron job triggers on the configured day and pushes job to queue
5.	Data validation layer correctly flags null, spike, and stale metrics in all test cases
6.	AI narrative generated with verified metric citations for all 20 sample metric datasets
7.	Rule-based fallback produces coherent output for all 20 sample datasets when AI is disabled
8.	Confidence layer correctly assigns High/Partial/Unverified for all test scenarios
9.	Agency review screen shows editable narrative and all metrics with source labels
10.	Report locked after approval — no further edit possible
11.	PDF generated with agency branding, no Reportly branding visible
12.	Email sent from agency-branded sender with SPF and DKIM passing
13.	Email retry logic tested: 3 failures → marked failed in dashboard → agency notified
14.	Audit trail captures all required fields for 100% of test reports
15.	DLQ receives failed jobs and surfaces them in admin panel
16.	Rate limit: no 429 errors generated under 20-client simultaneous fetch test
17.	Token confirmed never-logged via log audit
18.	Soft delete confirmed: client data accessible 90 days post-deletion
19.	One complete end-to-end run using real GA4 Demo Account data produces a valid, approvable report

6. Recommended Build Order

Build in this sequence to always have a working, testable system at each stage:

Week	What to Build	Test Milestone
Week 1	Supabase schema, agency auth (register/login/verify), basic dashboard shell	Can register and log in
Week 2	GA4 OAuth connection, token encryption, connection status display	Can connect a GA4 account and see it confirmed
Week 3	Data fetch job, data validation layer, metric storage	Can fetch real GA4 data and validate it correctly
Week 4	Rule-based fallback engine (build this BEFORE AI)	Can generate a deterministic narrative from any valid metric set
Week 5	AI narrative integration (Claude Haiku), output validation, confidence layer	Can generate and validate AI narrative, fallback activates when AI disabled
Week 6	Agency review screen, edit functionality, approval flow, audit trail	Agency can review, edit, approve — full audit trail captured
Week 7	PDF generation (Puppeteer on Railway), white-label branding	Branded PDF matches design spec, no Reportly branding
Week 8	Email delivery (Resend), retry logic, delivery status logging, DLQ	End-to-end: GA4 data → report → agency approval → PDF email delivered
Week 9	Cron job scheduling, queue system (Upstash + BullMQ), rate limit protection	Automated monthly trigger works reliably for 5 test clients
Week 10	Internal admin panel, feature flags, logging, report history	Admin can debug, re-run jobs, toggle features
Week 11	Full MVP acceptance criteria testing, bug fixes, security audit	All 19 acceptance criteria pass
Week 12	Staging deployment, onboarding wizard, first real agency demo	First real agency completes onboarding and generates real report



Reportly MVP SRS v1.0  |  Build-Ready  |  Start with Week 1.
