# Workflow Patterns Skill

## Overview

This skill documents workflow patterns following useworkflow.dev best practices for DBOS SDK.

## Core Patterns

### 1. Basic Workflow

```typescript
export async function simpleWorkflow(input: string) {
  "use workflow";
  const result = await processStep(input);
  return result;
}

async function processStep(input: string) {
  "use step";
  return { processed: input.toUpperCase() };
}
```

### 2. Multi-Step Workflow

```typescript
export async function onboardingWorkflow(user: User) {
  "use workflow";
  
  const account = await createAccountStep(user);
  const profile = await setupProfileStep(account);
  const welcome = await sendWelcomeStep(profile);
  
  return { account, profile, welcome };
}
```

### 3. Conditional Workflow

```typescript
export async function approvalWorkflow(request: Request) {
  "use workflow";
  
  const validation = await validateStep(request);
  
  if (validation.needsReview) {
    return { status: 'pending', request };
  }
  
  return { status: 'approved', request };
}
```

### 4. Parallel Execution

```typescript
export async function batchWorkflow(ids: string[]) {
  "use workflow";
  
  const promises = ids.map(id => processItemStep(id));
  const results = await Promise.all(promises);
  
  return { processed: results.length };
}
```

### 5. Error Handling

```typescript
export async function robustWorkflow(input: Data) {
  "use workflow";
  
  try {
    return await riskyStep(input);
  } catch (error) {
    return await fallbackStep(input);
  }
}
```

## Key Directives

| Directive | Purpose | Location |
|-----------|---------|----------|
| `"use workflow"` | Marks function as workflow | Top of function |
| `"use step"` | Marks function as step | Top of async function |

## Important Rules

1. **Workflows are sandboxed** - No Node.js APIs directly
2. **Determinism required** - Same input = same output
3. **Pass-by-value** - Parameters copied
4. **Use `waitUntil`** - For async in Vercel handlers

## Vercel Integration

```typescript
import { waitUntil } from '@vercel/functions';

export async function GET(request: Request) {
  waitUntil(processWorkflows());
  return new Response("Started");
}
```

## Cron Configuration

```json
{
  "crons": [{
    "path": "/api/dbos",
    "schedule": "* * * * *"
  }]
}
```

## Testing Workflows

```typescript
describe('workflow patterns', () => {
  it('handles multi-step execution', async () => {
    const result = await multiStepWorkflow({ steps: 3 });
    expect(result.completed).toBe(3);
  });

  it('retries on transient failures', async () => {
    // Test retry logic
  });
});
```
