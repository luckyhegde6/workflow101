---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 80%+ coverage including unit, integration, and E2E tests.
origin: ECC
---

# Test-Driven Development Workflow

This skill ensures all code development follows TDD principles with comprehensive test coverage.

## When to Activate

- Writing new features or functionality
- Fixing bugs or issues
- Refactoring existing code
- Adding API endpoints
- Creating new components

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- Minimum 80% coverage (unit + integration + E2E)
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

### 3. Test Types

#### Unit Tests
- Individual functions and utilities
- Component logic
- Pure functions
- Helpers and utilities

#### Integration Tests
- API endpoints
- Database operations
- Service interactions
- External API calls

#### E2E Tests (Playwright)
- Critical user flows
- Complete workflows
- Browser automation
- UI interactions

## TDD Workflow Steps

### Step 1: Write User Journeys
```
As a [role], I want to [action], so that [benefit]
```

### Step 2: Generate Test Cases
```typescript
describe('Feature Name', () => {
  it('returns expected result for valid input', async () => { })
  it('handles empty input gracefully', async () => { })
  it('throws error for invalid input', async () => { })
})
```

### Step 3: Run Tests (They Should Fail)
```bash
npm test
# Tests should fail - we haven't implemented yet
```

### Step 4: Implement Code
Write minimal code to make tests pass.

### Step 5: Run Tests Again
```bash
npm test
# Tests should now pass
```

### Step 6: Refactor
Improve code quality while keeping tests green.

### Step 7: Verify Coverage
```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## Testing Patterns

### Unit Test Pattern (Vitest)
```typescript
import { describe, it, expect } from 'vitest';

describe('Function Name', () => {
  it('should process input correctly', () => {
    expect(processFn('input')).toBe('expected');
  });
});
```

### API Integration Test Pattern
```typescript
describe('GET /api/resource', () => {
  it('returns data successfully', async () => {
    const response = await fetch('/api/resource');
    expect(response.status).toBe(200);
  });
});
```

### E2E Test Pattern (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('button:has-text("Submit")');
  await expect(page.locator('.success')).toBeVisible();
});
```

## Test File Organization
```
tests/
├── unit/
│   └── *.test.ts
├── integration/
│   └── *.test.ts
└── e2e/
    └── *.spec.ts
```

## Common Testing Mistakes

### WRONG: Testing Implementation Details
```typescript
expect(component.state.count).toBe(5)
```

### CORRECT: Test User-Visible Behavior
```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

## Best Practices

1. **Write Tests First** - Always TDD
2. **One Assert Per Test** - Focus on single behavior
3. **Descriptive Test Names** - Explain what's tested
4. **Arrange-Act-Assert** - Clear test structure
5. **Mock External Dependencies** - Isolate unit tests
6. **Test Edge Cases** - Null, undefined, empty, large
7. **Test Error Paths** - Not just happy paths
8. **Keep Tests Fast** - Unit tests < 50ms each

**Remember**: Tests are not optional. They are the safety net that enables confident refactoring, rapid development, and production reliability.
