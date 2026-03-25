---
description: Run E2E tests for workflow pages
agent: e2e-runner
subtask: true
---

# E2E Test Command

Run E2E tests for: $ARGUMENTS

## Test Scope

### Dashboard Tests
- [ ] Dashboard loads correctly
- [ ] Workflow list displays
- [ ] Navigation works

### Workflow Tests
- [ ] Individual workflow pages
- [ ] Configuration forms
- [ ] Status displays

### API Documentation
- [ ] Docs page loads
- [ ] Swagger UI works
- [ ] Try it out functions

## Running Tests

```bash
# All E2E tests
npm run test:e2e

# Specific test
npm run test:e2e -- tests/e2e/dashboard.spec.ts

# With UI
npm run test:e2e -- --ui

# Debug mode
npm run test:e2e -- --debug
```

## Test Reliability

### Best Practices
- Use `data-testid` attributes
- Wait for actual conditions
- Avoid `waitForTimeout`
- Handle loading states

### Common Issues
- Race conditions → Use proper waits
- Flaky selectors → Use stable selectors
- Timeouts → Increase timeout values
