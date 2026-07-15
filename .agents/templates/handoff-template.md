<!--
╔══════════════════════════════════════════════════════════════╗
║       .agents/templates/handoff-template.md                  ║
║  Handoff File Template — Fill in before session end          ║
║  Schema: v1.0                                                ║
╚══════════════════════════════════════════════════════════════╝

TO USE: Copy to `.agents/handoffs/YYYYMMDD-HHMMSS-<agent>-<label>.md`
and fill in all `[bracketed]` fields.
-->

---
handoff_version: "1.0"
session_id: "[YYYYMMDD]-session-[NNN]"
timestamp: "[YYYY-MM-DDTHH:MM:SSZ]"
source_agent: "[agent-id]"
target_agent: "*"
project: "workflow101"
context:
  branch: "[git-branch]"
  last_commit: "[commit-hash]"
  tasks_completed:
    - "[task description]"
  tasks_in_progress:
    - "[task description]"
  tasks_pending:
    - "[task description]"
  current_phase: "[development|stabilization|deployment|maintenance]"
discoveries:
  - domain: "[domain]"
    finding: "[What was discovered]"
    severity: "[critical|high|medium|low]"
    action: "[Recommended action]"
    occurred_at: "[YYYY-MM-DDTHH:MM:SSZ]"
errors:
  - error: "[Error message or symptom]"
    solution: "[How it was fixed]"
    frequency: [N]
kb_updates:
  - file: "[path/to/file.md]"
    additions:
      - "[What to add]"
next_session:
  priority:
    - "[Next highest priority task]"
  context_files:
    - "[path/to/relevant/file.md]"
  warnings:
    - "[Warning for next agent]"
tags:
  - "[tag]"
---

# Session Handoff: [Session Title]

## Summary
[2-3 sentence summary of what was accomplished this session]

## Key Decisions
1. **Decision**: [What was decided]
   - **Rationale**: [Why this decision was made]
   - **Impact**: [What this means for future work]

2. **Decision**: [What was decided]
   - **Rationale**: [Why this decision was made]
   - **Impact**: [What this means for future work]

## Open Questions
- [ ] [Question that needs resolution]
- [ ] [Question that needs resolution]

## Current State
- **Build**: [✅ Passing | ❌ Failing | ⚠️ Partial]
- **Unit Tests**: [N] / [N] passing
- **E2E Tests**: [N] / [N] passing
- **Known Issues**: [List critical known issues]

## Next Actions
1. [ ] **[Action Title]**: [Description] — File: `[path/to/file.ts]`
2. [ ] **[Action Title]**: [Description] — File: `[path/to/file.ts]`
3. [ ] **[Action Title]**: [Description] — File: `[path/to/file.ts]`

## Warnings
- [ ] [Critical warning for next agent]
- [ ] [Warning about known flaky tests]
- [ ] [Warning about environment issues]

## Files Modified This Session
- `[path/to/file.ts]` — [Brief description of change]
- `[path/to/file.ts]` — [Brief description of change]

## Dependencies
- [External dependency or tool version requirement]

## Outcome Capture

### Success Criteria
- [ ] All planned tasks completed
- [ ] Tests passing
- [ ] No regressions introduced

### Lessons Captured
- **What went well**: [Reflection]
- **What went wrong**: [Reflection]
- **New patterns discovered**: [Patterns to add to knowledge base]
- **Errors encountered**: [Errors to add to error-solutions.md]

### Knowledge Base Updates Needed
- [ ] Update `.opencode/instructions/lessons.md`
- [ ] Update `.opencode/instructions/patterns.md`
- [ ] Update `.opencode/instructions/error-solutions.md`
- [ ] Update `.agents/memory.md`
