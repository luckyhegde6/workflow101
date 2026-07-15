<!--
╔══════════════════════════════════════════════════════════════╗
║              .agents/rules/guardrails.md                     ║
║  Universal Process, Security, and File Modification          ║
║  Guardrails — Enforced by ALL agents, ALL tools              ║
╚══════════════════════════════════════════════════════════════╝
-->

# Universal Guardrails

These guardrails apply to **all agents, all tools, all sessions**.  
They are non-negotiable — if a guardrail would be violated, the agent MUST stop and ask for user permission.

---

## G1: Process Guardrails

### G1.1 — Pre-Commit Checklist (MANDATORY)
Before ANY commit or pull request, the following MUST be verified:

- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No hardcoded secrets
- [ ] Security check passes: `npm run security:check`
- [ ] E2E test smoketest (if UI changed)
- [ ] Handoff file created/updated
- [ ] CHANGELOG.md updated
- [ ] TODOS.md updated

### G1.2 — Session Lifecycle
Every session MUST follow this lifecycle:

1. **START** — Load latest handoff → Load memory → Understand state
2. **WORK** — Execute tasks, log discoveries, update memory
3. **HANDOFF** — Create handoff file before closing
4. **END** — Run pre-commit checks, update docs

Skipping any step requires user permission.

### G1.3 — Test Before Implementation
For all bug fixes:
1. Write a test that reproduces the bug
2. Verify the test fails
3. Implement the fix
4. Verify the test passes

For all new features:
1. Write tests first (TDD)
2. Implement minimal code to pass
3. Refactor

### G1.4 — One Task At A Time
The orchestrator agent MUST only mark one task as `in_progress` at a time.
Do NOT start a new task until the current one is `completed` or `cancelled`.

---

## G2: Security Guardrails

### G2.1 — Secret Detection (MANDATORY)
Never hardcode credentials, API keys, tokens, or passwords.
All secrets MUST come from `process.env` or environment files.

### G2.2 — Environment File Protection
- `.env.local` — NEVER committed (contains real secrets)
- `.env` — Template only, no real values
- `.env.*.local` — NEVER committed

### G2.3 — Input Validation
All user-facing inputs MUST be validated at the system boundary.
Use schema-based validation (Zod, Valibot, or equivalent).

### G2.4 — SQL Injection Prevention
All database queries MUST use parameterized queries.
Never concatenate user input into SQL strings.

### G2.5 — Error Message Safety
Error messages returned to users MUST NOT leak:
- Stack traces
- Internal paths
- Database schema details
- API keys or tokens

### G2.6 — Rate Limiting
All public API endpoints MUST have rate limiting.
100 requests/minute per IP for public endpoints.
Higher limits for authenticated endpoints with user context.

---

## G3: File Modification Guardrails

### G3.1 — Immutability Principle
Never mutate existing objects or data structures.
Always create new copies with `{ ...obj, updated: true }`.
Always use `.map()`, `.filter()`, `.reduce()` over loops with mutation.

### G3.2 — Touch Only What You Must
When editing existing code:
- Do NOT "improve" adjacent code, comments, or formatting
- Do NOT refactor things that aren't broken
- Match existing style, even if you'd do it differently
- Remove orphans YOUR changes created (unused imports, variables)
- Do NOT remove pre-existing dead code unless asked

### G3.3 — File Size Limits
- Single file: max 800 lines
- Single function: max 50 lines
- Single component: max 400 lines
- If exceeding, split into smaller files/modules

### G3.4 — Database Migration Safety
Before any database schema change:
1. Ask user permission explicitly
2. Create a reversible migration
3. Test on local database first
4. Never run on production without approval

### G3.5 — Dependency Addition
Before adding ANY npm dependency:
1. Check if the project already has it
2. Check if existing code can be reused
3. Ask user permission before installing
4. Use `--save-exact` to pin versions

---

## G4: Agent Behavior Guardrails

### G4.1 — Permission Boundaries
- **Read**: Full project access
- **Write**: `app/`, `tests/`, `.agents/`, `.opencode/`, `docs/` directories only
- **Write (with permission)**: `.agents/`, `.opencode/`, `package.json`, `next.config.*`
- **Execute**: npm, npx, git, node — any tool in PATH
- **NEVER write to**: `node_modules/`, `.next/`, `.env.local`, `dist/`, `build/`

### G4.2 — No Silent Failures
All errors MUST be:
1. Logged with context (what, where, why)
2. Communicated to the user (if user-facing)
3. Contained (never crash the process unnecessarily)

### G4.3 — Ask Before Acting On
These operations ALWAYS require user permission:
- Database migrations or schema changes
- Environment variable modifications
- Package.json dependency changes
- Authentication or authorization changes
- Production deployments
- File deletions outside own changes

### G4.4 — Handoff Completeness
Every handoff file MUST include:
1. Session ID and timestamp
2. Tasks completed / in-progress / pending
3. At least one discovery or lesson
4. Next session instructions
5. Current state (build status, test status)
6. Any warnings for the next agent

---

## G5: Self-Learning Guardrails

### G5.1 — Mandatory Discovery Logging
Every session MUST add at least one entry to:
- `.agents/memory.md` — Persistent cross-session memory
- `.agents/handoffs/<session>.md` — Session handoff

If nothing was learned, explicitly note: "No new discoveries."

### G5.2 — Knowledge Base Maintenance
If a discovery would benefit future sessions:
- Add to `.opencode/instructions/lessons.md` (if it's a lesson)
- Add to `.opencode/instructions/patterns.md` (if it's a pattern)
- Add to `.opencode/instructions/error-solutions.md` (if it's an error fix)

### G5.3 — Outcome Capture
Every task execution MUST end with an outcome capture:
- Success criteria met?
- What went well / wrong
- New patterns discovered
- Errors encountered and solutions
- Knowledge base updates needed

---

## Guardrail Violation Protocol

If any guardrail would be violated:

```
1. STOP — Do NOT proceed
2. IDENTIFY — Which guardrail(s) would be violated?
3. INFORM — Tell the user which guardrail and why
4. PROPOSE — Suggest a safe alternative
5. WAIT — Get user permission before proceeding
```

**Scope:** These guardrails apply to all files, all sessions, all agents, all tools.
They supersede any tool-specific configurations.

---

## Change History

| Date       | Change                                            |
|------------|----------------------------------------------------|
| 2026-07-16 | Initial creation — universal guardrails            |
