---
description: Bug diagnosis and fixing agent with TDD workflow
agent: bug-fixer
subtask: true
---

# Bug Fix Command

Diagnose and fix bugs using test-driven development.

## Instructions

### 1. Reproduce the Bug
- Understand the bug report or symptom
- Create a minimal reproduction if possible
- Document the exact error/behavior

### 2. Root Cause Analysis
- Trace the issue through the codebase
- Identify the root cause file and line
- Check if this is a regression (git bisect if needed)
- Check for similar patterns elsewhere

### 3. Write Failing Test
- Create a test that reproduces the bug
- Verify the test fails: `npm test`
- The test MUST fail before fixing

### 4. Implement Fix
- Write minimal code to fix the bug
- Do NOT add features or refactor unrelated code
- Keep the fix as small as possible

### 5. Verify Fix
- Run the failing test — it should pass
- Run full test suite: `npm test`
- Run build: `npm run build`
- Check for regressions

### 6. Document
- Update CHANGELOG.md with bug fix entry
- Add error solution to `.opencode/instructions/error-solutions.md`
- Log discovery to `.agents/memory.md`

## Outcome Capture
- [ ] Bug reproduced and confirmed
- [ ] Root cause identified
- [ ] Failing test written and verified
- [ ] Fix implemented and verified
- [ ] No regressions introduced
- [ ] Documentation updated
