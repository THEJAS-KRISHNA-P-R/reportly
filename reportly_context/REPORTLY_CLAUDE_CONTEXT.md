# REPORTLY — Claude Context File
> **Who this is for:** Claude (the AI assistant) when helping the founder with product decisions, strategy, writing, debugging, architecture discussions, or anything that requires understanding the full picture of what Reportly is and why it exists.
> **How to use:** Paste this at the start of any Claude conversation about Reportly.

---

## What We're Building
**Reportly** is a B2B SaaS that automates monthly client reporting for digital marketing agencies. Agencies connect their Google Analytics and Meta Ads accounts once. Every month, Reportly fetches their data, validates it, generates an AI-written narrative explaining what happened, produces a branded PDF, and emails it to the agency's clients — with the agency reviewing and approving before it goes out.

**The short version of the pitch:** A 15-client agency wastes 90+ hours/month on reporting. Reportly does it in under 3 minutes per client. Existing tools cost $180–$800/month and still require humans to write the commentary. Reportly costs ₹1,499–₹6,999/month and writes it automatically.

---

## The Founder's Situation
- Based in Thrissur, Kerala, India
- Advanced vibe-coder (ships full-stack apps but understands systems better than syntax)
- Already built and deployed a full ecom site (haxeus.in) using Next.js, Supabase, Redis, Node.js
- Goals: get a job, build real revenue as a side income, build startup potential, learn new tech
- Target first customers: small digital marketing agencies in Kerala/Kochi with 5–20 employees

---

## Core Ideology (Know This Before Helping With Anything)
Reportly is **not** a feature showcase. It is a **reliability-first automation system**.

> *"If the system is unsure, it must slow down — not guess."*
> *"Make every output explainable, every failure visible, and every decision shared."*

Every decision gets filtered through:
- Reliability over features
- Correctness over fancy UI
- Transparency over AI magic
- Failing gracefully over failing silently

**The hardest rule:** If the system has to choose between sending a wrong report or not sending a report — it must NOT send the report.

---

## Responsibility Architecture (Critical for Any Blame/Liability Questions)
| Component | Owns |
|---|---|
| Google / Meta | Accuracy of raw data |
| Reportly | Data validation, processing, formatting, delivery, audit trail |
| Agency | Final interpretation, approval, client relationship |

Reportly is not the analyst. It is the automation layer. The agency always approves before the client sees anything.

**Legal protection built into the product:**
- Every report footer: "Generated using third-party data (Google Analytics, Meta Ads). Agencies are encouraged to review before delivery."
- Mandatory agency approval before every send (MVP rule — no exceptions)
- Every insight links to its source metric and data source label
- Full audit trail per report: raw API response → AI prompt/output → user edits → delivery log

---

## What the AI Does (and Doesn't Do)
**Does:** Reads validated metric numbers and writes plain-English commentary explaining what changed and what to do next.

**Does NOT:** Invent causes without data. Use speculative language without metric backing. Sound more confident than the data supports.

**Fallback chain if AI fails:**
1. Retry with simplified prompt
2. Rule-based deterministic engine (template sentences from metric data)
3. Send report without narrative, clearly labeled

**Confidence layer:** Every insight labeled 🟢 High / 🟡 Partial / 🔴 Unverified during agency review.

---

## Tech Stack (What's Already Decided)
- **Frontend + Backend:** Next.js + React (App Router) — founder already knows this
- **Database:** Supabase (PostgreSQL + Row-Level Security) — founder already knows this
- **Cache/Queue:** Upstash Redis + BullMQ — founder already uses Redis
- **AI:** Claude Haiku API (~$0.001/report)
- **AI Fallback:** Rule-based Node.js module (no API dependency)
- **PDF:** Puppeteer on Railway (NOT Vercel — 60s timeout limit)
- **Email:** Resend (3,000 free/month)
- **Scheduling:** Vercel Cron (trigger) + Railway (execute)
- **Auth/OAuth:** NextAuth.js + Supabase Auth

---

## MVP Scope (What We're Building First)
**In:**
- Google Analytics 4 only (Meta Ads is V2)
- Monthly reports only
- 1 standard report template
- AI narrative + rule-based fallback
- Full data validation layer
- Confidence layer
- Audit trail
- Agency review and approval
- PDF generation + email delivery
- Rate limit protection
- Dead Letter Queue (basic)
- Internal admin panel (basic)

**Out (V2/V3):**
- Meta Ads, Google Search Console, Google Ads
- Weekly reports
- Custom templates
- Client-facing portal
- Team roles/permissions
- Slack/WhatsApp notifications
- Multi-language

---

## The 12 Critical Reliability Gaps (All Addressed in Design)
1. **Data validation layer** — null checks, spike detection (>300%), zero-value anomaly, freshness check before any metric is used
2. **Data freshness policy** — GA4: 48h max lag, Meta: 72h max lag. Beyond threshold → Preliminary Data label
3. **Rate limit protection** — Redis queue, per-client cooldown, hard rule: never retry immediately after 429
4. **Report versioning** — every report stores prompt_version, template_version, logic_version
5. **AI prompt governance** — prompts versioned, tested on 20 sample datasets, backward-compatible changes only
6. **Audit trail** — raw API snapshot, processed metrics, AI prompt+output, all user edits stored permanently per report
7. **Deployment and rollback** — staging environment, one-command rollback, feature flags on everything risky
8. **Dead Letter Queue** — failed jobs stored, surfaced in admin panel, manually re-triggerable
9. **Internal admin tooling** — view logs, re-run jobs, force reconnects, manage DLQ, toggle flags
10. **Business edge cases** — soft delete (90-day retention), email validation before send, report locked during generation
11. **Trust UX microcopy** — "Last updated from Google: 2 hours ago", "Based on verified data", "Review before sending"
12. **Critical vs non-critical path** — only data fetch + validation failures block a report; AI, charts, styling degrade gracefully

---

## Pricing
| Plan | Price | Clients |
|---|---|---|
| Starter | ₹1,499/month | Up to 5 |
| Growth | ₹3,499/month | Up to 15 |
| Agency Pro | ₹6,999/month | Up to 40 |
| Enterprise | Custom | Unlimited |

First 3 customers: 3 months free in exchange for written testimonial + permission to use anonymized report as demo.

---

## Competitors and Why They Don't Win
- **Whatagraph, AgencyAnalytics, DashThis** — $180–$800/month, no AI narrative, no data validation, no confidence layer, require humans to write commentary, ignore India market entirely
- **ChatGPT** — doesn't connect to GA/Meta, doesn't auto-run on schedule, doesn't generate the PDF, doesn't email the client, doesn't store history. Requires 3 hours of manual work before it can even help.

---

## Go-To-Market (First Customers)
1. Search digital marketing agencies in Kochi/Kerala with 5–20 employees
2. Walk in with a live demo on a laptop using Google Demo Analytics account
3. One-sentence pitch: "You spend 3 hours making each client report. This does it in 3 minutes."
4. Offer 3 months free, no credit card
5. After first happy customer: ask for one referral
6. Post before/after of a real report on LinkedIn, tag Kerala digital marketing communities

---

## How to Test Without a Real Agency
- Use your own Google account with any website analytics as test data
- Google provides a free public **Demo Analytics Account** specifically for developers
- Meta has a **Test Ad Account** feature for development
- Full MVP can be built and tested without a single real paying customer

---

## What This Project Is NOT
- Not a BI tool or data warehouse
- Not a replacement for the account manager's strategic judgment
- Not a competitor to Google Analytics or Meta Ads
- Not a guarantee of accurate insights — it is a trusted processor of third-party data
- Not suitable for agencies that want to hide metrics from clients

---

## Document Map
When helping with this project, these documents exist and may be referenced:
- `REPORTLY_CONTEXT.md` — This file (Claude context)
- `REPORTLY_AGENT_CONTEXT.md` — Technical context for AI coding agents
- `PROJECT_REPORT.md` — Full business overview, USP, stakeholders, costs, GTM
- `SRS_FULL.md` — Complete SRS with all features, V1 through V3 scope
- `SRS_MVP.md` — MVP-only SRS with week-by-week build order

---

*Version: 2.0 | Last Updated: 2025 | Status: Finalized for MVP Build*
