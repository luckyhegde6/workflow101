# TODOS

## Completed

### Core Setup
- [x] OpenCode agent structure setup
- [x] Agent commands (/plan, /tdd, /code-review, etc.)
- [x] Plugin hooks for format/typecheck
- [x] All 11 skills created
- [x] Integration tests (workflow + API)
- [x] AI workflow implementation
- [x] Error handling utilities
- [x] Swagger UI embedded at /docs

### UI Pages
- [x] Dashboard, Config, Cron, Docs E2E tests
- [x] HTTP logging middleware
- [x] Database logging middleware
- [x] Logs page (/logs)
- [x] Enhanced observability page with worker status
- [x] Logs API endpoints
- [x] Navbar with page links
- [x] About page (/about)
- [x] Contact page (/contact)
- [x] File upload page (/files) with Vercel Blob

### Workflow System
- [x] Workflow scheduling system (immediate, scheduled, recurring)
- [x] Step-by-step configuration wizard
- [x] Confirmation popup
- [x] Human-in-the-loop approvals
- [x] Audit logging
- [x] Vercel Queues integration

### Database & Integration
- [x] Supabase integration
- [x] Database configuration module (USE_REMOTE support)
- [x] Local PostgreSQL vs Supabase switching
- [x] Supabase client helpers

### Security
- [x] Pre-commit security hook (secret detection)
- [x] Secret management rules in AGENTS.md
- [x] .gitignore updated with secret patterns
- [x] Real secrets removed from .env (moved to .env.local)
- [x] SECURITY.md created

### Observability
- [x] OpenTelemetry tracing (instrumentation.ts)
- [x] Vercel Analytics integration
- [x] Sentry error tracking and distributed tracing
- [x] Sentry secrets moved to .env.local

### Testing & Documentation
- [x] Playwright CLI integration
- [x] E2E testing documentation
- [x] Documentation updated (README, AGENTS, CHANGELOG)
- [x] Session files (primer.md, CHANGELOG.md, TODOS.md, LESSONS.md)

### Agent Handoff System (2026-07-16)
- [x] `.agents/` directory structure with AGENTS.md master config
- [x] `rules/guardrails.md` — 21 universal guardrails across 5 categories
- [x] `rules/lifecycle.md` — Session lifecycle (START → WORK → HANDOFF → END)
- [x] `rules/agents.yaml` — 8 agent role definitions (agent-agnostic)
- [x] `HANDOFF_SCHEMA.md` — Handoff file format specification (v1.0)
- [x] `templates/handoff-template.md` — Reusable handoff template
- [x] `patterns/handoff-patterns.md` — 6 reusable handoff patterns
- [x] `memory.md` — Persistent cross-session memory
- [x] `scripts/create-handoff.cjs` — Automated handoff generation
- [x] `scripts/read-handoff.cjs` — Handoff reading and parsing
- [x] `scripts/validate-handoff.cjs` — Handoff format validation
- [x] AGENTS.md updated with handoff system documentation
- [x] CLAUDE.md references `.agents/AGENTS.md`
- [x] opencode.json includes `.agents/AGENTS.md` in instructions
- [x] `.opencode/instructions/` updated with handoff knowledge
- [x] `.gitignore` updated for handoff files
- [x] CHANGELOG.md updated

## In Progress

## Pending

- [ ] CI/CD configuration for E2E tests
- [ ] Address workflow package vulnerabilities (pending upstream fix)
- [ ] `dbos-config.yaml` missing - DBOS CLI needs this for full workflow management
- [ ] `@workflow/core` exports issue - Internal path `./dist/runtime/helpers` not in exports field
- [ ] DBOS SDK Node.js v24 compat - `ERR_PACKAGE_PATH_NOT_EXPORTED` on some SDK packages

## Known Issues

### E2E
- [x] **Config selector fixed** - Added `data-testid="config-description"` to source component
- [x] **`/api/dbos` timeout fixed** - Lazy init with 5s timeout, returns 503 on failure
- [x] **`/api/workflows` timeout fixed** - 10s timeout wrapper, returns 504 on failure
- [x] **`/docs` Swagger UI fixed** - dynamic import with `ssr:false` + CJS resolve alias
- [x] **All 54 chromium E2E tests pass** — Firefox/WebKit failures are missing browser binaries (pre-existing env issue)

### Agent Orchestrator
- [x] **opencode.json updated** — 6 agents, permissions, context/knowledge base links
- [x] **Knowledge base created** — 4 files in `.opencode/instructions/`
- [x] **Commands updated** — All 6 enhanced with Outcome Capture for self-learning
- [x] **3 ADRs created** — Orchestrator design, E2E fix strategy, Knowledge base architecture
- [x] **PRD.md enhanced** — Section 8: Agent Orchestrator with self-learning loops
- [x] **Memory graph seeded** — 6 entities with project, architecture, and bug information
- [x] **Handoff system created** — `.agents/` with 21 guardrails, 8 agent roles, handoff lifecycle
