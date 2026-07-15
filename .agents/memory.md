<!--
╔══════════════════════════════════════════════════════════════╗
║              .agents/memory.md                               ║
║  Persistent Cross-Session Memory                             ║
║  Append-only — Never delete entries                          ║
╚══════════════════════════════════════════════════════════════╝
-->

# Agent Memory

This file stores persistent knowledge that survives across sessions.  
It is **append-only** — never delete or modify existing entries.  
Each entry has a timestamp and source session ID.

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Critical Decisions](#critical-decisions)
3. [Known Issues & Workarounds](#known-issues--workarounds)
4. [Agent Patterns](#agent-patterns)
5. [Environment Quirks](#environment-quirks)
6. [Contact People](#contact-people)

---

## Project Architecture

| Date | Session | Entry |
|------|---------|-------|
| 2026-07-16 | initial | **Stack**: Next.js 16.2.1, DBOS SDK, local PostgreSQL, Vercel deployment |
| 2026-07-16 | initial | **Testing**: Vitest (unit), Playwright (E2E), 153 unit tests, mixed E2E state |
| 2026-07-16 | initial | **Monitoring**: Sentry (errors, metrics, tracing), Vercel Analytics |
| 2026-07-16 | initial | **Workflows**: 6 types (example, email, data-processing, onboarding, scheduled-report, webhook) |
| 2026-07-16 | initial | **6 workflow types**: Example, Email Notification, Data Processing, Onboarding, Scheduled Report, Webhook Handler |

---

## Critical Decisions

| Date | Session | Decision |
|------|---------|----------|
| 2026-07-16 | initial | **Local PostgreSQL Only**: Supabase project deleted, all DB via `pg` (node-postgres) |
| 2026-07-16 | initial | **Handoff File System**: `.agents/handoffs/` for cross-session handoff, YAML frontmatter + Markdown |
| 2026-07-16 | initial | **Agent-Agnostic Config**: `.agents/AGENTS.md` as single source of truth, referenced by all tools |

---

## Known Issues & Workarounds

| Date | Issue | Workaround | Session |
|------|-------|------------|---------|
| 2026-07-16 | DBOS.launch() hangs without timeout | Wrap in 5s timeout, lazy init, return 503 fallback | initial |
| 2026-07-16 | Node.js builtins in browser bundles cause ERR_MODULE_NOT_FOUND | Dynamic import with ssr:false + resolve alias | initial |
| 2026-07-16 | rmdir /s /q node_modules hangs on Windows (antivirus) | Temp directory install + xcopy, never delete node_modules | initial |
| 2026-07-16 | F: drive file operations are slow | Minimize file I/O, batch reads/writes | initial |

---

## Agent Patterns

| Date | Session | Pattern |
|------|---------|---------|
| 2026-07-16 | initial | **Handoff-first**: Every session starts by reading latest handoff, ends by creating one |
| 2026-07-16 | initial | **Guardrail enforcement**: All agents load .agents/rules/guardrails.md before any work |
| 2026-07-16 | initial | **TDD for fixes**: Write reproducing test → verify fail → fix → verify pass |

---

## Environment Quirks

| Date | Detail |
|------|--------|
| 2026-07-16 | Platform: Windows (win32) — cmd.exe shell, F: drive slower than C: |
| 2026-07-16 | Docker PostgreSQL via docker-compose — check compose file for port |
| 2026-07-16 | E2E: Chromium tests pass (54), Firefox/WebKit missing browser binaries |
| 2026-07-16 | PowerShell scripts need explicit `-ExecutionPolicy Bypass` |

---

## Contact People

(To be filled in as team members are identified.)

| Name | Role | Contact |
|------|------|---------|
| — | — | — |

---

## Session Log

| Session ID | Date | Agent | Summary |
|------------|------|-------|---------|
| initial | 2026-07-16 | — | Initial memory seed — project architecture, decisions, issues |
| 2026-07-16-handoff-system-init | 2026-07-16 | orchestrator | Created .agents/ handoff system with 21 guardrails, 8 agent roles, lifecycle, 6 patterns, 3 scripts |

---

## Change History

| Date | Change |
|------|--------|
| 2026-07-16 | Initial creation — seeded with project architecture, decisions, issues |
| 2026-07-16 | Added handoff system: .agents/ with 21 guardrails, 8 agent roles, lifecycle, 6 patterns, 3 scripts |
