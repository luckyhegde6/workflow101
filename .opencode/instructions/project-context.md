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

## Key Architecture Decisions
- **Local PostgreSQL only** — Supabase project deleted; all DB via `pg` (node-postgres)
- **Sentry for monitoring** — Errors, metrics (`workflow_status_count`, `workflow_runtime_ms`, etc.), distributed tracing via OTLP
- **Immutability** — Never mutate objects; always return new copies
- **Error handling at every level** — Custom error classes (WorkflowError, TimeoutError, RetryExhaustedError, CircuitBreakerError), withRetry/withTimeout utilities
- **Pre-commit security checks** — Automated secret scanning via `scripts/pre-commit-security.js`

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
