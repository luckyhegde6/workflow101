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

The system supports both local PostgreSQL (Docker) and Supabase remote database:

### Environment Variables
| Variable | Description |
|----------|-------------|
| `ENVIRONMENT` | `local` \| `production` \| `development` |
| `USE_REMOTE` | `true` \| `false` (overrides ENVIRONMENT) |

### Decision Logic
1. `USE_REMOTE=true` → Use Supabase (remote)
2. `USE_REMOTE=false` → Use local PostgreSQL
3. `ENVIRONMENT=production` → Use Supabase (unless `USE_REMOTE=false`)
4. `ENVIRONMENT=local` → Use local PostgreSQL (unless `USE_REMOTE=true`)

### Usage
```typescript
import { getDatabaseConfig, getEnvironmentInfo } from './lib/database-config';

const dbConfig = getDatabaseConfig();
console.log(`Using ${dbConfig.provider} database: ${dbConfig.isRemote ? 'remote' : 'local'}`);

const info = getEnvironmentInfo();
console.log(`Reason: ${info.reason}`);
```

### Files
- `app/lib/database-config.ts` - Database configuration module
- `.env` - Environment variable definitions

<!-- END:workflow101-project-rules -->

<!-- BEGIN:file-maintenance -->

## File Maintenance Protocol (MANDATORY)

| File | Purpose | When to Update |
|------|---------|----------------|
| `README.md` | Project documentation, setup, features | After any feature/change |
| `AGENTS.md` | Agent instructions and rules | After session end |
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
- [ ] Log significant discoveries in LESSONS.md

### Session End (Before Commit)
1. **Update CHANGELOG.md** - Log all changes made
2. **Update TODOS.md** - Mark completed tasks
3. **Update README.md** - Document new features/changes
4. **Update AGENTS.md** - Add new patterns/rules learned
5. **Run verification** - Ensure build passes, tests pass
6. **Review code changes** - Check for issues before commit

### Pre-Commit Checklist
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No hardcoded secrets
- [ ] README.md reflects current state
- [ ] CHANGELOG.md updated
- [ ] TODOS.md marked complete

<!-- END:file-maintenance -->

<!-- BEGIN:code-review -->

## Code Review Protocol (MANDATORY)

### Before Every Commit
1. **Review changed files** - Check for:
   - Unintended changes
   - Missing error handling
   - Potential edge cases
   - Security issues

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

### Approval
[ ] Approved
[ ] Changes Requested
```

<!-- END:code-review -->

<!-- BEGIN:security-guidelines -->

## Security Guidelines (MANDATORY)

**Before ANY commit:**
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Authentication/authorization verified
- Rate limiting on all endpoints
- Error messages don't leak sensitive data

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

### Database (DBOS)
- `POSTGRES_URL_NON_POOLING` - PostgreSQL connection string for DBOS
- `DBOS_SYSTEM_DATABASE_URL` - DBOS system database URL

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase publishable key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

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

### Supabase CLI
```bash
# Link to Supabase project
npx supabase link --project-ref vclwajxnqslrwkwkhwrw

# Push local migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --project-id vclwajxnqslrwkwkhwrw > types/supabase.ts
```

## Supabase Integration

### Files Structure
```
app/utils/supabase/
├── client.ts      # Browser client (createBrowserClient)
├── server.ts      # Server client (createServerClient)
├── middleware.ts   # Middleware client
└── index.ts       # Exports
```

### Usage
```typescript
// Server Component
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();

// Client Component
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
```

### Required Table
```sql
CREATE TABLE workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  retry_count INT DEFAULT 0
);
```

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
