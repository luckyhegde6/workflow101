---
description: Fix Next.js and TypeScript build errors
agent: build-error-resolver
subtask: true
---

# Build Fix Command

Fix build errors for: $ARGUMENTS

## Error Resolution Process

### 1. Run Build
```bash
npm run build
```

### 2. Identify Error Type
- Build error vs TypeScript error
- Module not found vs type mismatch

### 3. Apply Minimal Fix
- Fix root cause
- Avoid workarounds

### 4. Verify
```bash
npm run build
npm test
```

## Common Fixes

| Error | Fix |
|-------|-----|
| Module not found | Check path, run npm install |
| Type mismatch | Add explicit type or cast |
| Async error | Wrap in try/catch |
| Dynamic import | Use await |

## DBOS-Specific Fixes

### Workflow Directive Error
```typescript
// Must be string literal
"use workflow";  // ✓
`use workflow`;   // ✗
```

### Step Function Error
```typescript
// Must be async
async function myStep() {
  "use step";
  // ...
}
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
