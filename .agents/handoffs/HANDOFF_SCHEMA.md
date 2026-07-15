<!--
╔══════════════════════════════════════════════════════════════╗
║          .agents/handoffs/HANDOFF_SCHEMA.md                  ║
║  Handoff File Format Specification                           ║
║  Version 1.0 — Agent-Agnostic                                ║
╚══════════════════════════════════════════════════════════════╝
-->

# Handoff File Schema (v1.0)

Handoff files are **Markdown with YAML frontmatter**.  
They are parsed by reading: YAML frontmatter (between `---` delimiters) for structured metadata, and the Markdown body for human-readable context.

---

## File Format

```
---
# YAML Frontmatter — Structured metadata (machine-parseable)
handoff_version: "1.0"
session_id: "20260716-session-001"
...
---

# Markdown Body — Human-readable context
## Summary
...
```

---

## Frontmatter Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `handoff_version` | string | Schema version (currently "1.0") |
| `session_id` | string | Unique session identifier |
| `timestamp` | string (ISO 8601) | When the handoff was created |
| `source_agent` | string | Agent ID that created this handoff |
| `target_agent` | string | Intended recipient ("*" for any) |
| `project` | string | Project name |

### Context Section (Optional)

| Field | Type | Description |
|-------|------|-------------|
| `context.branch` | string | Git branch at handoff time |
| `context.last_commit` | string | Last commit hash |
| `context.tasks_completed` | string[] | Tasks completed this session |
| `context.tasks_in_progress` | string[] | Tasks partially done |
| `context.tasks_pending` | string[] | Tasks not yet started |
| `context.current_phase` | string | Development phase |

### Discoveries Section (Optional)

Each discovery entry:

| Field | Type | Description |
|-------|------|-------------|
| `domain` | string | Area of discovery (e.g., "DBOS", "Next.js", "Windows") |
| `finding` | string | What was discovered |
| `severity` | enum | `"critical"`, `"high"`, `"medium"`, `"low"` |
| `action` | string | Recommended action |
| `occurred_at` | string (ISO 8601) | When it was discovered |

### Errors Section (Optional)

Each error entry:

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error message or symptom |
| `solution` | string | How it was fixed |
| `frequency` | number | How many times encountered |

### Knowledge Base Updates (Optional)

| Field | Type | Description |
|-------|------|-------------|
| `file` | string | File that needs updating |
| `additions` | string[] | What to add |

### Next Session Instructions (Optional)

| Field | Type | Description |
|-------|------|-------------|
| `next_session.priority` | string[] | Prioritized task list |
| `next_session.context_files` | string[] | Files to read before starting |
| `next_session.warnings` | string[] | Warnings for next agent |

### Tags (Optional)

| Field | Type | Description |
|-------|------|-------------|
| `tags` | string[] | Free-form tags for searchability |

---

## Frontmatter Example

```yaml
handoff_version: "1.0"
session_id: "20260716-feat-auth-001"
timestamp: "2026-07-16T14:30:00Z"
source_agent: "opencode"
target_agent: "*"
project: "workflow101"
context:
  branch: "main"
  last_commit: "a1b2c3d4e5f6"
  tasks_completed:
    - "feat: add config validation"
    - "fix: db timeout on first load"
  tasks_in_progress:
    - "chore: add CI pipeline"
  tasks_pending:
    - "docs: update README"
  current_phase: "development"
discoveries:
  - domain: "DBOS"
    finding: "DBOS.launch() can hang without timeout wrapper"
    severity: "critical"
    action: "Wrap all DBOS.launch() calls in 5s timeout"
    occurred_at: "2026-07-16T13:00:00Z"
  - domain: "Windows"
    finding: "rmdir /s /q node_modules hangs due to antivirus"
    severity: "medium"
    action: "Use temp directory installs instead of deleting node_modules"
    occurred_at: "2026-07-16T12:00:00Z"
errors:
  - error: "ERR_MODULE_NOT_FOUND for crypto in browser bundle"
    solution: "Dynamic import with ssr:false + resolve alias to stub"
    frequency: 3
  - error: "DBOSClient.create() timeout on application startup"
    solution: "Lazy init with 5s timeout wrapper, return 503 fallback"
    frequency: 2
kb_updates:
  - file: ".opencode/instructions/lessons.md"
    additions:
      - "DBOS.launch() timeout handling"
      - "Windows node_modules recovery procedure"
  - file: ".opencode/instructions/error-solutions.md"
    additions:
      - "ERR_MODULE_NOT_FOUND Node.js built-in fix"
next_session:
  priority:
    - "Configure CI/CD pipeline for automated E2E tests"
    - "Fix WebKit/Firefox browser binary installation"
    - "Address workflow package vulnerabilities"
  context_files:
    - ".agents/handoffs/20260716-feat-auth-001.md"
  warnings:
    - "DBOS may hang on first load — wait 5s timeout then retry"
    - "Some E2E tests fail in non-Chromium browsers"
tags:
  - "feature:auth"
  - "fix:timeout"
  - "dbos"
```

---

## Body Sections (Markdown)

After the frontmatter, the body contains human-readable context:

### Required Sections

```markdown
# Session Handoff: [Session Label]

## Summary
[Brief summary of what was accomplished this session]

## Key Decisions
1. **Decision**: [What was decided]
   - **Rationale**: [Why]
   - **Impact**: [What this means going forward]

## Open Questions
- [Question that needs answering]

## Current State
- Build: ✅ Passing / ❌ Failing / ⚠️ Partial
- Tests: [X] passing / [Y] total
- E2E: [X] passing / [Y] total ([browsers])

## Next Actions
1. [ ] **Action 1**: [Details]
2. [ ] **Action 2**: [Details]
```

### Optional Sections

```markdown
## Warnings
- [Important warnings for next session]

## Dependencies
- [External dependencies or blockers]

## Configuration Changes
- [Any config/env changes made]

## Files Created / Modified
- `path/to/file.ts` — What changed
```

---

## Validation Rules

A valid handoff file MUST:
1. Start with `---\n` (YAML frontmatter delimiter)
2. Contain all required frontmatter fields
3. End with `\n` (newline)
4. Have a non-empty body after the frontmatter

A valid handoff file SHOULD:
1. Have at least one discovery entry
2. Have at least one next_session entry
3. Have at least one error entry (if errors occurred)

---

## Change History

| Date       | Change                                     |
|------------|---------------------------------------------|
| 2026-07-16 | Initial schema v1.0 — agent-agnostic format |
