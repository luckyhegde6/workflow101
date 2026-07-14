# ADR-001: Agent Orchestrator with Self-Learning Loops

**Status:** Proposed  
**Date:** 2026-07-15  
**Author:** OpenCode Agent  
**Deciders:** Project Maintainers  

---

## Context

The current workflow101 project has an agent-assisted development setup via OpenCode, but it lacks:

- **Cross-session memory** - Each session starts fresh; no recollection of prior decisions, errors, or patterns discovered in earlier work.
- **Feedback loops** - When commands fail or produce unexpected output, there is no mechanism to capture the failure, analyze it, and prevent recurrence.
- **Minimal configuration** - The `opencode.json` only defines MCP servers; no agent roles, command routing, or knowledge base structure.
- **No structured knowledge** - Lessons learned exist in a flat `LESSONS.md` file but are not partitioned, timestamped, or linked to specific contexts.

Without these capabilities, the agent repeats mistakes, wastes tokens on rediscovery, and fails to improve over time. As the project grows (8+ workflow types, E2E test suite, multiple commands), this lack of systematic learning becomes a bottleneck.

## Decision

We will implement an Agent Orchestrator using OpenCode's plugin architecture with four primary mechanisms:

### 1. OpenCode Plugin Architecture for Agent Orchestration

Use the `@opencode-ai/plugin` SDK (already present in `node_modules/`) to define specialized agents with role-based command routing.

**How it works:**
- `opencode.json` will be extended to include an `agents` registry mapping command names to agent roles.
- Each agent has a specific system prompt, tool set, and output format.
- A command router dispatches user requests to the appropriate agent based on the command prefix (e.g., `/plan` → planner agent).

**Agent Roles:**

| Role | Command | System Prompt Focus |
|------|---------|-------------------|
| `planner` | `/plan` | Architecture design, task breakdown |
| `tdd` | `/tdd` | Test-first development, coverage |
| `reviewer` | `/code-review` | Code quality, standards compliance |
| `security` | `/security` | Vulnerability scanning, secret detection |
| `e2e` | `/e2e` | Playwright test execution, debugging |

### 2. Knowledge Base in `.opencode/instructions/` as Markdown Files

All persistent knowledge lives in structured markdown files under `.opencode/instructions/`:

| File | Content | Update Frequency |
|------|---------|-----------------|
| `project-context.md` | Tech stack, architecture, environment setup | Onboarding / infra changes |
| `lessons.md` | Mistakes, bugs, optimizations discovered | After each bugfix |
| `patterns.md` | Recurring code patterns, idioms, conventions | After pattern discovery |
| `error-solutions.md` | Known errors with root cause and fix | After each error resolution |

**Format convention:** Each entry uses fact blocks delimited by HTML comments:
```markdown
<!-- BEGIN:unique-id -->
**Fact:** [concise statement]
**Context:** [when this applies]
**Source:** `file:line`
<!-- END:unique-id -->
```

This format enables:
- Token-efficient loading via selective range extraction
- Programmatic updates via string replacement
- Quick scanning by LLM for relevant context

### 3. Memory Graph for Cross-Session Persistence

Use OpenCode's built-in memory graph (`memory_create_entities`, `memory_add_observations`, `memory_search_nodes`) to persist structured knowledge across sessions.

**Entity types:**
- `Feature` - A workflow101 feature (e.g., "e2e-testing", "dashboard-ui")
- `Component` - A code component (e.g., "WorkflowList", "DBOSClient")
- `Decision` - An architectural decision record
- `Pattern` - A reusable code pattern
- `Error` - A known error with solution
- `Command` - An OpenCode command definition

**Relation types:**
- `implements` - Component implements Feature
- `depends_on` - Feature depends on Component
- `fixes` - Pattern/Decision fixes Error
- `uses` - Command uses Pattern
- `documents` - Decision documents Feature

**Query pattern:**
Before each session, the orchestrator queries the memory graph for:
1. Recent errors related to the task type
2. Relevant patterns from similar tasks
3. Past decisions affecting the same components
4. Active (unresolved) issues

### 4. Feedback Accumulation via Command Output Capture

Every command execution captures:
- Exit code (0 = success, non-zero = failure)
- stdout (structured output)
- stderr (errors, warnings)
- Duration
- Timestamp

This data feeds into the self-learning loop (section 8.4 of PRD.md).

### 5. Token Optimization via Context Windowing and Fact Blocks

To manage context limits:
- **Selective loading:** Only load instruction sections relevant to the current command type
- **Fact blocks over prose:** Single-line facts with context tags vs. paragraph descriptions
- **Reference files:** Detailed documentation stays in separate files; prompts reference them by path
- **Memory graph queries:** Fetch precise observations instead of loading entire documents

## Consequences

### Positive
- **Improved agent performance over time**: The agent gets smarter with each session.
- **Reduced token usage**: Context windowing and fact blocks cut token consumption by 30-50%.
- **Faster debugging**: Known errors are resolved in minutes, not hours.
- **Knowledge retention**: Team members benefit from accumulated project wisdom.
- **Standardized processes**: Commands produce consistent, parseable output.

### Negative
- **Maintenance overhead**: Knowledge base files need periodic review and pruning.
- **Upfront investment**: Phase 1-2 require dedicated setup time before benefits materialize.
- **Memory graph spamming**: Without careful entity management, the graph can become noisy.
- **Context selection complexity**: Choosing the right instruction sections requires a heuristic that may need tuning.

### Neutral
- **Lock-in to OpenCode**: The architecture depends on OpenCode's plugin SDK and memory graph; migration would require reimplementation.
- **File system as database**: Instruction files on disk are simple but lack indexing, versioning, and concurrent access guarantees.

## Alternatives Considered

### Alternative 1: LangChain Agent Framework

**Pros:**
- Rich ecosystem of tools, chains, and memory types
- Language-agnostic (Python/JS)
- Built-in vector store for RAG

**Cons:**
- Heavy dependency (langchain, langgraph, etc.)
- Overkill for a CLI-agent-assisted project
- Doesn't integrate with OpenCode's native capabilities
- Learning curve for the team

**Verdict:** Rejected. Too much overhead for our use case.

### Alternative 2: Custom Python Orchestrator

**Pros:**
- Full control over architecture
- Can use any LLM provider
- Portable across editors

**Cons:**
- Requires building from scratch (command routing, memory, knowledge base)
- Must manually implement OpenCode integration
- Ongoing maintenance burden

**Verdict:** Rejected. Building a custom orchestrator duplicates work that OpenCode already provides.

### Alternative 3: No Orchestrator (Status Quo)

**Pros:**
- Zero setup time
- No maintenance required
- No risk of over-engineering

**Cons:**
- No cross-session learning
- Repeated errors and wasted tokens
- Project knowledge exists only in human memory
- As the project grows, agent effectiveness degrades

**Verdict:** Rejected. The cost of not learning compounds over time.

### Alternative 4: Supabase + Vector Store for Knowledge

**Pros:**
- Scalable, queryable knowledge base
- Supports semantic search
- Multi-user access

**Cons:**
- Supabase project was deleted and is unavailable
- Adds a service dependency for what can be files on disk
- Over-engineered for a CLI tool knowledge base

**Verdict:** Rejected. Local markdown files plus memory graph are sufficient.

---

## Implementation Plan

See PRD.md section 8.6 for phased implementation plan.

## References

- PRD.md section 8 - Agent Orchestrator
- `opencode.json` - Agent registry configuration
- `AGENTS.md` - Agent instructions and rules
- `LESSONS.md` - Legacy lessons file (to be migrated)
- `.opencode/commands/` - Command definitions with feedback hooks
