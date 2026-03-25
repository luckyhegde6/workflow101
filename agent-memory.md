# Agent Memory

Persistent context for the workflow101 project.

## Project Context

**Type**: Learning/Development - Workflow System with DBOS + Vercel  
**User**: Building comprehensive "everything workflows" system  
**Pattern**: Run after each execution to update context

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Workflow Engine**: @dbos-inc/dbos-sdk v4.5.13
- **Deployment**: Vercel (with cron for worker)
- **Database**: PostgreSQL (via POSTGRES_URL_NON_POOLING)
- **Runtime**: @vercel/functions v3.3.4

## User Requirements

### Workflow Types (ALL)
1. Email/SMS notifications - scheduled reminders, alerts
2. Data processing pipelines - batch processing, ETL
3. User onboarding flows - welcome emails, setup wizards
4. Scheduled/Cron jobs - daily reports, cleanup
5. API webhook handlers - external events, integrations

### Features (ALL)
1. Workflow status dashboard - real-time tracking
2. Manual workflow triggers - on-demand execution
3. Workflow scheduling - cron-based timing
4. Retry/error handling - automatic retries with backoff
5. Workflow chaining - sequential/parallel workflows

## Reference Implementations

| Source | URL | Key Learning |
|--------|-----|-------------|
| useworkflow.dev docs | https://useworkflow.dev/docs/foundations/workflows-and-steps | Workflow/Step directives, deterministic replay |
| dbos-vercel-integration | https://github.com/dbos-inc/dbos-vercel-integration | Complete working example on Vercel |
| everything-claude-code | https://github.com/affaan-m/everything-claude-code | Best practices, agent workflows, file maintenance |

## Workflow Patterns

```typescript
// Workflow function (orchestrator)
export async function myWorkflow(input: string) {
  "use workflow";
  const result = await myStep(input);
  return result;
}

// Step function (worker)
async function myStep(input: string) {
  "use step";
  return doWork(input);
}
```

## Key Patterns to Remember

1. **Determinism**: Workflows must produce same result on replay
2. **Pass-by-value**: Parameters copied, not referenced
3. **Suspension**: Workflows can sleep/wait without consuming resources
4. **Queue system**: DBOS uses named queues for workflow ordering
5. **Cron triggering**: Vercel cron hits API route which processes queue

## File Maintenance Rules

| File | When to Update |
|------|-----------------|
| `AGENTS.md` | After every implementation/bugfix |
| `TODOS.md` | After completing tasks |
| `LESSONS.md` | After bugfixes or mistakes |
| `primer.md` | Session start/end |
| `agent-memory.md` | After significant changes |
| `CHANGELOG.md` | After every feature/bugfix |
| `PRD.md` | On feature request |

## Implementation Phases

1. **Phase 1: Foundation** - DBOS setup, worker route, Postgres
2. **Phase 2: Core Workflows** - All 5 workflow types
3. **Phase 3: Dashboard** - UI with status, enqueue, refresh
4. **Phase 4: Advanced** - Chaining, custom retries, webhooks
5. **Phase 5: Polish** - Logging, monitoring, docs

## Common Patterns

### Enqueue workflow from server action:
```typescript
const client = await DBOSClient.create({ systemDatabaseUrl });
await client.enqueue({ workflowName: 'exampleWorkflow', queueName: 'exampleQueue' });
```

### Register workflow:
```typescript
DBOS.registerWorkflow(exampleFunction, { name: 'exampleWorkflow' });
```

### Worker with waitUntil (Vercel):
```typescript
import { waitUntil } from '@vercel/functions';
waitUntil(processQueueTask());
return Response("Started");
```

## Last Updated
2026-03-24
