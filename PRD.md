# PRD - Everything Workflow System

**Version:** 0.1.1  
**Date:** 2026-07-15  
**Status:** Planning

## 1. Concept & Vision

Build a comprehensive "everything workflows" system that handles all types of background processing needs. The system should be:
- **Universal** - Handle email/SMS, data processing, onboarding, scheduled jobs, webhooks
- **Reliable** - Durable execution with automatic retries
- **Observable** - Real-time status tracking
- **Scalable** - Deploy to Vercel with cron triggers
- **Self-Improving** - Agent orchestrator that learns from past executions

## 2. Workflow Types

### 2.1 Email/SMS Notifications
- Scheduled notifications
- Reminders (recurring)
- Alert systems
- Transactional emails

### 2.2 Data Processing Pipelines
- Batch processing
- ETL operations
- Data transformations
- File processing

### 2.3 User Onboarding Flows
- Welcome email sequences
- Multi-step setup wizards
- Progress tracking
- Account verification

### 2.4 Scheduled/Cron Jobs
- Daily/weekly/monthly reports
- Data cleanup tasks
- Health checks
- Maintenance operations

### 2.5 API Webhook Handlers
- Process external events
- Webhook integrations
- Third-party API sync
- Event-driven workflows

## 3. Required Features

### 3.1 Workflow Status Dashboard
- View all workflows with status
- Filter by type, status, date
- Real-time updates
- Execution history

### 3.2 Manual Workflow Triggers
- On-demand workflow execution
- Parameterized inputs
- Immediate feedback
- Queue management

### 3.3 Workflow Scheduling
- Cron-based scheduling
- One-time delays
- Recurring workflows
- Timezone support

### 3.4 Retry/Error Handling
- Automatic retry (max 3)
- Exponential backoff
- Dead letter handling
- Error notifications

### 3.5 Workflow Chaining
- Sequential workflows
- Parallel execution
- Conditional branching
- Result passing

## 4. Technical Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  DBOS SDK   │────▶│  PostgreSQL │
│  (Next.js)  │     │   Client    │     │   (State)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                      │
       │                      ▼
       │              ┌─────────────┐
       │              │  Vercel     │
       │              │  Worker     │
       │              │  (Cron)     │
       │              └─────────────┘
       │
       ▼
┌──────────────────────┐
│  Agent Orchestrator  │
│  (OpenCode Plugin)   │
├──────────────────────┤
│  .opencode/commands/ │
│  .opencode/instruc-  │
│    tions/            │
│  Memory Graph        │
│  Feedback Loop       │
└──────────────────────┘
```

## 5. Implementation Phases

### Phase 1: Foundation
- [ ] DBOS SDK setup
- [ ] Basic workflow structure
- [ ] Worker API route
- [ ] Postgres connection

### Phase 2: Core Workflows
- [ ] Email notification workflow
- [ ] Scheduled job workflow
- [ ] Basic error handling

### Phase 3: Dashboard
- [ ] Workflow status UI
- [ ] Enqueue button
- [ ] Auto-refresh lists

### Phase 4: Advanced Features
- [ ] Workflow chaining
- [ ] Custom retry logic
- [ ] Webhook handlers

### Phase 5: Polish
- [ ] Monitoring
- [ ] Logging
- [ ] Documentation

## 6. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL_NON_POOLING` | PostgreSQL connection | Yes |

## 7. Dependencies

- `@dbos-inc/dbos-sdk` - Workflow execution
- `@vercel/functions` - Vercel integration
- `next` - Frontend framework
- `@opencode-ai/plugin` - Agent orchestration SDK

---

## 8. Agent Orchestrator

### 8.1 Vision

Self-improving agent orchestration system that:
- Routes tasks to specialized agents via OpenCode plugin architecture
- Captures outcomes from every execution to build a persistent knowledge base
- Extracts patterns from successes and failures to optimize future behavior
- Reduces token usage over time through context optimization

### 8.2 Architecture

```
┌───────────────────────────────────────────────┐
│              Agent Orchestrator                │
├───────────────────────────────────────────────┤
│                                                │
│  ┌──────────────┐    ┌────────────────────┐    │
│  │  Command      │    │  Agent Registry    │    │
│  │  Router       │───▶│  (opencode.json)   │    │
│  │               │    │                    │    │
│  │  /plan        │    │  planner agent     │    │
│  │  /tdd         │    │  tdd agent         │    │
│  │  /code-review │    │  reviewer agent    │    │
│  │  /security    │    │  security agent    │    │
│  │  /e2e         │    │  e2e agent         │    │
│  └──────┬───────┘    └────────────────────┘    │
│         │                                       │
│         ▼                                       │
│  ┌──────────────────────────────────────────┐   │
│  │          Knowledge Base                   │   │
│  │  ┌─────────────────┐  ┌────────────────┐ │   │
│  │  │ .opencode/      │  │ Memory Graph    │ │   │
│  │  │ instructions/   │  │ (cross-session) │ │   │
│  │  │                 │  │                 │ │   │
│  │  │ project-        │  │ Entity relations│ │   │
│  │  │   context.md    │  │ Observations    │ │   │
│  │  │ lessons.md      │  │ Patterns        │ │   │
│  │  │ patterns.md     │  │ Decisions       │ │   │
│  │  │ error-          │  │                 │ │   │
│  │  │   solutions.md  │  │                 │ │   │
│  │  └─────────────────┘  └────────────────┘ │   │
│  └──────────────────────────────────────────┘   │
│         ▲                                       │
│         │                                       │
│  ┌──────┴───────┐    ┌────────────────────┐    │
│  │  Feedback     │    │  Token Optimizer    │    │
│  │  Accumulator  │───▶│                     │    │
│  │               │    │  Context windowing  │    │
│  │  stdout/stderr│    │  Fact blocks        │    │
│  │  exit codes   │    │  Reference files    │    │
│  │  errors       │    │  Outcome-driven ctx │    │
│  └──────────────┘    └────────────────────┘    │
│                                                │
└───────────────────────────────────────────────┘
```

### 8.3 Components

#### 8.3.1 opencode.json Agent Registry
Central configuration file that:
- Defines agents with specialized roles (planner, tdd, reviewer, security, e2e)
- Maps commands to agents via `opencode.json` `"commands"` and `"agents"` sections
- Configures MCP servers for tool access (database, Sentry, etc.)
- Declares skill associations for domain expertise
- Enables/disables agents per session context

#### 8.3.2 `.opencode/commands/` - Enhanced Commands
Each command file includes:
- **Agent assignment** via `agent:` frontmatter field
- **Standardized output format** for feedback parsing (success/failure indicators)
- **Error capture hooks** - instructions to log errors to feedback accumulator
- **Example usage** with expected output patterns

| Command | Agent | Purpose |
|---------|-------|---------|
| `/plan` | planner | Create implementation plans |
| `/tdd` | tdd | Test-driven development |
| `/code-review` | reviewer | Review code changes |
| `/security` | security | Security review |
| `/e2e` | e2e | Run E2E tests |
| `/build-fix` | builder | Fix build errors |

#### 8.3.3 `.opencode/instructions/` - Knowledge Base
Structured markdown files that form the agent's long-term memory:

| File | Purpose |
|------|---------|
| `project-context.md` | Project overview, tech stack, architecture, conventions |
| `lessons.md` | Lessons learned from bugs, mistakes, and optimizations |
| `patterns.md` | Recurring code patterns, idioms, and best practices |
| `error-solutions.md` | Known error patterns and their proven fixes |

Each instruction file follows a fact-block format optimized for token efficiency:
```markdown
<!-- BEGIN:section-name -->
**Fact:** Concise, standalone statement
**Context:** When/why this applies
**Source:** File:line reference
<!-- END:section-name -->
```

#### 8.3.4 Memory Graph (Cross-Session Persistence)
Uses the knowledge graph memory system to:
- Store entities (features, components, decisions) with typed relations
- Record observations (outcomes, metrics, patterns) attached to entities
- Query related context across sessions via graph traversal
- Maintain relations like `implements`, `depends_on`, `fixes`, `implements`

### 8.4 Self-Learning Loop

```
  ┌─────────┐     ┌──────────┐     ┌───────────────┐
  │ Execute │────▶│ Capture  │────▶│ Extract        │
  │ Task    │     │ Outcome  │     │ Patterns       │
  └─────────┘     └──────────┘     └───────┬───────┘
       ▲                                    │
       │                                    ▼
  ┌────┴──────┐     ┌──────────┐     ┌───────────────┐
  │ Optimize  │     │ Update   │◀────│ Store to      │
  │ Prompts   │◀────│ Knowledge│     │ Knowledge     │
  │           │     │          │     │ Base          │
  └───────────┘     └──────────┘     └───────────────┘
```

**Loop stages:**
1. **Execute** - Agent runs a task via command routing
2. **Capture** - Feedback accumulator collects stdout, stderr, exit code, errors
3. **Extract** - LLM analyzes captured output for patterns, root causes, solutions
4. **Store** - Findings persisted to `.opencode/instructions/` and Memory Graph
5. **Update** - Instruction files updated with new patterns and error solutions
6. **Optimize** - Future prompts reference learned patterns, reducing trial-and-error

### 8.5 Token Optimization Strategy

| Technique | Description | Savings |
|-----------|-------------|---------|
| **Context Windowing** | Load only relevant instruction sections via `<!-- BEGIN: -->` markers | 30-50% |
| **Fact Blocks** | Single-line facts instead of prose paragraphs | 40-60% |
| **Reference Files** | Store detailed docs in files, reference by path in prompts | Variable |
| **Outcome-Driven Context** | Only load knowledge relevant to current task type | 20-40% |
| **Memory Graph Queries** | Fetch precise observations instead of entire documents | 50-70% |

### 8.6 Implementation Phases

#### Phase 1: Foundation (Week 1)
- [ ] Create `.opencode/instructions/` directory with initial files
- [ ] Define agent registry in `opencode.json`
- [ ] Implement command routing pattern
- [ ] Set up Memory Graph entities

#### Phase 2: Knowledge Base (Week 2)
- [ ] Populate `project-context.md` from existing docs
- [ ] Migrate `LESSONS.md` content to instruction format
- [ ] Create `patterns.md` with recurring code patterns
- [ ] Create `error-solutions.md` from known fixes

#### Phase 3: Feedback Loop (Week 3)
- [ ] Add standardized output format to all commands
- [ ] Implement feedback capture logic
- [ ] Create pattern extraction prompt
- [ ] Wire knowledge updates into command completion

#### Phase 4: Optimization (Week 4)
- [ ] Implement context windowing markers in instruction files
- [ ] Convert verbose docs to fact-block format
- [ ] Add Memory Graph query integration
- [ ] Measure and optimize token usage

#### Phase 5: Maturity (Week 5+)
- [ ] Cross-session learning verification
- [ ] Self-healing command definitions
- [ ] Performance metrics dashboard
- [ ] Automated knowledge pruning

### 8.7 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Token usage per session | 30% reduction | Compare sessions with/without orchestrator |
| Error recurrence | <10% | Known errors should not repeat |
| Knowledge base accuracy | >90% | Reviewed by human every 10 sessions |
| Command success rate | >85% | Exit code 0 on first attempt |
| Knowledge relevance | >70% | Queried context is actually used in generation |
