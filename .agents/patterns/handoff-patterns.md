<!--
╔══════════════════════════════════════════════════════════════╗
║        .agents/patterns/handoff-patterns.md                  ║
║  Reusable Handoff Patterns — Common Scenarios                ║
╚══════════════════════════════════════════════════════════════╝
-->

# Handoff Patterns

Reusable patterns for common handoff scenarios.  
Copy the relevant pattern's frontmatter and adjust as needed.

---

## Pattern 1: Feature Complete Handoff

Use when a feature implementation is finished and the session is ending.

```yaml
discoveries:
  - domain: "[domain]"
    finding: "[discovery]"
    severity: "medium"
    action: "[action]"
next_session:
  priority:
    - "Review [feature] PR"
    - "Deploy [feature] to staging"
    - "Write E2E tests for [feature]"
tags:
  - "feature:[feature-name]"
  - "complete"
```

**Body template override:**
```markdown
## Next Actions
1. [ ] **PR Review**: Create PR and request review
2. [ ] **Deployment**: Deploy to staging for verification
3. [ ] **E2E Tests**: Cover happy path and error states
```

---

## Pattern 2: Bug Fix Handoff

Use when a bug was fixed during the session.

```yaml
discoveries:
  - domain: "[domain]"
    finding: "Root cause of [bug] identified"
    severity: "critical"
    action: "[fix applied]"
errors:
  - error: "[original bug symptom]"
    solution: "[fix applied]"
    frequency: 1
next_session:
  priority:
    - "Verify [bug] fix in production/staging"
    - "Add regression test for [bug]"
  warnings:
    - "Bug fix for [bug] may affect [related feature] — verify"
tags:
  - "fix:[bug-name]"
  - "regression-test-needed"
```

---

## Pattern 3: Blocked Session Handoff

Use when the session is blocked by external factors.

```yaml
context:
  tasks_completed: []
  tasks_in_progress:
    - "[blocked task]"
  tasks_pending:
    - "[remaining work]"
discoveries:
  - domain: "blocker"
    finding: "[blocker description]"
    severity: "high"
    action: "[unblocking action needed]"
next_session:
  priority:
    - "Resolve blocker: [blocker description]"
    - "Continue: [blocked task]"
  warnings:
    - "Session was blocked by [blocker]"
tags:
  - "blocked"
  - "needs-human-intervention"
```

---

## Pattern 4: Knowledge Sync Handoff

Use when the session was primarily about learning/research.

```yaml
context:
  tasks_completed:
    - "Research: [topic]"
  tasks_pending:
    - "Implement based on research"
discoveries:
  - domain: "[domain]"
    finding: "[key research finding]"
    severity: "high"
    action: "Update knowledge base"
kb_updates:
  - file: ".agents/memory.md"
    additions:
      - "[Research summary]"
  - file: ".opencode/instructions/patterns.md"
    additions:
      - "[New pattern from research]"
next_session:
  priority:
    - "Implement based on research findings"
tags:
  - "knowledge-sync"
  - "research"
```

---

## Pattern 5: Error Recovery Handoff

Use when recovering from a failed/corrupted state.

```yaml
context:
  tasks_completed:
    - "Recovery: [what was recovered]"
discoveries:
  - domain: "recovery"
    finding: "Root cause of failure: [cause]"
    severity: "critical"
    action: "Preventive measure deployed"
errors:
  - error: "[failure symptom]"
    solution: "[recovery steps]"
    frequency: 1
next_session:
  priority:
    - "Verify system health after recovery"
    - "Add monitoring/alerting for [failure mode]"
  warnings:
    - "System recovered from [failure] — monitor closely"
tags:
  - "recovery"
  - "critical-fix"
```

---

## Pattern 6: Multi-Agent Handoff

Use when handing off between different agent types.

```yaml
# Developer → Reviewer handoff
source_agent: "developer"
target_agent: "reviewer"
context:
  tasks_completed:
    - "Implementation: [feature]"
next_session:
  priority:
    - "Review: [feature] PR"
    - "Security audit: [feature]"
  context_files:
    - "[feature files]"
tags:
  - "handoff:developer-to-reviewer"
```

```yaml
# Reviewer → Developer handoff
source_agent: "reviewer"
target_agent: "developer"
context:
  tasks_completed:
    - "Review: [feature]"
discoveries:
  - domain: "code-quality"
    finding: "[review finding]"
    severity: "[severity]"
    action: "[fix recommendation]"
next_session:
  priority:
    - "Fix review issues: [issues]"
tags:
  - "handoff:reviewer-to-developer"
```

---

## Pattern Selection Guide

| Situation | Use Pattern |
|-----------|-------------|
| Feature done, session ending | Feature Complete (P1) |
| Bug found and fixed | Bug Fix (P2) |
| Can't continue (external blocker) | Blocked Session (P3) |
| Research/learning session | Knowledge Sync (P4) |
| Recovering from failure/corruption | Error Recovery (P5) |
| Switching agent types mid-stream | Multi-Agent (P6) |

---

## Change History

| Date       | Change                                         |
|------------|-------------------------------------------------|
| 2026-07-16 | Initial creation — 6 handoff patterns           |
