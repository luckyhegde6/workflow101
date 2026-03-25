# Everything Workflows

A durable workflow system powered by **DBOS** + **Vercel** + **Next.js**.

## Features

- **6 Workflow Types**: Example, Email, Data Processing, Onboarding, Scheduled Report, Webhook
- **AI Workflows**: Sentiment analysis, summarization, categorization, entity extraction
- **Workflow Scheduling**: Immediate, scheduled, or recurring with cron support
- **Human-in-the-Loop**: Approve/reject pending workflow requests
- **Step-by-Step Wizard**: 4-step workflow configuration (Select → Configure → Schedule → Confirm)
- **Confirmation Popup**: Review before submitting workflows
- **Audit Logging**: Track all workflow operations and state changes
- **Dashboard UI**: Real-time workflow monitoring with status filtering
- **Configuration Page**: Configure and run workflows with custom parameters
- **Cron Monitoring**: Monitor and control worker execution
- **API Documentation**: Interactive Swagger UI at `/docs`
- **Observability**: Workflow timeline, activity log, worker status monitoring, DBOS inspect commands, Supabase integration
- **Logs Page**: View application logs, HTTP logs, and database logs at `/logs`
- **Error Handling**: Retry with exponential backoff, circuit breaker, rate limiter
- **Workflow Chaining**: Compose workflows together
- **HTTP Logging**: Middleware for logging all HTTP requests
- **Database Logging**: Middleware for logging all database queries
- **140+ Tests**: Unit, integration, and E2E coverage

## Quick Start

### 1. Configure Database

The system supports both local PostgreSQL (Docker) and Supabase remote database:

```bash
# Option A: Use local PostgreSQL (default)
USE_REMOTE=false
ENVIRONMENT=local

# Option B: Use Supabase (remote)
USE_REMOTE=true
ENVIRONMENT=production
```

### 2. Start Database

```bash
# Start PostgreSQL with Docker (for local mode)
npm run db:start

# Or on Linux/Mac
npm run db:up
```

### 3. Initialize DBOS Schema

```bash
npm run dbos:init
```

### 4. Start Development

```bash
# Single command (DB + init + dev)
npm run local

# Or separate
npm run dbos:init
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run local` | Start DB, init DBOS, and dev server |
| `npm run dev` | Development server at localhost:3000 |
| `npm run build` | Build for production |
| `npm run db:start` | Start PostgreSQL (cross-platform) |
| `npm run db:up` | Start PostgreSQL (Linux/Mac) |
| `npm run db:down` | Stop PostgreSQL |
| `npm run dbos:init` | Initialize DBOS tables |
| `npm test` | Run all unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run lint` | Run ESLint |

## Pages

| Page | Description |
|------|-------------|
| `/` | Main dashboard with workflow list |
| `/config` | 4-step workflow configuration wizard |
| `/cron` | Monitor and control worker execution |
| `/docs` | Interactive API documentation (Swagger UI) |
| `/observability` | Workflow timeline, activity log, worker status |
| `/logs` | Application logs, HTTP logs, database logs |
| `/about` | About the project, features, and tech stack |
| `/contact` | Contact form and support information |

## Workflow Types

### Standard Workflows
1. **Example** - Basic test workflow
2. **Email** - Send email notifications
3. **Data Processing** - Process and transform data with batch support
4. **User Onboarding** - Onboard new users
5. **Scheduled Report** - Generate scheduled reports
6. **Webhook Handler** - Process webhook events

### AI Workflows (app/lib/ai-workflow.ts)
- **aiAnalysisWorkflow** - Single content analysis (sentiment, summary, categorize, extract)
- **aiBatchAnalysisWorkflow** - Batch processing multiple items
- **aiChainAnalysisWorkflow** - Multi-step analysis pipeline

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dbos` | GET | Trigger DBOS worker |
| `/api/workflows` | GET | List all workflows |
| `/api/workflows` | POST | Enqueue a new workflow |
| `/api/workflows/[id]` | GET | Get workflow status |
| `/api/workflows/[id]/retry` | POST | Retry failed workflow |
| `/api/schedules` | GET | List scheduled workflows |
| `/api/schedules` | POST | Create scheduled workflow |
| `/api/schedules/[id]` | DELETE | Cancel scheduled workflow |
| `/api/audit` | GET | Get audit logs |
| `/api/logs` | GET | Get application/HTTP/database logs |
| `/api/logs` | DELETE | Clear logs |
| `/api/docs` | GET | Get OpenAPI specification |

## Logging

The app includes comprehensive logging for debugging and monitoring:

### HTTP Logging (app/lib/http-logging.ts)
- Logs all HTTP requests with method, path, status, duration
- Tracks request/response bodies
- Provides statistics by method and status code

### Database Logging (app/lib/db-logging.ts)
- Logs all database queries with SQL, parameters, duration
- Tracks slow queries (configurable threshold)
- Provides transaction logging

### Application Logging (app/lib/logging.ts)
- Logs workflow events with context
- Supports log levels: debug, info, warn, error
- Provides filtering and search
| `/api/docs` | GET | Get OpenAPI specification |

## Environment Variables

```env
# Database (supports multiple formats)
DBOS_SYSTEM_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflow101
POSTGRES_URL_NON_POOLING=postgresql://postgres:postgres@localhost:5432/workflow101
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflow101
```

### Production

For production, use Supabase, Neon, or any PostgreSQL provider:

```env
DBOS_SYSTEM_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?sslmode=require
```

## Vercel Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

The app includes `vercel.json` with cron configuration that runs the worker every minute.

## Project Structure

```
app/
├── api/
│   ├── audit/route.ts          # Audit logs endpoint
│   ├── dbos/route.ts          # DBOS worker endpoint
│   ├── docs/route.ts          # OpenAPI spec
│   ├── logs/route.ts          # Logs endpoint
│   ├── schedules/
│   │   ├── route.ts            # List/create schedules
│   │   └── [id]/route.ts      # Cancel schedule
│   └── workflows/
│       ├── route.ts            # List/enqueue workflows
│       └── [workflowId]/route.ts
├── components/
│   ├── ApprovalCard.tsx
│   ├── ApprovalList.tsx
│   ├── Dashboard.tsx
│   ├── EnqueueWorkflowButton.tsx
│   ├── Navbar.tsx
│   ├── WorkflowCard.tsx
│   ├── WorkflowList.tsx
│   ├── WizardNavigation.tsx
│   └── ConfirmationPopup.tsx
├── lib/
│   ├── approvals.ts         # Human-in-the-loop approvals
│   ├── services.ts          # Supabase service layer
│   ├── workflow-types.ts    # TypeScript types
│   └── ... (other utilities)
├── utils/
│   └── supabase/
│       ├── client.ts        # Browser client
│       ├── server.ts        # Server client
│       └── middleware.ts    # Middleware client
├── supabase/
│   └── migrations/          # Database migrations
├── about/page.tsx           # About page
├── config/page.tsx          # Workflow configuration with scheduling
├── contact/page.tsx         # Contact page
├── cron/page.tsx            # Cron monitoring
├── docs/page.tsx            # API documentation
├── logs/page.tsx            # Logs viewer
├── observability/page.tsx   # Observability dashboard
└── page.tsx                 # Main dashboard

.opencode/
├── opencode.json              # Agent configuration
├── agents/                   # Agent prompts
├── commands/                 # Agent commands
├── plugins/                  # Plugin hooks
└── skills/                   # Domain skills

tests/
├── unit/                     # Unit tests (11 test files)
├── integration/              # Integration tests
└── e2e/                     # Playwright E2E tests
```

## Testing

```bash
# All unit tests
npm test

# Unit tests only
npm run test:unit

# API tests only
npm run test:api

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# With coverage
npm run test:coverage
```

### Test Coverage

- **140+ tests** across unit, integration, and E2E
- Unit tests for: templates, retry logic, chaining, progress, errors, AI workflows, webhook
- Integration tests for: workflow patterns, API endpoints
- Component tests for: Dashboard, WorkflowCard, WorkflowList, EnqueueWorkflowButton

## OpenCode Agent

The project includes OpenCode agent configuration for enhanced development:

### Available Agents
- **planner** - Create implementation plans
- **tdd-guide** - Test-driven development
- **code-reviewer** - Review code quality
- **security-reviewer** - Security audits
- **build-error-resolver** - Fix build errors
- **e2e-runner** - Run E2E tests
- **workflow-expert** - DBOS workflow patterns

### Agent Commands
```bash
/plan <feature>      # Create implementation plan
/tdd <feature>      # TDD workflow
/code-review        # Review code changes
/security           # Security review
/build-fix          # Fix build errors
/e2e                # Run E2E tests
```

### Skills
- tdd-workflow, security-review, coding-standards
- workflow-patterns, dbos-integration, backend-patterns
- frontend-patterns, api-design, eval-harness
- verification-loop, e2e-testing

## Learn More

- [DBOS Documentation](https://docs.dbos.dev)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Next.js](https://nextjs.org)
- [useworkflow.dev](https://useworkflow.dev)
