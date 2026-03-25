# DBOS Integration Skill

## Overview

This skill covers DBOS SDK integration with Next.js and Vercel deployment.

## DBOS SDK Basics

### Installation

```bash
npm install @dbos-inc/dbos-sdk
```

### Environment Variables

```bash
DBOS_SYSTEM_DATABASE_URL=postgresql://user:pass@host:5432/db
```

## Workflow Implementation

### Workflow Function Pattern

```typescript
export async function myWorkflow(input: MyInput) {
  "use workflow";  // Required directive
  
  const validated = await validateStep(input);
  const processed = await processStep(validated);
  
  return processed;
}
```

### Step Function Pattern

```typescript
async function myStep(input: MyInput) {
  "use step";  // Required directive
  
  // Full Node.js access available
  // Auto-retry on failure
  return processData(input);
}
```

## Server Actions

```typescript
'use server';

import { DBOSClient } from '@dbos-inc/dbos-sdk';

export async function enqueueWorkflow(input: WorkflowInput) {
  const client = new DBOSClient();
  await client.enqueue('myWorkflow', input);
}
```

## API Routes

### Vercel Worker Route

```typescript
import { waitUntil } from '@vercel/functions';
import { processWorkflows } from '@/app/lib/worker';

export async function GET(request: Request) {
  waitUntil(processWorkflows());
  return new Response('Processing workflows');
}
```

## Database Operations

### PostgreSQL with DBOS

```typescript
import { DBOSWorkflowContext } from '@dbos-inc/dbos-sdk';

async function databaseStep(ctx: DBOSWorkflowContext) {
  await ctx.query(
    'INSERT INTO workflows (name, status) VALUES ($1, $2)',
    ['example', 'pending']
  );
}
```

## Vercel Deployment

### vercel.json Configuration

```json
{
  "crons": [{
    "path": "/api/dbos",
    "schedule": "* * * * *"
  }]
}
```

### Build Configuration

```javascript
// next.config.js
const { withWorkflow } = require('@dbos-inc/dbos-vercel');

module.exports = withWorkflow({
  // Next.js config
});
```

## Testing

### Mock DBOS in Tests

```typescript
vi.mock('@dbos-inc/dbos-sdk', () => ({
  DBOS: {
    workflow: () => (target) => target,
    step: () => (target) => target,
  },
}));
```

## Error Handling

### Retry Configuration

```typescript
async function resilientStep(input: Data) {
  "use step";
  
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await callAPI(input);
    } catch (error) {
      lastError = error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  throw lastError;
}
```

## Monitoring

### Workflow Status

```typescript
import { DBOSClient } from '@dbos-inc/dbos-sdk';

const client = new DBOSClient();
const workflows = await client.getWorkflows({ status: 'COMPLETED' });
```

## Best Practices

1. Keep workflows small and focused
2. Use steps for complex logic
3. Handle errors gracefully
4. Log for debugging
5. Test with mocks
6. Monitor in production
