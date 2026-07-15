# Project Context: Everything Workflow System

## Overview
An "everything workflows" system that orchestrates durable, fault-tolerant workflows using DBOS SDK, deployed on Vercel. Supports scheduling, monitoring, approvals, audit logging, and 6 workflow types.

## Tech Stack
- **Framework**: Next.js 16.2.1 (with Turbopack, App Router)
- **Workflow Engine**: DBOS SDK (durable execution, Vercel integration)
- **Database**: Local PostgreSQL only (Supabase removed)
- **Testing**: Vitest (153 unit tests) + Playwright (E2E)
- **Monitoring**: Sentry (errors, metrics, tracing)
- **Deployment**: Vercel (cron triggers, queues, analytics)
- **Packages**: `workflow` 4.2.0-beta.71, `@vercel/analytics`, `@vercel/otel`

## Agent System
- **Configuration**: `.agents/AGENTS.md` — agent-agnostic, shared across all tools
- **Guardrails**: `.agents/rules/guardrails.md` — 21 guardrails across 5 categories
- **Session Lifecycle**: `.agents/rules/lifecycle.md` — START → WORK → HANDOFF → END
- **Agent Roles**: `.agents/rules/agents.yaml` — 15 roles (orchestrator, planner, developer, reviewer, e2e-tester, security, build-fixer, knowledge, gh-helper, bug-fixer, e2e-agent, integrator, observability, devops, qa)
- **Handoff Files**: `.agents/handoffs/YYYYMMDD-HHMMSS-<agent>-<label>.md` — YAML frontmatter + Markdown
- **Memory**: `.agents/memory.md` — append-only cross-session memory
- **Scripts**: create-handoff.cjs, read-handoff.cjs, validate-handoff.cjs

### Agent Commands

| Command | Agent | Purpose |
|---------|-------|---------|
| `/plan` | planner | Create implementation plan |
| `/tdd` | tdd-guide | Test-driven development |
| `/code-review` | code-reviewer | Review code quality and security |
| `/security` | security-reviewer | Security audit |
| `/build-fix` | build-error-resolver | Fix build errors |
| `/e2e` | e2e-runner | Run Playwright E2E tests |
| `/e2e-write` | e2e-agent | Write E2E tests with Page Objects |
| `/pr` | gh-helper | GitHub PR management and diff review |
| `/integrate` | integrator | Integration testing |
| `/observe` | observability | Check monitoring and observability |
| `/deploy` | devops | Docker, Vercel, CI/CD management |
| `/qa` | qa | Full QA validation and flow testing |
| `/bug-fix` | bug-fixer | Diagnose and fix bugs (TDD) |

## Key Architecture Decisions
- **Local PostgreSQL only** — Supabase project deleted; all DB via `pg` (node-postgres)
- **Sentry for monitoring** — Errors, metrics (`workflow_status_count`, `workflow_runtime_ms`, etc.), distributed tracing via OTLP
- **Immutability** — Never mutate objects; always return new copies
- **Error handling at every level** — Custom error classes (WorkflowError, TimeoutError, RetryExhaustedError, CircuitBreakerError), withRetry/withTimeout utilities
- **Pre-commit security checks** — Automated secret scanning via `scripts/pre-commit-security.js`
- **Handoff-first sessions** — Every session starts by reading latest handoff, ends by creating one

## Workflow Types
| Type | Name |
|------|------|
| Example | `exampleWorkflow` |
| Email | `emailNotificationWorkflow` |
| Data Processing | `dataProcessingWorkflow` |
| Onboarding | `onboardingWorkflow` |
| Scheduled Report | `scheduledReportWorkflow` |
| Webhook Handler | `webhookHandlerWorkflow` |

## Current State
- All 153 unit tests pass
- E2E tests being stabilized (Playwright)
- DBOS workflow execution functional (local dev only)
- Vercel deployment configured but workflows require local DBOS runtime
- Handoff system operational — create handoffs before session end
