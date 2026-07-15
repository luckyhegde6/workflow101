<!-- BEGIN:agents-system -->
<!--
╔══════════════════════════════════════════════════════════════╗
║                   AGENTS.md (Root)                            ║
║  This file delegates to .agents/AGENTS.md                     ║
║  DO NOT duplicate rules here — reference .agents/ instead     ║
╚══════════════════════════════════════════════════════════════╝
-->
<!-- END:agents-system -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:core-principles -->
# Core Principles (from everything-claude-code)

1. **Agent-First** — Delegate to specialized agents for domain tasks
2. **Test-Driven** — Write tests before implementation, verify coverage
3. **Security-First** — Never compromise on security; validate all inputs
4. **Immutability** — Always create new objects, never mutate existing ones
5. **Plan Before Execute** — Plan complex features before writing code
6. **Continuous Learning** — Document patterns, extract lessons, avoid repetitions
<!-- END:core-principles -->

<!-- BEGIN:agents-handoff-system -->

---

# Agent Handoff & Self-Learning System

This project implements a **handoff file mechanism** for cross-session knowledge continuity, agent-agnostic configuration, and enforced self-learning loops.

## Architecture

```
AGENTS.md                         ← Entry point (this file)
├── .agents/AGENTS.md             ← Master agent config (all tools reference this)
│   ├── rules/guardrails.md       ← Universal guardrails (process, security, files)
│   ├── rules/lifecycle.md        ← Session lifecycle (start → handoff → end)
│   ├── rules/agents.yaml         ← 8 agent role definitions
│   ├── handoffs/HANDOFF_SCHEMA.md ← Handoff file format (YAML + Markdown)
│   ├── patterns/handoff-patterns.md ← 6 reusable handoff patterns
│   ├── templates/handoff-template.md ← Handoff file template
│   ├── scripts/create-handoff.cjs  ← Generate handoff file
│   ├── scripts/read-handoff.cjs    ← Read latest handoff
│   ├── scripts/validate-handoff.cjs ← Validate handoff format
│   └── memory.md                   ← Persistent cross-session memory
├── .opencode/instructions/       ← OpenCode-specific knowledge base
│   ├── project-context.md
│   ├── lessons.md
│   ├── patterns.md
│   └── error-solutions.md
└── CLAUDE.md                     ← Tool config (references .agents/AGENTS.md)
```

## Handoff File Mechanism

Every session produces a handoff file in `.agents/handoffs/YYYYMMDD-HHMMSS-<agent>-<label>.md`.

**Purpose**: Preserve session state, discoveries, errors, and next actions so the next session (or agent) can continue without context loss.

**Format**: Markdown with YAML frontmatter:
```yaml
---
handoff_version: "1.0"
session_id: "20260716-session-001"
source_agent: "opencode"
target_agent: "*"
discoveries:
  - domain: "DBOS"
    finding: "launch() hangs without timeout"
    severity: "critical"
    action: "Wrap in 5s timeout"
errors:
  - error: "ERR_MODULE_NOT_FOUND"
    solution: "Dynamic import with ssr:false"
next_session:
  priority: ["Fix CI pipeline"]
  warnings: ["DBOS may hang"]
---
# Session Handoff
...
```

**Lifecycle**:
1. **START**: Agent reads `.agents/AGENTS.md` → guardrails → memory → latest handoff
2. **WORK**: Execute tasks, log discoveries to memory.md immediately
3. **HANDOFF**: Create handoff file before session ends
4. **END**: Run pre-commit checks, update docs

**Commands**:
```bash
# Create a handoff file (interactive)
node .agents/scripts/create-handoff.cjs <session-label>

# Read the latest handoff
node .agents/scripts/read-handoff.cjs

# Validate the latest handoff
node .agents/scripts/validate-handoff.cjs
```

## Agent Roles (Tool-Agnostic)

| Role | Responsibility | Handoff Trigger |
|------|---------------|-----------------|
| `orchestrator` | Route tasks, manage handoffs, enforce lifecycle | Session end, task handover |
| `planner` | Break features into tasks, estimate effort | Plan completed |
| `developer` | Write TDD implementation code | Feature complete |
| `reviewer` | Code quality, DBOS patterns, security review | Review complete |
| `e2e-tester` | Playwright E2E tests, Page Object Models | Test suite done |
| `security` | Secret scanning, input validation, dependency audit | Audit complete |
| `build-fixer` | Fix TypeScript, module, build errors | Build fixed |
| `knowledge` | Maintain .agents/, memory, lessons, patterns | KB updated |

## Self-Learning Loop

Every session **MUST**:
1. Read the latest handoff on start
2. Log at least 1 discovery to `.agents/memory.md`
3. Create a handoff file before end
4. Update knowledge base if new patterns/errors discovered

## Guardrails (Summary)

For the full guardrails, see `.agents/rules/guardrails.md`. Key rules:
- **G1.1**: Pre-commit checklist mandatory before any commit
- **G1.2**: Session lifecycle must be followed
- **G1.3**: Test before implementation (TDD for fixes)
- **G2.1**: No hardcoded secrets
- **G3.1**: Immutability principle
- **G3.2**: Touch only what you must
- **G4.3**: Ask before DB migrations, env changes, package installs
- **G5.1**: Mandatory discovery logging each session

## Load Order

At session start, agents MUST load:
1. `.agents/AGENTS.md`
2. `.agents/rules/guardrails.md`
3. `.agents/rules/lifecycle.md`
4. `.agents/memory.md`
5. Latest `.agents/handoffs/*.md`
6. `.opencode/instructions/*.md`

---

<!-- END:agents-handoff-system -->

<!-- BEGIN:workflow101-project-rules -->

# Everything Workflow System - Agent Instructions

## Project Overview

Build an "everything workflows" system using:
- **useworkflow.dev** for workflow patterns
- **DBOS SDK** for durable execution
- **Vercel** for deployment and cron triggers

**Reference Sources:**
- https://useworkflow.dev/docs/foundations/workflows-and-steps
- https://github.com/dbos-inc/dbos-vercel-integration

## Critical Patterns

### Workflow Function
```typescript
export async function myWorkflow(input: string) {
  "use workflow";  // NOTE: Must be string literal, not template
  const result = await myStep(input);
  return result;
}
```

### Step Function
```typescript
async function myStep(input: string) {
  "use step";  // Full Node.js access, auto-retry
  return processData(input);
}
```

### Vercel Worker Route
```typescript
import { waitUntil } from '@vercel/functions';

export async function GET(request: Request) {
  waitUntil(processWorkflows());
  return new Response("Started");
}
```

## Key Constraints

1. **Workflows are sandboxed** - No full Node.js access in workflow functions
2. **Determinism required** - Same input = same output on replay
3. **Pass-by-value** - Parameters copied, mutations not visible
4. **Use `waitUntil`** - For async operations in Vercel route handlers
5. **Queue registration** - Must register queues before enqueueing

## Database Configuration

The system now uses **local PostgreSQL only** (Supabase project was deleted).

### Environment Variables
| Variable | Description |
|----------|-------------|
| `DBOS_SYSTEM_DATABASE_URL` | PostgreSQL connection string for DBOS |
| `POSTGRES_URL_NON_POOLING` | PostgreSQL connection string |
| `DATABASE_URL` | PostgreSQL connection string (fallback) |

### Connection Order
The system tries these variables in order:
1. `DBOS_SYSTEM_DATABASE_URL`
2. `POSTGRES_URL_NON_POOLING`
3. `DATABASE_URL`
4. Falls back to `postgresql://postgres:postgres@localhost:5432/workflow101`

### Database Layer
- **`app/lib/db.ts`** - PostgreSQL connection pool and query helpers
  - `query()` - Execute SQL, returns rows
  - `queryOne()` - Execute SQL, returns single row or null
  - `initializeDatabase()` - Creates tables/indexes on first use
- **`app/lib/services.ts`** - Business logic layer (insert/query workflow data)
- **`app/lib/observability.ts`** - Observability queries (dashboard data)
- **`app/lib/database-config.ts`** - Simplified config (always returns local)

### Running Locally
```bash
# Start PostgreSQL
npm run db:up

# Initialize DBOS tables
npm run dbos:init

# Start dev server
npm run dev

# Or all at once:
npm run local
```

<!-- END:workflow101-project-rules -->

<!-- BEGIN:file-maintenance -->

## File Maintenance Protocol (MANDATORY)

| File | Purpose | When to Update |
|------|---------|----------------|
| `README.md` | Project documentation, setup, features | After any feature/change |
| `AGENTS.md` | Agent instructions and rules | After session end |
| `.agents/AGENTS.md` | Master agent config | After significant architecture changes |
| `.agents/rules/guardrails.md` | Universal guardrails | When new guardrails needed |
| `.agents/rules/lifecycle.md` | Session lifecycle | When lifecycle changes |
| `.agents/memory.md` | Persistent cross-session memory | Every session |
| `.agents/handoffs/` | Session handoff files | Every session end |
| `primer.md` | Session context (start/end) | Every session |
| `agent-memory.md` | Persistent project context | After significant changes |
| `TODOS.md` | Task tracking with progress | After completing tasks |
| `LESSONS.md` | Agent optimization, avoid hallucinations | After bugfixes/mistakes |
| `CHANGELOG.md` | Implementation log | After every feature/bugfix |

## Mandatory Update Rules

### During Session
- [ ] Update relevant files when completing features
- [ ] Document new patterns in appropriate skill files
- [ ] Update TODOS.md with completed items
- [ ] Log significant discoveries in `.agents/memory.md`
- [ ] Log discoveries immediately, not batched at end

### Session End (Before Commit)
1. **Create handoff file**: `node .agents/scripts/create-handoff.cjs <label>`
2. **Update CHANGELOG.md** - Log all changes made
3. **Update TODOS.md** - Mark completed tasks
4. **Update README.md** - Document new features/changes
5. **Update AGENTS.md** - Add new patterns/rules learned
6. **Update .agents/memory.md** - Add session discoveries
7. **Run verification** - Ensure build passes, tests pass
8. **Review code changes** - Check for issues before commit

### Pre-Commit Checklist
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No hardcoded secrets
- [ ] Security check passes: `npm run security:check`
- [ ] Handoff file created/updated
- [ ] README.md reflects current state
- [ ] CHANGELOG.md updated
- [ ] TODOS.md marked complete
- [ ] `.agents/memory.md` updated

<!-- END:file-maintenance -->

<!-- BEGIN:code-review -->

## Code Review Protocol (MANDATORY)

### Before Every Commit
1. **Review changed files** - Check for:
   - Unintended changes
   - Missing error handling
   - Potential edge cases
   - Security issues
   - Guardrail violations (see `.agents/rules/guardrails.md`)

2. **Review tests** - Ensure:
   - New functionality has tests
   - Tests cover edge cases
   - No skipped/disabled tests without reason

3. **Run E2E tests** - Playwright tests:
   ```bash
   npm run test:e2e
   ```

### Review Output Format
```
## Code Review

Files Changed: X
Tests Added: X
Issues Found: X

### Issues
1. [Severity] - Description

### Guardrail Check
[ ] All guardrails satisfied (see .agents/rules/guardrails.md)

### Approval
[ ] Approved
[ ] Changes Requested
```

<!-- END:code-review -->

<!-- BEGIN:security-guidelines -->

## Security Guidelines (MANDATORY)

### Pre-Commit Security Check (MANDATORY)
```bash
# Run security check before any commit
npm run security:check

# Install as pre-commit hook (one-time)
npm run security:install-hooks
```

### Before ANY Commit - Security Checklist
- [ ] `npm run security:check` passes
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] CSRF protection enabled
- [ ] Authentication/authorization verified
- [ ] Rate limiting on all endpoints
- [ ] Error messages don't leak sensitive data

### Secret Management Rules
1. **NEVER commit secrets** - Use environment variables only
2. **Use `process.env`** - All secrets must be read from `process.env`
3. **.env files are gitignored** - Real credentials go in `.env.local`
4. **Use templates** - `.env.example` and `.env.local.example` for structure
5. **Rotate secrets** - If leaked, rotate immediately
6. **Least privilege** - Use minimum required permissions

### Allowed Secret Patterns
```typescript
// ✅ Good - read from environment
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;
const connectionString = process.env.DATABASE_URL;

// ❌ Bad - hardcoded secrets
const apiKey = "sk_live_xxxxx";
const dbPassword = "mysecretpassword";
const connectionString = "postgresql://user:password@host/db";
```

### Environment Files
| File | Committed | Contents |
|------|-----------|----------|
| `.env` | ✅ Yes | Non-secret defaults, structure |
| `.env.local` | ❌ NO | Real secrets (auto-gitignored) |
| `.env.production` | ✅ Yes | Production non-secrets |
| `.env.production.local` | ❌ NO | Production secrets |

**Secret management:** NEVER hardcode secrets. Use environment variables.

<!-- END:security-guidelines -->

<!-- BEGIN:coding-standards -->

## Coding Standards

### Immutability (CRITICAL)
Always create new objects, never mutate. Return new copies with changes applied.

### File Organization
- Many small files over few large ones
- 200-400 lines typical, 800 max
- Organize by feature/domain, not by type
- High cohesion, low coupling

### Error Handling
Handle errors at every level. Provide user-friendly messages in UI code. Log detailed context server-side. Never silently swallow errors.

### Input Validation
Validate all user input at system boundaries. Use schema-based validation. Fail fast with clear messages. Never trust external data.

<!-- END:coding-standards -->

<!-- BEGIN:git-workflow -->

## Git Workflow

**Commit format:** `<type>: <description>`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

**PR workflow:** Analyze full commit history → draft comprehensive summary → include test plan → push with `-u` flag.

<!-- END:git-workflow -->

## Environment Variables

### Database Configuration
| Variable | Description |
|----------|-------------|
| `ENVIRONMENT` | `local` \| `production` \| `development` |
| `USE_REMOTE` | `true` \| `false` (overrides ENVIRONMENT) |
| `DBOS_SYSTEM_DATABASE_URL` | PostgreSQL connection string for DBOS |
| `POSTGRES_URL_NON_POOLING` | PostgreSQL connection string |
| `DATABASE_URL` | PostgreSQL connection string (fallback) |

### Supabase (REMOVED - Project Deleted)
Supabase project `vclwajxnqslrwkwkhwrw` was deleted (was in paused/unresumable state).  
All Supabase dependencies and utilities have been removed from the project.  
System now uses **local PostgreSQL only**.

### Decision Logic
- `USE_REMOTE=false` (or not set) → Use local PostgreSQL
- All configurations now return local PostgreSQL

## Node_modules Corruption Recovery

If `node_modules/` is corrupted (0-byte files, missing subpaths, "Invalid Version" errors):

1. **Identify corrupted packages**: `npm ls <package>` shows `invalid` status
2. **Don't delete node_modules** - On Windows, `rmdir /s /q node_modules` can hang due to antivirus
3. **Use temp directory installs**:
   ```bash
   cd /d "%TEMP%"
   mkdir fix-pkg && cd fix-pkg
   npm init -y >nul 2>&1
   npm install <corrupted-package>
   xcopy /E /I /Y "%TEMP%\fix-pkg\node_modules\<pkg>\*" ".\node_modules\<pkg>\"
   ```
4. **Delete corrupted `package-lock.json`** if npm install fails with "Invalid Version":
   ```bash
   del package-lock.json
   npm install --legacy-peer-deps
   ```
5. **Check for 0-byte files**: `for /r "node_modules" %i in (*.js) do if %~zi equ 0 echo %i`

## Important Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `vercel` | Deploy to Vercel |

### Handoff Commands
```bash
# Create a handoff file
node .agents/scripts/create-handoff.cjs <session-label>

# Read the latest handoff
node .agents/scripts/read-handoff.cjs

# Validate all handoff files
node .agents/scripts/validate-handoff.cjs --all
```

### DBOS Commands
```bash
# Inspect workflows on Vercel
npx workflow inspect runs --backend vercel

# Launch Web UI for visual exploration
npx workflow inspect runs --web

# List workflow runs
npx workflow inspect runs --limit 50

# Filter by workflow name
npx workflow inspect runs --workflow exampleWorkflow

# Get workflow status
npx workflow inspect status <workflow-id>

# View workflow logs
npx workflow inspect logs <workflow-id>
```

## Self-Learning & Handoff System

The project includes a comprehensive self-learning loop with handoff files:

### Handoff File Mechanism
- **Location**: `.agents/handoffs/YYYYMMDD-HHMMSS-<agent>-<label>.md`
- **Format**: Markdown with YAML frontmatter (machine-parseable)
- **Content**: Session context, discoveries, errors, next actions

### Agent Definitions
8 agent roles defined in `.agents/rules/agents.yaml`:
- orchestrator, planner, developer, reviewer, e2e-tester, security, build-fixer, knowledge

### Guardrails
21 guardrails across 5 categories in `.agents/rules/guardrails.md`:
- Process (4), Security (6), File Modification (5), Agent Behavior (4), Self-Learning (3)

### Session Lifecycle
Defined in `.agents/rules/lifecycle.md`:
- START → WORK → HANDOFF → END

### Memory
`.agents/memory.md` — append-only persistent cross-session memory

## OpenCode Agent Orchestrator

The project uses an OpenCode-based agent orchestrator with self-learning feedback loops.

### Agent Registry (opencode.json)

| Agent ID | Command | Capabilities | Max Tokens |
|----------|---------|--------------|------------|
| `planner` | plan | read, search, think | 4000 |
| `tdd-guide` | tdd | read, write, test | 6000 |
| `code-reviewer` | code-review | read, search, think | 4000 |
| `e2e-runner` | e2e | read, test, browser | 4000 |
| `build-resolver` | build-fix | read, write, test | 6000 |
| `security-reviewer` | security | read, search, think | 4000 |

### Knowledge Base (`.opencode/instructions/`)

| File | Purpose |
|------|---------|
| `project-context.md` | Project overview, tech stack, current state |
| `lessons.md` | Compiled lessons from past sessions |
| `patterns.md` | Reusable code patterns with examples |
| `error-solutions.md` | Common errors with proven solutions |

### Self-Learning Loop

All commands have an **Outcome Capture** section that logs:
1. Success criteria met
2. What went well / wrong
3. New patterns discovered
4. Errors encountered and solutions
5. Knowledge base updates needed

### Permissions

- **File read**: Full project access
- **File write**: `app/`, `tests/`, `.agents/`, `.opencode/`, `docs/` directories only
- **Commands**: npm, npx, git, node

### Architecture Decisions

See `docs/adr/` for full decision records:
- `ADR-001-agent-orchestrator.md` — Agent orchestrator with self-learning loops
- `ADR-002-e2e-fix-strategy.md` — E2E test failure resolution strategy
- `ADR-003-orchestrator-knowledge-base.md` — Knowledge base architecture

## OpenCode Agent Commands

| Command | Purpose |
|---------|---------|
| `/plan <feature>` | Create implementation plan |
| `/tdd <feature>` | Test-driven development |
| `/code-review` | Review code changes |
| `/security` | Security review |
| `/build-fix` | Fix build errors |
| `/e2e` | Run E2E tests |

## Success Metrics

- All workflows execute correctly
- Code is readable and maintainable
- Performance is acceptable
- User requirements are met
- No security vulnerabilities
- 80%+ test coverage
- E2E tests passing
- Handoff files present for every session
- Knowledge base updated with each session's discoveries
