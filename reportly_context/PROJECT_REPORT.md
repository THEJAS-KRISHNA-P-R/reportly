


REPORTLY
AI-Powered Agency Reporting Automation


Project Report & Business Overview  |  v2.0  |  2025






 
1. Executive Summary

Reportly is a B2B SaaS platform built for digital marketing agencies. It automatically connects to Google Analytics and Meta Ads via OAuth, retrieves aggregated performance data, validates it against a strict data integrity layer, generates an AI-written narrative, and delivers a branded PDF report to the agency's clients — all without human intervention after initial setup.

The core differentiator is not just AI-generated text — it is a reliability-first system with hybrid intelligence, explainable outputs, confidence scoring, mandatory human review, and a full audit trail. Agencies don't just save time; they gain a reporting system they can trust and stand behind.

2. The Problem

Digital marketing agencies managing 10–30 clients face a monthly reporting crisis that costs them real money and credibility:

•	90+ hours of non-billable reporting work per month for a 15-client agency
•	Reports are inconsistent in quality, tone, and depth across account managers
•	Raw numbers reach clients without explanation — leading to confusion and churn
•	Senior account managers are pulled off strategy work to compile spreadsheets
•	Existing tools (Whatagraph, AgencyAnalytics) cost $180–$800/month and still require humans to write commentary
•	No existing tool validates data integrity before generating insights — leading to reports with wrong or misleading numbers

The last point is the most dangerous: a report that confidently states 'traffic dropped 80%' when the API simply failed to return data destroys agency credibility in seconds.

3. The Solution

Reportly solves the entire reporting workflow end-to-end, with a reliability architecture that ensures every output is trustworthy:

•	Connects to Google Analytics and Meta Ads via secure OAuth (read-only access)
•	Validates all retrieved data against null checks, anomaly detection, and freshness policy before use
•	AI generates a plain-English narrative anchored to verified metrics only
•	Rule-based fallback engine activates automatically if AI fails or produces uncertain output
•	Confidence layer labels every insight: High / Partial / Unverified
•	Agency reviews, edits, and approves the narrative before it reaches the client
•	Branded PDF is generated and emailed automatically on schedule
•	Full audit trail stores every API response, AI input/output, and user edit permanently

4. Unique Selling Proposition

Reportly's USP is not just AI-written reports. It is the only reporting tool that combines automation with a trust architecture — making AI output something an agency can confidently put their name on.

Feature	Competitors	Reportly
Data pulling from GA + Meta	Yes	Yes
Charts and dashboards	Yes	Yes
AI narrative writing	Basic or none	Full, contextual, editable
Data validation before AI	No	Yes — null, anomaly, freshness checks
Confidence scoring per insight	No	Yes — High / Partial / Unverified
Rule-based AI fallback	No	Yes — deterministic backup narrative
Audit trail per report	No	Yes — full input/output/edit history
Mandatory human review layer	No	Yes — agency approves before send
White-label branding	Paid add-on	Included in all plans
India-focused pricing	$180–$800/month	₹1,499–₹6,999/month
Setup time	Days	Under 30 minutes

5. How It Works

5.1 Data Flow (End to End)
Step	What Happens	Failure Behaviour
1. OAuth Connection	Agency connects GA4 and Meta Ads accounts once via OAuth	Connection marked Disconnected, agency notified immediately
2. Scheduled Data Fetch	Cron job pulls aggregated metrics on report date	Exponential backoff retry × 3, then mark DATA UNAVAILABLE
3. Data Validation	Null checks, anomaly detection (>300% spike), freshness check	Metric flagged as Unreliable, excluded from AI narrative
4. AI Narrative	Validated metrics sent to Claude Haiku API with strict prompt template	Fallback to rule-based engine, then send without narrative if both fail
5. Output Validation	AI output scanned for speculative language and hallucination patterns	Output rejected, rule-based engine activated
6. Agency Review	Agency sees draft report, edits narrative, approves or rejects	No report ever reaches client without explicit approval
7. PDF Generation	Branded PDF built server-side with Puppeteer	Retry with reduced complexity, then HTML fallback
8. Email Delivery	Report emailed from agency-branded sender via Resend	Retry × 3, then mark failed and notify agency
9. Audit Logging	Raw API response, processed metrics, AI prompt+output, edits all stored	Logging failure does not block report — logged to error queue

6. Stakeholders

Stakeholder	Role	Primary Interest
Agency Owner	Primary buyer	Cut reporting overhead, look professional, retain clients
Account Manager	Daily dashboard user	Save hours monthly, avoid errors, easy review and approval flow
Agency's Client	Report recipient (email only)	Clear communication, no jargon, timely delivery, accurate numbers
Developer / Founder	Builder and seller	Revenue, portfolio credibility, job prospects, scalable architecture
Google (GA4 API)	Data source	OAuth compliance, API quota and terms adherence
Meta (Ads API)	Data source	OAuth compliance, rate limit adherence, platform terms
Anthropic / OpenAI	AI narrative provider	API usage within terms, content policy compliance
Resend	Email delivery	Authenticated sending, bounce rate management
Vercel / Railway	Hosting and background jobs	Uptime, deployment compliance
Supabase	Database, auth, RLS	Data volume, row-level security configuration

7. Tech Stack

Layer	Technology	Reason
Frontend	Next.js + React	Already known from prior projects (Haxeus)
Backend	Next.js API Routes + Node.js	Same repo, no separate server needed for MVP
Database	Supabase (PostgreSQL + RLS)	Already known; Row-Level Security enforces data isolation
Cache / Queue	Upstash Redis	Already used; handles job queuing and API rate limit cache
AI Narrative	Claude Haiku API	Cheapest, fastest, sufficient quality; ~$0.001/report
AI Fallback	Rule-based template engine	Deterministic; no API dependency; always available
PDF Generation	Puppeteer (server-side)	Full layout control; runs on Railway, not Vercel (timeout limit)
Email Delivery	Resend	Simple API; 3,000 free emails/month; excellent deliverability
Auth + OAuth	NextAuth.js + Supabase Auth	Handles Google and Meta OAuth flows cleanly
Scheduled Jobs	Vercel Cron → Railway (scale)	Free for MVP; migrate to dedicated worker at scale
Job Queue	Upstash Redis + BullMQ	Prevents month-end cron spike; enables Dead Letter Queue
Logging / Audit	Supabase audit_logs table + Logtail	Stores all API responses, AI I/O, email status, user edits

8. Cost Breakdown

8.1 Per-Report AI Cost
Each report sends ~2,500 tokens to Claude Haiku and receives ~600 tokens back. Total cost per report: under $0.001 (less than ₹0.10). For 50 clients at 1 report/month: under ₹5/month in AI costs. Margin is effectively 97%+.

8.2 Monthly Infrastructure
Service	Free Tier	Paid Tier	Upgrade Trigger
Supabase	500MB, 2 projects	$25/month (Pro)	Storage or project limit hit
Vercel	Unlimited hobby deploys	$20/month (Pro)	Team features or custom domain email needed
Railway	~$5 free credit/month	$5–20/month	Background jobs exceed free credit
Upstash Redis	10,000 requests/day free	$0.20 per 100K requests	High-frequency job queuing
Claude Haiku API	Pay per use	<$5/month for 50 clients	Always cheap at this scale
Resend	3,000 emails/month free	$20/month	More than 3,000 emails/month
Logtail (logging)	1GB/month free	$25/month	Log volume exceeds free tier
Domain (.in)	N/A	~₹900/year	One-time purchase

8.3 Phase Summary
Phase	Monthly Cost	Revenue	Notes
Building and testing (0 customers)	₹0 – ₹800	₹0	Domain + free tiers only
First 10 customers	₹1,500 – ₹2,500	₹15,000 – ₹35,000	Supabase Pro likely needed
First 50 customers	₹3,000 – ₹5,000	₹75,000 – ₹1,75,000	All paid tiers active
100 customers	₹8,000 – ₹12,000	₹1,50,000 – ₹3,50,000	Scale Redis and Railway

9. Engineering Reliability Layer

The following are the 12 critical reliability concerns identified in architecture review and their resolution in Reportly's design:

Gap	Risk Without It	Reportly's Solution
Data Validation Layer	AI generates '100% traffic drop' from a null API response	Null check, spike detection (>300%), zero-value anomaly check before any metric is used
Data Freshness Policy	Report sent with incomplete month data (GA lags 24–48h)	GA: 48h max lag allowed. Meta: 72h. Beyond threshold → marked Preliminary Data
Rate Limit Protection	50 clients trigger simultaneously, API blocks the account	Redis queue with random ±2–6h delay, per-client cooldown, hard rule: never retry immediately after 429
Report Versioning	Format changes confuse clients month-to-month	Every report stores prompt_version, template_version, logic_version. Breaking changes require new version tag
AI Prompt Governance	Prompt changes cause unpredictable output at scale	Prompts are versioned, tested on 20 sample datasets before deployment, changes are backward-compatible or tagged
Audit Trail	Agency disputes a report — no way to prove what data was used	Raw API snapshot, processed metrics, AI prompt + output, user edits (before/after) stored per report permanently
Deployment and Rollback	New deployment breaks report generation for all clients	Staging environment, feature flags for every risky feature, one-command rollback
Dead Letter Queue	Failed jobs silently disappear after retries	Failed jobs go to DLQ in Redis. Manual or scheduled reprocessing. Admin panel shows all DLQ items
Admin / Internal Tooling	Something breaks in production with no way to diagnose	Internal admin panel: view failed jobs, re-run reports, view logs per client, force API reconnect
Business Edge Cases	Client deleted mid-cycle, report still generates and emails wrong address	Soft delete (90-day retention), email validation before send, report locked during generation
Trust UX Microcopy	Users don't trust automated output without visible signals	'Last updated from Google: 2 hours ago', 'Based on verified data', 'Review before sending' shown throughout UI
Critical vs Non-Critical Path	A chart rendering failure blocks the entire report	Only data fetch + validation failures block. AI narrative, charts, styling degrade gracefully

10. Competitive Positioning

Reportly is not competing with Whatagraph globally on day one. The strategy is to dominate a specific underserved segment first, then expand.

Phase 1 — India, Small Agencies (MVP to 50 customers)
•	Target: Digital marketing agencies in Kerala and Kochi with 5–20 employees
•	Pricing advantage: 10–30x cheaper than global competitors
•	Language advantage: Reports can reference India-specific context (festival seasons, IPL campaign periods)
•	Sales advantage: Walk-in demo in the local market

Phase 2 — Pan-India (50 to 500 customers)
•	Expand to Bangalore, Mumbai, Delhi NCR agency markets
•	Add Google Ads and Search Console integrations
•	Launch agency referral program

Phase 3 — Global SMB Agencies
•	English-language reports already ready
•	Add USD/GBP/AED pricing tiers
•	AppSumo lifetime deal or Product Hunt launch to seed global users

11. Pricing Strategy

Plan	Price	Clients	Key Features
Starter	₹1,499/month	Up to 5	GA4 only, monthly reports, standard template
Growth	₹3,499/month	Up to 15	GA4 + Meta Ads, monthly reports, white-label, editable narrative
Agency Pro	₹6,999/month	Up to 40	All integrations, weekly reports, priority support, audit trail export
Enterprise	Custom	Unlimited	Custom integrations, dedicated support, SLA guarantee

First customer strategy: Offer 3 months completely free to 3 agencies in exchange for a written testimonial and permission to use an anonymized sample report as a public demo. This solves the cold-start trust problem without discounting the product permanently.

12. Go-To-Market Plan

Week 1–2: Identify Targets
•	Search 'digital marketing agency Kochi', 'social media agency Kerala' on Google Maps
•	Build a list of 20 agencies with 5–20 employees
•	Find the agency owner's name on LinkedIn

Week 3–4: Outreach
•	Walk in with a laptop showing a live generated report from the Google Demo Analytics account
•	The pitch is one sentence: 'You spend 3 hours making each client report. This does it in 3 minutes.'
•	Leave a 1-page PDF explaining the product and pricing

Month 2: Convert and Retain
•	First 3 agencies get 3 months free — onboard them personally and fix every issue immediately
•	After month 1, ask for one referral from each happy agency
•	Post a before/after of a real report on LinkedIn — tag Kerala digital marketing communities

Month 3+: Scale
•	Use testimonials and real report samples as sales collateral
•	Launch on Product Hunt India and relevant Reddit/LinkedIn communities
•	Begin outreach to Bangalore market with proven case studies



Reportly v2.0  |  Built for agencies. Trusted by design. Made in Kerala.
