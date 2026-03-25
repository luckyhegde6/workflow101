# Everything Workflows

A durable workflow system powered by **DBOS** + **Vercel** + **Next.js**.

## Features

- **6 Workflow Types**: Example, Email, Data Processing, Onboarding, Scheduled Report, Webhook
- **AI Workflows**: Sentiment analysis, summarization, categorization, entity extraction
- **Workflow Scheduling**: Immediate, scheduled, or recurring with cron + queue support
- **Vercel Queues**: Reliable message processing with automatic retries
- **Human-in-the-Loop**: Approve/reject pending workflow requests
- **Step-by-Step Wizard**: 4-step workflow configuration (Select → Configure → Schedule → Confirm)
- **Confirmation Popup**: Review before submitting workflows
- **Audit Logging**: Track all workflow operations and state changes
- **Dashboard UI**: Real-time workflow monitoring with status filtering
- **Queue Monitoring**: View queue configuration and topics at `/queue`
- **Cron Monitoring**: Monitor and control worker execution
- **API Documentation**: Interactive Swagger UI at `/docs`
- **Observability**: Workflow timeline, activity log, worker status monitoring, DBOS inspect commands, Supabase integration
- **Logs Page**: View application logs, HTTP logs, and database logs at `/logs`
- **Error Handling**: Retry with exponential backoff, circuit breaker, rate limiter
- **Workflow Chaining**: Compose workflows together
- **HTTP Logging**: Middleware for logging all HTTP requests
- **Database Logging**: Middleware for logging all database queries
- **File Storage**: Vercel Blob integration for workflow file processing
- **Analytics**: Vercel Analytics for web analytics
- **Tracing**: OpenTelemetry integration with Sentry for distributed tracing
- **150+ Tests**: Unit, integration, and E2E coverage

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
| `/queue` | Queue monitoring and configuration |
| `/files` | File upload with Vercel Blob |
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
| `/api/cron/daily` | GET | Daily cron - collects scheduled workflows |
| `/api/audit` | GET | Get audit logs |
| `/api/logs` | GET | Get application/HTTP/database logs |
| `/api/logs` | DELETE | Clear logs |
| `/api/docs` | GET | Get OpenAPI specification |

## Vercel Queues

The system uses Vercel Queues for reliable workflow processing, addressing the daily cron limitation on free tier.

### How It Works

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Cron      │───►│  Collect   │───►│  Publish to    │───►│  Queue      │
│  (6 AM)     │    │  Due       │    │  workflows     │    │  Consumer   │
└─────────────┘    │  Workflows │    │  queue         │    │  (process) │
                   └─────────────┘    └─────────────────┘    └─────────────┘
```

### Queue Topics

| Topic | Description |
|-------|-------------|
| `workflows` | Main workflow execution queue |
| `scheduled-workflows` | Delayed workflow queue |
| `email-notifications` | Email notification queue |
| `approvals` | Approval queue |

### Queue Configuration (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 6 * * *"
    }
  ],
  "functions": {
    "app/api/queue/workflow/route.ts": {
      "experimentalTriggers": [
        {
          "type": "queue/v2beta",
          "topic": "workflows",
          "retryAfterSeconds": 60
        }
      ]
    }
  }
}
```

### Free Tier Limitations

- Cron jobs: **once per day**
- Queue sends: **4,000/month**
- Retention: **24 hours**

### Publishing to Queues

```typescript
import { publishWorkflow } from './lib/queue-producer';

// Publish a workflow
await publishWorkflow('exampleWorkflow', { param: 'value' }, {
  source: 'manual',
  idempotencyKey: 'unique-key-123'
});
```

See [`/queue`](/queue) page for more details.

## Vercel Blob

The system includes Vercel Blob integration for file processing workflows.

### Features

- **Server-side uploads**: Upload files from API routes using `put()`
- **Client-side uploads**: Direct browser-to-Blob uploads for better performance
- **Progress tracking**: Monitor upload progress in real-time
- **Multipart uploads**: Automatic support for large files
- **Private storage**: Files are private by default, requiring authentication

### Usage

```typescript
import { uploadBlob, listBlobs, deleteBlob } from './lib/blob-utils';

// Upload a file
const result = await uploadBlob(
  'workflows/workflow-123/input.pdf',
  fileBuffer,
  'application/pdf',
  'private'
);

// List workflow files
const files = await listBlobs('workflows/workflow-123/');

// Delete files
await deleteBlob(result.url);
```

### Client-side Upload

```typescript
import { upload } from '@vercel/blob/client';

const blob = await upload(file.name, file, {
  access: 'private',
  handleUploadUrl: '/api/blob',
  onUploadProgress: (progress) => {
    console.log(`${progress.percentage}% uploaded`);
  },
});
```

See [`/files`](/files) page for a complete example.

### API Route

The upload endpoint is at `/api/blob`:

```typescript
// app/api/blob/route.ts
import { handleUpload } from '@vercel/blob/client';

export async function POST(request: Request) {
  const blob = await handleUpload({
    request,
    body: await request.json(),
    onBeforeGenerateToken: async (pathname) => {
      // Add authentication/authorization here
      return {};
    },
    onUploadCompleted: async ({ blob }) => {
      console.log('Uploaded:', blob.url);
    },
  });
  return Response.json(blob);
}
```

## Observability

### OpenTelemetry Tracing

The app includes OpenTelemetry tracing using `@vercel/otel`:

```typescript
// instrumentation.ts
import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: 'workflow101' });
}
```

Traces are automatically exported to connected observability providers.

### Vercel Analytics

Web analytics is enabled in the root layout:

```typescript
import { Analytics } from '@vercel/analytics/react';

// In layout.tsx
<Analytics />
```

### Sentry Integration

Sentry is configured for error tracking and distributed tracing:

- **DSN**: Configured via `NEXT_PUBLIC_SENTRY_DSN`
- **Auth Token**: For CI/CD deployments via `SENTRY_AUTH_TOKEN`
- **Tracing**: OTLP endpoint via `SENTRY_OTLP_TRACES_URL`

### Environment Variables

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="your-auth-token"
SENTRY_ORG="your-org"
SENTRY_OTLP_TRACES_URL="https://.../otlp/v1/traces"
SENTRY_PROJECT="your-project"
```

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

### 1. Link to Vercel

```bash
# Login to Vercel
npx vercel login

# Link project
npx vercel link

# Add environment variables
npx vercel env add ENVIRONMENT
npx vercel env add USE_REMOTE
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
npx vercel env add DATABASE_REMOTE
npx vercel env add DIRECT_URL
npx vercel env add SUPABASE_DB_PASSWORD
```

### 2. Required Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `ENVIRONMENT` | `production` | Set to production for Vercel |
| `USE_REMOTE` | `true` | Use remote database |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `sb_xxx` | Supabase anon key |
| `DATABASE_REMOTE` | Connection string | Supabase connection pooler |
| `DIRECT_URL` | Connection string | Supabase direct connection |
| `SUPABASE_DB_PASSWORD` | Password | Database password |

### 3. Deploy

```bash
# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod
```

### 4. Create Blob Store

1. Go to Vercel Dashboard → Storage
2. Create New Database → Blob
3. Name: `workflow-files`
4. Access: Private
5. Copy the `BLOB_READ_WRITE_TOKEN` to environment variables

### 5. Configure Queues

The `vercel.json` includes queue triggers for:
- `workflows` - Main workflow execution
- `scheduled-workflows` - Delayed workflow queue

Free tier limits:
- Cron: Once per day
- Queue sends: 4,000/month
- Retention: 24 hours

### vercel.json Configuration

```json
{
  "$schema": "https://vercel.com/schemas/json",
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 6 * * *"
    }
  ],
  "functions": {
    "app/api/queue/workflow/route.ts": {
      "triggers": [
        {
          "type": "queue",
          "topic": "workflows",
          "retryAfterSeconds": 60
        }
      ]
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

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

### E2E Testing with Playwright CLI

The project supports [Playwright CLI](https://github.com/microsoft/playwright-cli) for interactive browser automation.

#### Installation

```bash
# Install globally
npm install -g @playwright/cli@latest

# Install skills (for coding agents)
npx playwright-cli install --skills

# Verify installation
playwright-cli --version
```

#### Quick Start

```bash
# Open browser to the app
npx playwright-cli open http://localhost:3000

# Open in headed mode (visible browser)
npx playwright-cli open http://localhost:3000 --headed

# Navigate to a page
npx playwright-cli goto http://localhost:3000/config

# Take a screenshot
npx playwright-cli screenshot
```

#### Common Commands

```bash
# Navigation
npx playwright-cli open <url>              # Open browser
npx playwright-cli goto <url>             # Navigate to URL
npx playwright-cli go-back                # Go back
npx playwright-cli reload                  # Reload page

# Interaction
npx playwright-cli click <selector>      # Click element
npx playwright-cli type <text>             # Type text
npx playwright-cli fill <selector> <text>  # Fill input
npx playwright-cli select <selector> <val> # Select dropdown
npx playwright-cli check <selector>       # Check checkbox

# Screenshot & Snapshot
npx playwright-cli screenshot              # Take screenshot
npx playwright-cli snapshot                # Get page structure

# Debugging
npx playwright-cli console                # View console logs
npx playwright-cli network                # View network requests

# Session Management
npx playwright-cli list                   # List all sessions
npx playwright-cli close-all              # Close all browsers
```

#### Example Workflows

```bash
# Test the workflow wizard
npx playwright-cli open http://localhost:3000
npx playwright-cli snapshot               # Get element refs
npx playwright-cli click "Configure & Run Workflow"
npx playwright-cli screenshot            # Save screenshot

# Test login flow
npx playwright-cli open http://localhost:3000/login
npx playwright-cli type "demo@tradenext6.app"
npx playwright-cli type "demo123"
npx playwright-cli click "Login"
npx playwright-cli screenshot

# Test with specific session
npx playwright-cli -s=workflow-test open http://localhost:3000
npx playwright-cli list                   # Shows session info
```

#### Sessions

Playwright CLI preserves browser state between calls:

```bash
# Open with persistent profile
npx playwright-cli open http://localhost:3000 --persistent

# Use named session
npx playwright-cli -s=my-session open http://localhost:3000

# List all sessions
npx playwright-cli list

# Close specific session
npx playwright-cli -s=my-session close

# Delete session data
npx playwright-cli -s=my-session delete-data
```

#### Configuration

Create `.playwright/cli.config.json` for project defaults:

```json
{
  "browser": {
    "browserName": "chromium",
    "isolated": false,
    "userDataDir": ".playwright/sessions"
  },
  "outputDir": ".playwright/output",
  "outputMode": "file",
  "console": {
    "level": "info"
  }
}
```

#### For Coding Agents

The installed skills enable agents to use Playwright CLI:

```bash
# Agent command example
Test the login flow using playwright-cli.
Check playwright-cli --help for available commands.
```

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
