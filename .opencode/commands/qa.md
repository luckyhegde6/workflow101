---
description: QA agent for full flow validation, E2E testing, and acceptance criteria verification
agent: qa
subtask: true
---

# QA Command

End-to-end quality assurance with Playwright, flow validation, and acceptance criteria verification.

## Instructions

### 1. Full Flow Validation
- Define the complete user journey for the feature
- Test each step of the flow end-to-end:
  1. Navigate to entry point
  2. Complete action 1
  3. Verify intermediate state
  4. Complete action 2
  5. Verify final state
- Check error flows:
  - Invalid input
  - Network failure
  - Permission denied
  - Timeout scenarios

### 2. Acceptance Criteria Verification
- Read the feature requirements or PR description
- Create a checklist from acceptance criteria
- Verify each criterion with E2E tests
- Document which criteria pass/fail

### 3. Playwright E2E Suite
- Run complete E2E suite: `npm run test:e2e`
- Run in headed mode for visual: `npm run test:e2e:ui`
- Run with specific browser: `npx playwright test --project=chromium`
- Check for:
  - Console errors during tests
  - Network request failures
  - Visual regression
  - Responsive layout (mobile, tablet, desktop)

### 4. Cross-Browser Testing
- Run tests on Chromium
- Run tests on Firefox (if available)
- Run tests on WebKit (if available)
- Report browser-specific failures

### 5. Regression Check
- Run full test suite: `npm test`
- Check that existing features still work
- Verify no visual regressions in UI components
- Check that API contracts remain unchanged

### 6. Quality Report
- Summary of test results
- List of bugs/issues found
- Screenshots of failures
- Performance metrics
- Recommendation: Approve / Changes Requested

## Outcome Capture
- [ ] Full user flow validated end-to-end
- [ ] All acceptance criteria met
- [ ] E2E tests pass on Chromium
- [ ] Cross-browser compatibility verified
- [ ] No regressions in existing features
- [ ] Quality report generated
