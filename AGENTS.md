<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:reportly-ai-skills -->
# Reportly AI Skills Contract

All AI agents working in this repository must follow the local skill source and roadmap below.

## Required Skill Files

- `ai_skills/README.md`
- `ai_skills/TIER1_SKILLS_MAP.md`
- `ai_skills/PHASED_IMPLEMENTATION_ROADMAP.md`

## Enforcement Rules

- Before implementation, map the task to the relevant Tier-1 skill entry.
- For architecture, security, queueing, testing, and release tasks, follow the roadmap phase order.
- If code and roadmap conflict, update roadmap docs first with rationale, then implement code.
- Do not introduce implementation patterns that violate these files.

## Scope

This contract applies to all AI tools and assistants used in this repo (Copilot, Claude, Cursor, and other agents).
<!-- END:reportly-ai-skills -->
