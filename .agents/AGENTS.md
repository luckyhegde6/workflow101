<!--
╔══════════════════════════════════════════════════════════════╗
║                    .agents/AGENTS.md                         ║
║  Agent-Agnostic Configuration (OpenCode, Claude, Cursor...)  ║
║  Consumed by: CLAUDE.md, opencode.json, cursor.json, ...     ║
╚══════════════════════════════════════════════════════════════╝
-->

<!-- ========================================================== -->
<!-- SECTION 1: CORE IDENTITY                                    -->
<!-- ========================================================== -->

# Agent Configuration — Agent-Agnostic Core

This file defines the **universal agent configuration** for the workflow101 project.  
It is referenced by all AI coding tool configs (`CLAUDE.md`, `opencode.json`, etc.)  
and provides a single source of truth for agent behavior, rules, and memory.

**Do NOT duplicate these rules in individual tool configs.**  
Instead, reference this file via `@include` or `instructions` array.

---

## Reference Structure

```
.agents/                        # ← YOU ARE HERE
├── AGENTS.md                   # Master config (this file)
├── rules/
│   ├── guardrails.md           # Universal process & security guardrails
│   └── lifecycle.md            # Session lifecycle (start/handoff/end)
│   └── agents.yaml             # Agent role definitions
├── handoffs/
│   ├── HANDOFF_SCHEMA.md       # Handoff file format specification
│   └── <session>-<agent>.md    # Individual session handoff files
├── patterns/
│   └── handoff-patterns.md     # Reusable handoff patterns
├── templates/
│   └── handoff-template.md     # Handoff file template
├── scripts/
│   ├── create-handoff.cjs      # Generate a handoff file
│   ├── read-handoff.cjs        # Read the latest handoff file
│   └── validate-handoff.cjs    # Validate handoff file format
└── memory.md                   # Persistent cross-session memory
```

---

## Loading Order

When a new session starts, agents MUST load files in this order:

1. `.agents/AGENTS.md`                    ← Core identity and structure
2. `.agents/rules/guardrails.md`          ← Mandatory guardrails
3. `.agents/rules/lifecycle.md`           ← Session lifecycle rules
4. `.agents/rules/agents.yaml`            ← Agent definitions
5. `.agents/memory.md`                    ← Cross-session memory
6. `.agents/handoffs/HANDOFF_SCHEMA.md`   ← Handoff format reference
7. `.agents/handoffs/*.md` (latest)       ← Previous session handoff
8. `.opencode/instructions/*.md`          ← Project-specific instructions

---

## Handoff File Naming Convention

Handoff files follow this format:
```
.agents/handoffs/YYYYMMDD-HHMMSS-<agent-id>-<session-label>.md
```

Examples:
- `20260716-143000-opencode-feature-auth.md`
- `20260716-150000-claude-fix-timeout.md`

The **latest handoff file by timestamp** is consumed when a session starts.

---

<!-- ========================================================== -->
<!-- SECTION 2: UNIVERSAL RULES                                  -->
<!-- ========================================================== -->

## Universal Rules (All Agents, All Tools)

### Rule 1: Always Load Handoff On Start
Before performing any work, read the latest handoff file from `.agents/handoffs/`.
If it exists, incorporate its `next_session` instructions and warnings.

### Rule 2: Always Create Handoff On End
Before session ends, create a handoff file in `.agents/handoffs/`.
Include all discoveries, errors, open questions, and next actions.

### Rule 3: Never Duplicate Configuration
Project agent configuration lives in `.agents/`. Tool-specific configs
(`CLAUDE.md`, `opencode.json`, `cursor.json`) must reference `.agents/AGENTS.md`
and must NOT duplicate its content.

### Rule 4: Self-Learning Is Mandatory
Every session MUST log at least one discovery to `.agents/memory.md`.
If nothing new was learned, log "No new discoveries this session."

### Rule 5: Fail Closed on Guardrails
If any guardrail in `.agents/rules/guardrails.md` would be violated,
**stop and ask for user permission**. Do NOT proceed automatically.

---

## Agent Manifest

This project defines the following agent roles. Each role is tool-agnostic
and can be fulfilled by any AI coding tool:

| Role ID          | Title                    | Primary Responsibility                          |
|------------------|--------------------------|--------------------------------------------------|
| `planner`        | Implementation Planner   | Break features into tasks, estimate effort       |
| `developer`      | Feature Developer        | Write implementation code (TDD)                  |
| `reviewer`       | Code Reviewer            | Review code quality, DBOS patterns, security     |
| `e2e-tester`     | E2E Test Runner          | Write and run Playwright E2E tests               |
| `security`       | Security Reviewer        | Audit secrets, inputs, auth, dependencies        |
| `build-fixer`    | Build Resolver           | Fix build, TypeScript, and module errors         |
| `knowledge`      | Knowledge Base Curator   | Maintain .agents/, memory, lessons, patterns     |
| `orchestrator`   | Session Orchestrator     | Route tasks, manage handoffs, enforce lifecycle  |

These roles are defined in detail in `.agents/rules/agents.yaml`.

---

## Change History

| Date       | Change                                          |
|------------|--------------------------------------------------|
| 2026-07-16 | Initial creation — agent-agnostic core config    |
