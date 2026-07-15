---
description: GitHub helper for PR management, diff review, and code verification
agent: gh-helper
subtask: true
---

# GitHub Helper Command

Manage PR lifecycle, review diffs, verify generated code, and handle feature reviews.

## Instructions

### 1. PR Creation
- Analyze git status, log, and diff before creating PR
- Generate comprehensive PR summary with sections:
  - Summary, Changes, Testing, Screenshots
- Use `gh pr create` with full body
- Return the PR URL

### 2. Diff Review
- Read full diff of changes
- Check for:
  - Unintended changes
  - Missing error handling
  - Security issues
  - Hardcoded secrets
  - Guardrail compliance (see `.agents/rules/guardrails.md`)
- Verify tests pass before reviewing

### 3. Code Verification
- Check generated code for:
  - TypeScript compilation errors
  - Linting issues
  - Test coverage
  - Edge case handling
- Run `npm run build` and `npm test` before verification

### 4. Feature Review
- Verify feature matches requirements
- Check for edge cases
- Ensure error handling is complete
- Verify documentation is updated

### 5. PR Status & Management
- `gh pr view` - Check PR status
- `gh pr checkout` - Checkout PR branch
- `gh pr diff` - View PR changes
- `gh pr merge` - Merge approved PR (ask permission)

## Outcome Capture
- [ ] PR created/updated successfully
- [ ] Diff reviewed with no issues
- [ ] Code verified (build + tests pass)
- [ ] Feature matches requirements
