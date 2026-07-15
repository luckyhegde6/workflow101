# Reusable Code Patterns

## 1. DBOS Workflow Function
```typescript
export async function myWorkflow(input: string) {
  "use workflow";
  const result = await myStep(input);
  return result;
}
```

## 2. Step Function with Retry
```typescript
async function myStep(input: string) {
  "use step";
  return processData(input);
}
```

## 3. Vercel Route with waitUntil
```typescript
import { waitUntil } from '@vercel/functions';

export async function GET(request: Request) {
  waitUntil(processWorkflows());
  return new Response("Started", { status: 200 });
}
```

## 4. API Route Error Handling
```typescript
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Operation failed:', error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

## 5. Server Action Pattern
```typescript
'use server';

export async function myAction(input: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const result = await processData(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Action failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
```

## 6. E2E Page Object Model
```typescript
// tests/e2e/pages/MyPage.ts
import { Page, Locator } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly title: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.submitButton = page.locator('[data-testid="submit-button"]');
  }

  async goto() {
    await this.page.goto('/my-path');
    await this.page.waitForLoadState('domcontentloaded');
  }
}

// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { MyPage } from './pages/MyPage';

export const test = base.extend<{ myPage: MyPage }>({
  myPage: async ({ page }, use) => {
    await use(new MyPage(page));
  },
});

export { expect } from '@playwright/test';

// tests/e2e/my-test.spec.ts
import { test, expect } from './fixtures';

test('should work', async ({ myPage }) => {
  await myPage.goto();
  await expect(myPage.title).toBeVisible();
});
```

## 7. Dynamic Import (Client-Only Components)
```typescript
import dynamic from 'next/dynamic';

const ClientComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
);
```

## 8. Timeout Wrapper for Async Operations
```typescript
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage || `Timeout after ${ms}ms`)), ms)
    ),
  ]);
}
```

## 9. Handoff File Pattern
```yaml
---
handoff_version: "1.0"
session_id: "YYYYMMDD-session-NNN"
timestamp: "YYYY-MM-DDTHH:MM:SSZ"
source_agent: "agent-id"
target_agent: "*"
project: "workflow101"
context:
  branch: "main"
  last_commit: "abc123"
  tasks_completed: ["task1", "task2"]
  tasks_pending: ["task3"]
discoveries:
  - domain: "DBOS"
    finding: "launch() hangs without timeout"
    severity: "critical"
    action: "Wrap in 5s timeout"
errors:
  - error: "ERR_MODULE_NOT_FOUND"
    solution: "Dynamic import with ssr:false"
    frequency: 3
next_session:
  priority: ["Fix CI pipeline"]
  warnings: ["DBOS may hang on first load"]
tags: ["feature:auth", "fix:timeout"]
---
```

## 10. Session Lifecycle Pattern
```typescript
// Every session MUST follow:
// START → WORK → HANDOFF → END

// START:
// 1. Load .agents/AGENTS.md
// 2. Load guardrails/lifecycle/memory
// 3. Read latest handoff file
// 4. Understand project state

// WORK:
// 1. Execute tasks (TDD preferred)
// 2. Log discoveries to memory.md immediately
// 3. Run tests after each change

// HANDOFF:
// 1. Run pre-commit checks
// 2. Update CHANGELOG.md, TODOS.md
// 3. Create handoff file
// 4. Update memory.md

// END:
// 1. Verify build/tests pass
// 2. Create PR / commit
// 3. Done
```
