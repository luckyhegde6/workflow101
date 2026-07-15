# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Agent Handoff & Self-Learning System** (`.agents/`)
  - Agent-agnostic configuration shared across all AI tools
  - `.agents/AGENTS.md` — Master agent config (entry point for CLAUDE.md, opencode.json)
  - `.agents/rules/guardrails.md` — 21 universal guardrails across 5 categories
  - `.agents/rules/lifecycle.md` — Session lifecycle: START → WORK → HANDOFF → END
  - `.agents/rules/agents.yaml` — 8 tool-agnostic agent role definitions
  - `.agents/memory.md` — Persistent cross-session memory (append-only)
  - `.agents/handoffs/HANDOFF_SCHEMA.md` — Handoff file format specification (v1.0)
  - `.agents/patterns/handoff-patterns.md` — 6 reusable handoff scenarios
  - `.agents/templates/handoff-template.md` — Handoff file template

- **Handoff Management Scripts** (`.agents/scripts/`)
  - `create-handoff.cjs` — Auto-generates handoff files with YAML frontmatter
  - `read-handoff.cjs` — Reads and parses handoff files with formatted output
  - `validate-handoff.cjs` — Validates handoff files against schema

- **Knowledge Base Updates** (`.opencode/instructions/`)
  - `lessons.md` — Added handoff and self-learning system lessons
  - `patterns.md` — Added handoff file pattern and session lifecycle pattern
  - `error-solutions.md` — Added handoff validation errors and session continuity loss solutions
  - `project-context.md` — Added Agent System section with .agents/ architecture

### Changed

- **AGENTS.md** — Restructured with handoff mechanism section, load order, and .agents/ architecture
- **CLAUDE.md** — Simplified to reference `.agents/AGENTS.md` only (no duplication)
- **opencode.json** — Added `.agents/AGENTS.md` to instructions array
- **.gitignore** — Added handoff file patterns to ignore list

### Fixed

### Removed

- **Vercel project** `workflow101` deleted (was referencing deleted Supabase DB)
- **Supabase configuration** from `.env` and `.env.local` files

### Security

- **Pre-commit Security Hook** (`scripts/pre-commit-security.js`)
  - Automatic detection of hardcoded secrets
  - Pattern matching for API keys, passwords, tokens
  - Scans TypeScript, JavaScript, JSON, YAML files
  - Safe patterns for localhost/dev credentials
  - Command: `npm run security:check`
  - Install hook: `npm run security:install-hooks`

- **Secret Management**
  - `.gitignore` updated with comprehensive secret file patterns
  - Real secrets removed from `.env` (moved to `.env.local`)
  - All database connections read from environment variables
  - AGENTS.md updated with security rules

- **Known Vulnerability Disclosure**
  - Created `SECURITY.md` documenting known vulnerabilities
  - Transitive dependencies from `workflow` package (beta)
  - Undici WebSocket vulnerabilities (pending upstream fix)
  - Devaluate prototype pollution (pending upstream fix)
  - Mitigation strategies documented

### Added

- **Visual Workflow Analysis** (`workflow-analysis/`)
  - 13 screenshots captured across all 12 pages
  - Comprehensive `BUILT_BUGS.md` with bug tracking, API endpoint status, UX findings
  - Config wizard verified for all 6 workflow types × 3 schedule types

- **Config wizard validation feedback** (`app/config/page.tsx`)
  - Added `validationError` state with yellow warning banner when user tries to proceed without filling parameters
  - Added `data-testid="validation-error"` for test verification
  - Validation auto-clears when user starts typing

- **Dashboard retry notification toast** (`app/page.tsx`)
  - Added green success / red error toast after clicking Retry on failed workflows
  - Auto-dismisses after 4 seconds
  - Added `data-testid="notification-toast"` for test verification
  - Dismiss button included

- **Relative timestamps for workflow cards** (`app/components/WorkflowCard.tsx`)
  - Shows "Just now", "Xm ago", "Xh ago" for recent workflows (<24h)
  - Falls back to absolute date for older workflows
  - Previous format: "Started Jul 14, 2026, 10:30 PM" → Now: "Started 5m ago"

- **`/api/queue/workflow` GET handler** (`app/api/queue/workflow/route.ts`)
  - Returns `405 Method Not Allowed` with clear error message for GET requests
  - Previously returned empty 200 body causing JSON parse errors

- **Agent Orchestrator System** (`.opencode/`)
  - Updated `opencode.json` with 6 agent definitions (planner, tdd-guide, code-reviewer, e2e-runner, build-resolver, security-reviewer)
  - Added permission rules for file-read, file-write, and command execution
  - Added context configuration linking to knowledge base files and memory graph
  - Created `.opencode/instructions/` knowledge base with 4 files:
    - `project-context.md` — Project overview, tech stack, current state
    - `lessons.md` — Compiled lessons from past sessions
    - `patterns.md` — 8 reusable code patterns with examples
    - `error-solutions.md` — 7 common errors with solutions
  - All 6 command files updated with **Outcome Capture** section for self-learning feedback loops

- **Architecture Decision Records** (`docs/adr/`)
  - `ADR-001-agent-orchestrator.md` — Agent orchestrator with self-learning loops
  - `ADR-002-e2e-fix-strategy.md` — E2E test failure resolution strategy
  - `ADR-003-orchestrator-knowledge-base.md` — Knowledge base architecture

- **PRD.md** — Enhanced with Section 8: Agent Orchestrator (vision, architecture, components, self-learning loop, token optimization, implementation phases)

- **Vercel Queues Integration**
  - Queue producer utilities (`app/lib/queue-producer.ts`)
  - Queue consumer route (`app/api/queue/workflow/route.ts`)
  - Daily cron handler (`app/api/cron/daily/route.ts`)
  - Queue monitoring page (`/queue`)
  - Multiple queue topics: workflows, scheduled-workflows, email-notifications, approvals
  - Automatic retries with exponential backoff
  - Idempotency support for message deduplication
  - Addresses Vercel free tier daily cron limitation

- **Playwright CLI Integration** (E2E Testing)
  - Installed `@playwright/cli` globally
  - Skills installed to `.claude/skills/playwright-cli`
  - Comprehensive E2E testing documentation in README.md
  - Commands: open, goto, click, type, screenshot, snapshot, console, network
  - Session management: list, close, delete-data
  - Headed mode and persistent profiles support

- **Database Configuration Scripts** (`scripts/`)
  - `test-db-config.js` - Test database configuration
  - `test-supabase-connection.js` - Test Supabase remote connection
  - `.env.local.example` - Template for local environment overrides
  - New npm scripts: `npm run db:config`, `npm run db:test-supabase`

- **Database Configuration** (`app/lib/database-config.ts`)
  - Environment-based database selection (local PostgreSQL vs Supabase)
  - `USE_REMOTE=true` to use Supabase
  - `USE_REMOTE=false` to use local PostgreSQL
  - `ENVIRONMENT=production` defaults to Supabase
  - `ENVIRONMENT=local` defaults to local PostgreSQL
  - `getDatabaseConfig()` returns provider, URL, and isRemote flag
  - `getEnvironmentInfo()` returns detailed environment information

- **Navbar** (`app/components/Navbar.tsx`)
  - Sticky navigation with page links
  - Active route highlighting
  - Responsive mobile menu
  - Links: Dashboard, Config, Cron, Monitor, Logs, Docs, About, Contact

- **About Page** (`/about`)
  - Project features overview
  - Technology stack display
  - Call-to-action sections

- **Contact Page** (`/contact`)
  - Contact form with validation
  - Contact information display
  - FAQ section

- **Workflow Scheduling System** (`/config`)
  - Schedule type selection: Immediate, Scheduled, Recurring
  - DateTime picker for scheduled workflows
  - Cron expression input with presets (every minute, hourly, daily, weekly, monthly)
  - Scheduled time preview
  - Real-time audit log display after scheduling

- **Scheduling API Endpoints** (`/api/schedules`, `/api/audit`)
  - `GET /api/schedules` - List scheduled workflows
  - `POST /api/schedules` - Create scheduled workflow
  - `DELETE /api/schedules/[id]` - Cancel scheduled workflow
  - `GET /api/audit` - Get audit logs

- **Scheduling Types** (`app/lib/scheduling.ts`)
  - ScheduledWorkflow interface with metadata
  - AuditEntry interface for tracking changes
  - CronConfig interface with presets
  - ScheduleType union: immediate, scheduled, recurring

- **Audit Logging** (`app/lib/audit-logging.ts`)
  - Log scheduling, enqueuing, completion, failure, cancellation
  - Track user context (userId, userAgent, ipAddress)
  - State change tracking (previousState, newState)

- **Workflow Scheduler** (`app/lib/scheduler.ts`)
  - In-memory scheduler with cron support
  - Schedule management (create, cancel, list, get)
  - Next run calculation for recurring workflows

- **Enhanced Observability Page** (`/observability`)
  - Three tabs: Overview, DBOS Inspect, Supabase
  - DBOS workflow inspect commands with copy-to-clipboard
  - Supabase integration instructions
  - Quick tips for workflow debugging

- **Supabase Integration**
  - Supabase client helpers (`app/utils/supabase/`)
  - Server, client, and middleware clients
  - Workflow execution storage (`app/lib/observability.ts`)
  - Required table schema for workflow_executions

- **Step-by-Step Workflow Configuration Wizard** (`/config`)
  - 4-step wizard: Select Workflow → Configure Parameters → Schedule → Review & Confirm
  - Visual step indicator with progress tracking
  - Breadcrumb navigation
  - Real-time validation
  - Preview button before submission

- **Confirmation Popup Component**
  - Modal dialog for final review
  - Shows workflow details, parameters, and schedule
  - Warning for recurring workflows
  - Loading state during submission

- **Wizard Navigation Component**
  - Step progress indicator with icons
  - Clickable completed steps
  - Current step highlighting
  - Responsive mobile design

- **Supabase Database Migration** (`supabase/migrations/`)
  - workflow_executions table
  - workflow_configs table
  - approvals table
  - audit_logs table
  - Indexes and RLS policies

- **Supabase Service Layer** (`app/lib/services.ts`)
  - Workflow execution CRUD operations
  - Approval management
  - Audit logging
  - Workflow config management
  - Stats aggregation

- **Observability Page** (`/observability`)
  - Workflow timeline with real-time updates
  - Worker status monitoring
  - Activity log with timestamps
  - Manual worker trigger
  - Statistics: total runs, success rate, error rate

- **Logs Page** (`/logs`)
  - Application logs viewer
  - HTTP request logs viewer
  - Database query logs viewer
  - Filtering by level, method, status
  - Search functionality
  - Auto-refresh option

- **HTTP Logging Middleware** (`app/lib/http-logging.ts`)
  - `HTTPLogger` class for storing HTTP logs
  - `withHTTPLogging()` wrapper for API routes
  - Tracks: method, path, status, duration, request/response bodies
  - Statistics: by method, by status code, avg duration, error rate

- **Database Logging Middleware** (`app/lib/db-logging.ts`)
  - `DatabaseLogger` class for storing DB logs
  - Query logging with SQL and parameters
  - Transaction logging
  - Slow query detection
  - Statistics: by operation, slow queries, avg duration

- **Logs API Endpoints** (`/api/logs`)
  - `GET /api/logs?type=application|http|database` - Get filtered logs
  - `DELETE /api/logs?type=all|application|http|database` - Clear logs

## [0.1.0] - 2026-03-25

### Added
- **OpenCode Agent Setup**
  - Agent configuration with 7 specialized agents
  - 6 agent commands (/plan, /tdd, /code-review, /security, /build-fix, /e2e)
  - Plugin hooks for format, typecheck, console-warn
  - 11 skills: tdd-workflow, security-review, coding-standards, workflow-patterns, dbos-integration, backend-patterns, frontend-patterns, api-design, eval-harness, verification-loop, e2e-testing

- **AI Workflows** (`app/lib/ai-workflow.ts`)
  - aiAnalysisWorkflow - Single content analysis
  - aiBatchAnalysisWorkflow - Batch processing
  - aiChainAnalysisWorkflow - Multi-step analysis
  - Sentiment analysis, summarization, categorization, entity extraction

- **Error Handling** (`app/lib/errors.ts`)
  - Custom error classes: WorkflowError, ValidationError, TimeoutError, RetryExhaustedError, CircuitBreakerError
  - withRetry, withTimeout utilities
  - CircuitBreaker and RateLimiter classes

- **Integration Tests**
  - tests/integration/workflow-integration.test.ts
  - tests/integration/api-integration.test.ts

- **AI Workflow Tests** (`tests/unit/ai-workflow.test.ts`)
  - 16 tests for AI analysis patterns

- **Error Handling Tests** (`tests/unit/errors.test.ts`)
  - 21 tests for error utilities

- **Swagger UI** (`/docs`)
  - Interactive API documentation
  - Embedded Swagger UI with OpenAPI spec

- **Documentation**
  - README.md updated with all features
  - AGENTS.md with mandatory file maintenance and code review rules

### Fixed
- WorkflowCard.test.tsx act() warning
- Swagger Petstore external link removed
- Testing library imports verified

## [0.0.1] - 2026-03-24

### Added
- Initial DBOS + Next.js project setup
- 6 workflow types (Example, Email, Data Processing, Onboarding, Scheduled Report, Webhook)
- Dashboard UI with real-time updates
- Status filtering and workflow details
- Workflow configuration page
- Cron monitoring page
- API documentation
- Observability dashboard
- Workflow chaining utilities
- Retry with exponential backoff
- Email templates system
- Centralized logging
- Vercel cron configuration
- 103 unit tests
