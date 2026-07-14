# ADR-003: Orchestrator Knowledge Base Design

**Status**: Proposed

## Context
The agent orchestrator self-learning system needs a centralized knowledge repository to:
- Maintain project context across sessions
- Store discovered patterns and lessons
- Provide error solution references
- Reduce agent hallucinations through documented conventions
- Enable continuous learning as new knowledge is discovered

Previously, this knowledge was scattered across AGENTS.md, LESSONS.md, CHANGELOG.md, and individual skill files, making it hard for agents to find relevant information for a given task.

## Decision
Create a knowledge base consisting of 4 categorized markdown files under `.opencode/instructions/`:

| File | Purpose |
|------|---------|
| `project-context.md` | One-page project overview: what it is, tech stack, key decisions, current state |
| `lessons.md` | Compiled failures, patterns, and learnings from LESSONS.md + CHANGELOG.md |
| `patterns.md` | Reusable code patterns with runnable examples (workflows, routes, E2E) |
| `error-solutions.md` | Commonly encountered errors with causes and step-by-step fixes |

Additionally, this ADR (`docs/adr/ADR-003-orchestrator-knowledge-base.md`) documents the architecture decision itself.

## Consequences

### Positive
- Agents have a single source of truth for project-specific knowledge
- Reduced time spent re-discovering previously solved problems
- Clear categorization makes it easy to find relevant information
- Lower hallucination rates on DBOS/Next.js patterns
- New contributors (human or agent) can quickly understand the project

### Negative
- Requires discipline to update files when new lessons or patterns emerge
- Risk of drift if files aren't maintained alongside code changes
- File maintenance protocol adds overhead to each session

### Mitigations
- File maintenance is mandated in AGENTS.md pre-commit checklist
- Updates should happen inline during task resolution, not as separate work
- Agents should read relevant instruction files before task execution and update with new learnings after

## Usage Guide
Before any task execution, agents should:
1. Read `project-context.md` for current state and key decisions
2. Read `patterns.md` for relevant code patterns
3. Reference `error-solutions.md` when encountering known errors

After completing a task:
1. Update `lessons.md` with any new learnings
2. Add new patterns to `patterns.md`
3. Add new error solutions to `error-solutions.md`
