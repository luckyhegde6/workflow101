---
description: Create implementation plan for workflow features
agent: planner
subtask: true
---

# Plan Command

Create a detailed implementation plan for: $ARGUMENTS

## Planning Steps

### 1. Analyze Requirements
- Understand the feature/change needed
- Identify dependencies
- Check existing code patterns

### 2. Create Task Breakdown
For each task include:
- **File location**: Where the change will be made
- **Description**: What needs to be done
- **Acceptance criteria**: How to verify completion

### 3. Implementation Order
- Group dependent tasks
- Identify blockers
- Suggest parallel work where possible

### 4. Testing Strategy
- Unit tests needed
- Integration tests needed
- E2E tests needed

### 5. Risk Assessment
- Technical risks
- Security concerns
- Performance implications

## Output Format

```markdown
## Implementation Plan: [Feature Name]

### Overview
[1-2 sentence description]

### Tasks
1. [ ] **Task Name**
   - File: `path/to/file.ts`
   - Description: What this does
   - Criteria: [ ] Criterion 1

2. [ ] **Task Name**
   - File: `path/to/file.ts`
   - Dependencies: Task 1
   - ...

### Dependencies
- [ ] Dependency graph

### Testing
- Unit: `tests/unit/file.test.ts`
- Integration: `tests/integration/api.test.ts`
- E2E: `tests/e2e/flow.spec.ts`

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

### Time Estimate
- Development: X hours
- Testing: Y hours
- Buffer: Z hours
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
