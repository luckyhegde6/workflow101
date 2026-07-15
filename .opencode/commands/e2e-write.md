---
description: E2E test writer using Playwright with Page Object Models
agent: e2e-agent
subtask: true
---

# E2E Test Writer Command

Write and maintain Playwright E2E tests with Page Object Models.

## Instructions

### 1. Analyze the Feature
- Understand the feature/page to test
- Read existing Page Object Models in `tests/e2e/pages/`
- Check existing test patterns in `tests/e2e/`

### 2. Create/Update Page Object Model
- Follow the existing POM pattern in `tests/e2e/pages/`
- Use `data-testid` selectors (NOT text-based selectors)
- Include:
  - Constructor with `page: Page`
  - Locators for key elements
  - Action methods (goto, click, fill, etc.)
  - Assertion helpers (isVisible, getText, etc.)

### 3. Write Test Specs
- Cover:
  - Happy path (success scenario)
  - Error states (validation, empty data, server errors)
  - Edge cases (loading states, empty states)
  - Responsive behavior (mobile/tablet viewports)
- Use `test.describe` for grouping
- Use `test.beforeEach` for setup

### 4. Run Tests
- Run specific test: `npx playwright test tests/e2e/my-test.spec.ts`
- Run all E2E: `npm run test:e2e`
- Check for flakiness (run 3x to verify stability)
- Capture screenshots on failure

### 5. Diagnostics
- If tests fail:
  - Check Playwright trace: `npx playwright show-trace`
  - Check console errors
  - Verify selectors match current DOM
  - Check for async timing issues

## Outcome Capture
- [ ] Page Object Model created/updated
- [ ] Test specs cover happy + error paths
- [ ] All E2E tests pass (3 consecutive runs)
- [ ] No flaky tests identified
- [ ] Screenshots captured for visual reference
