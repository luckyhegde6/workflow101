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
