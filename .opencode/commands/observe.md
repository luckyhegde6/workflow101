---
description: Observability checker for Sentry, metrics, logs, and monitoring
agent: observability
subtask: true
---

# Observability Check Command

Verify and monitor application health through Sentry, metrics, logging, and tracing.

## Instructions

### 1. Sentry Check
- Verify Sentry is configured in `app/lib/sentry-metrics.ts`
- Check Sentry environment variables are set:
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
- Verify error tracking captures:
  - API errors (4xx, 5xx)
  - Unhandled exceptions
  - Promise rejections
- Check metrics are being sent:
  - `workflow_status_count`
  - `workflow_runtime_ms`
  - `workflow_queue_depth`
  - `api_response_time_ms`
  - `database_operation_time_ms`

### 2. Logging Check
- Verify HTTP logging middleware works: `app/lib/http-logging.ts`
- Verify database logging works: `app/lib/db-logging.ts`
- Check log endpoints:
  - `GET /api/logs?type=application`
  - `GET /api/logs?type=http`
  - `GET /api/logs?type=database`
- Verify log levels (info, warn, error) are distinct
- Check no sensitive data in logs

### 3. Tracing Check
- Verify OpenTelemetry setup: `instrumentation.ts`
- Check distributed tracing is configured
- Verify Vercel OTEL integration

### 4. Performance Check
- Check API response times (target < 500ms)
- Check database query times (target < 100ms)
- Check workflow execution times
- Look for N+1 query patterns

### 5. Health Check
- `GET /api/health` — Should return 200
- `GET /api/dbos` — Should return DBOS status
- Check PostgreSQL connection: `npm run db:config`

## Outcome Capture
- [ ] Sentry configured and tracking errors
- [ ] Metrics are being collected
- [ ] Logging captures HTTP and DB operations
- [ ] OpenTelemetry tracing active
- [ ] Performance targets met
- [ ] Health endpoints respond correctly
