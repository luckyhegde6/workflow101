---
name: e2e-testing
description: Playwright E2E testing patterns, Page Object Model, configuration, CI/CD integration, and flaky test strategies.
origin: ECC
---

# E2E Testing Patterns

Comprehensive Playwright patterns for building stable, fast, and maintainable E2E test suites.

## When to Activate

- Creating E2E tests for critical user flows
- Setting up Playwright configuration
- Debugging flaky tests
- Setting up CI/CD integration

## Test File Organization

```
tests/
├── e2e/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── features/
│   │   └── workflow.spec.ts
│   └── playwright.config.ts
└── fixtures/
    └── auth.ts
```

## Page Object Model (POM)

```typescript
import { Page, Locator } from '@playwright/test'

export class WorkflowPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly workflowCards: Locator
  readonly createButton: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('[data-testid="search-input"]')
    this.workflowCards = page.locator('[data-testid="workflow-card"]')
    this.createButton = page.locator('[data-testid="create-btn"]')
  }

  async goto() {
    await this.page.goto('/workflows')
    await this.page.waitForLoadState('networkidle')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.page.waitForResponse(resp => resp.url().includes('/api/search'))
  }
}
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { WorkflowPage } from '../../pages/WorkflowPage'

test.describe('Workflow Dashboard', () => {
  let workflowPage: WorkflowPage

  test.beforeEach(async ({ page }) => {
    workflowPage = new WorkflowPage(page)
    await workflowPage.goto()
  })

  test('should display workflow list', async () => {
    const count = await workflowPage.workflowCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should search workflows', async ({ page }) => {
    await workflowPage.search('example')

    const count = await workflowPage.workflowCards.count()
    expect(count).toBeGreaterThan(0)
    await expect(workflowPage.workflowCards.first()).toContainText(/example/i)
  })
})
```

## Playwright Configuration

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

## Flaky Test Patterns

### Quarantine
```typescript
test('flaky: complex search', async ({ page }) => {
  test.fixme(true, 'Flaky - Issue #123')
  // test code...
})
```

### Common Causes & Fixes

**Race conditions:**
```typescript
// Bad: assumes element is ready
await page.click('[data-testid="button"]')

// Good: auto-wait locator
await page.locator('[data-testid="button"]').click()
```

**Network timing:**
```typescript
// Bad: arbitrary timeout
await page.waitForTimeout(5000)

// Good: wait for specific condition
await page.waitForResponse(resp => resp.url().includes('/api/data'))
```

## Artifact Management

### Screenshots
```typescript
await page.screenshot({ path: 'artifacts/after-action.png' })
await page.screenshot({ path: 'artifacts/full-page.png', fullPage: true })
```

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
        env:
          BASE_URL: ${{ vars.STAGING_URL }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

1. Use `data-testid` attributes for reliable selectors
2. Wait for actual conditions, not arbitrary timeouts
3. Use Page Object Model for maintainability
4. Handle loading states explicitly
5. Record videos/screenshots on failure
6. Keep tests independent (no shared state)
7. Use meaningful test names that describe what's tested
