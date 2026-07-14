---
description: Review workflow code and DBOS patterns
agent: code-reviewer
subtask: true
---

# Code Review Command

Review code for: $ARGUMENTS

## Review Focus

### 1. DBOS Pattern Compliance
- [ ] `"use workflow"` directive present
- [ ] `"use step"` directive present
- [ ] Workflows are deterministic
- [ ] Proper `waitUntil` usage

### 2. Code Quality
- [ ] Functions < 50 lines
- [ ] Descriptive names
- [ ] Consistent error handling
- [ ] No code duplication

### 3. Security
- [ ] Input validation
- [ ] No hardcoded secrets
- [ ] SQL injection prevention
- [ ] XSS prevention

### 4. Performance
- [ ] No N+1 queries
- [ ] Proper caching
- [ ] Connection pooling

## Review Output

```markdown
## Code Review: [Files/Components]

### Summary
[Overview of changes]

### Strengths
- What was done well

### Issues
1. **[Severity]**: [Issue]
   - Location: `file:line`
   - Suggestion: [Fix]

### Recommendations
[Additional improvements]

### Security Concerns
[Any security issues]

### Approval: [ ] Approved [ ] Changes Requested
```

## Outcome Capture

After execution, log the outcome to improve future runs:

### Success Criteria
- [ ] Task completed successfully
- [ ] All verifications passed
- [ ] No regressions introduced

### Lessons Captured
- What went well:
- What went wrong:
- New patterns discovered:
- Errors encountered and solutions:

### Knowledge Base Updates
- [ ] Update `.opencode/instructions/lessons.md` with new learnings
- [ ] Update `.opencode/instructions/patterns.md` with new patterns
- [ ] Update `.opencode/instructions/error-solutions.md` with new error solutions
