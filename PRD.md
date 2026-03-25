# PRD - Everything Workflow System

**Version:** 0.1.0  
**Date:** 2026-03-24  
**Status:** Planning

## 1. Concept & Vision

Build a comprehensive "everything workflows" system that handles all types of background processing needs. The system should be:
- **Universal** - Handle email/SMS, data processing, onboarding, scheduled jobs, webhooks
- **Reliable** - Durable execution with automatic retries
- **Observable** - Real-time status tracking
- **Scalable** - Deploy to Vercel with cron triggers

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
                           │
                           ▼
                    ┌─────────────┐
                    │  Vercel     │
                    │  Worker     │
                    │  (Cron)     │
                    └─────────────┘
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
