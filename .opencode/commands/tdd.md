---
description: TDD workflow for DBOS workflows and Next.js
agent: tdd-guide
subtask: true
---

# TDD Command

Implement using strict test-driven development: $ARGUMENTS

## TDD Cycle (MANDATORY)

```
RED → GREEN → REFACTOR → REPEAT
```

1. **RED**: Write a failing test FIRST
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve while keeping tests green
4. **REPEAT**: Continue until complete

## TDD for Workflows

### Step 1: Define Interface
```typescript
// Define the workflow interface
export interface MyWorkflowInput {
  data: string;
}
```

### Step 2: Write Failing Test
```typescript
import { describe, it, expect } from 'vitest';
import { myWorkflow } from '@/app/lib/workflows';

describe('myWorkflow', () => {
  it('processes data correctly', async () => {
    const result = await myWorkflow({ data: 'test' });
    expect(result.success).toBe(true);
  });
});
```

### Step 3: Run Test (FAIL)
```bash
npm test -- --grep "myWorkflow"
```

### Step 4: Write Minimal Code
```typescript
export async function myWorkflow(input: MyWorkflowInput) {
  "use workflow";
  const result = await processStep(input.data);
  return { success: true, result };
}

async function processStep(data: string) {
  "use step";
  return data.toUpperCase();
}
```

### Step 5: Run Test (PASS)

### Step 6: Refactor
- Improve naming
- Add error handling
- Extract constants

### Step 7: Verify Coverage
```bash
npm test -- --coverage
# Target: 80%+ coverage
```

## Coverage Requirements

| Type | Minimum |
|------|---------|
| Workflow functions | 90% |
| Utilities | 80% |
| Components | 70% |
| API routes | 80% |

## Test File Locations
- Unit: `tests/unit/`
- Integration: `tests/integration/`
- E2E: `tests/e2e/`
