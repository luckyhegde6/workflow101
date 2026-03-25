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

## In Progress

## Pending

- [ ] CI/CD configuration for E2E tests
- [ ] Address workflow package vulnerabilities (pending upstream fix)
