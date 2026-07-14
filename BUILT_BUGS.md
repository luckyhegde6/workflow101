# Built & Bugs Analysis

> Generated: July 14, 2026
> Visual workflow analysis of all 12 pages and 7 API endpoints

## Testing Summary

| Page | Status | Console Errors | Notes |
|------|--------|---------------|-------|
| Dashboard `/` | ✅ | 0 | 4 ERROR workflows displayed |
| Config `/config` | ✅ | 0 | 6 workflow types, 4-step wizard |
| Approvals `/approvals` | ✅ | 0 | Empty state, tabs work |
| Cron `/cron` | ✅ | 0 | Trigger worker works |
| Observability `/observability` | ✅ | 0 | Dashboard renders |
| Logs `/logs` | ✅ | 0 | Empty state |
| Docs `/docs` | ✅ | 1 | Known Swagger UI UNSAFE warning |
| About `/about` | ✅ | 0 | Static page |
| Contact `/contact` | ✅ | 0 | Static page |
| Workflow Status `/workflow-status` | ✅ | 0 | Real-time table |
| Files `/files` | ✅ | 0 | File management UI |
| Queue `/queue` | ✅ | 0 | Queue UI |

## API Endpoints

| Endpoint | Status | Response |
|----------|--------|----------|
| `GET /api/dbos` | ✅ | DBOS Worker running |
| `GET /api/workflows` | ✅ | 5 workflows (all ERROR) |
| `GET /api/approvals` | ✅ | Empty array |
| `GET /api/docs` | ✅ | Valid OpenAPI spec |
| `GET /api/logs` | ✅ | Empty logs |
| `GET /api/queue/workflow` | ❌ | **Empty body, JSON parse error** |
| `GET /api/schedules` | ✅ | Empty array |

## Bugs

### [P1] ~~Bug: `/api/queue/workflow` GET returns empty body~~ ✅ **FIXED**

- **Severity**: Medium
- **File**: `app/api/queue/workflow/route.ts`
- **Fix**: Added `GET()` handler returning `405 Method Not Allowed` with `{ success: false, error: '...' }` JSON
- **Test**: `fetch('/api/queue/workflow')` now returns 405 with clear error message

### [P2] ~~Bug: Config wizard step 2 has no validation feedback~~ ✅ **FIXED**

- **Severity**: Medium
- **File**: `app/config/page.tsx`
- **Fix**: Added `validationError` + `showValidation` state. When user clicks Next with empty params on step 2, a yellow warning banner appears: "Please configure at least one parameter for this workflow before proceeding." Auto-clears when user types.
- **Test**: `data-testid="validation-error"` available for verification

### [P2] ~~Bug: Retry workflow has no success/failure feedback~~ ✅ **FIXED**

- **Severity**: Medium
- **File**: `app/page.tsx`
- **Fix**: Added `notification` state with green/red toast after retry attempt. Auto-dismiss after 4s. Dismiss button included.
- **Test**: `data-testid="notification-toast"` available for verification

### [P3] ~~Bug: triggerWorker server action uses relative URL~~ ✅ **FIXED**

- **Severity**: Low
- **File**: `app/actions.ts`
- **Fix**: Construct absolute URL using `process.env.VERCEL_URL` or `process.env.NEXT_PUBLIC_VERCEL_URL`, fallback to `http://localhost:3000`

### [P3] ~~Bug: Config wizard Preview vs Submit confusion~~ ✅ **FIXED**

- **Severity**: Low
- **File**: `app/config/page.tsx`
- **Fix**: Renamed "Preview" to "Quick Submit". Hidden on Step 4 where the "Submit" button does the same thing.

### [P3] ~~Bug: Workflow card timestamps use absolute time format~~ ✅ **FIXED**

- **Severity**: Low
- **File**: `app/components/WorkflowCard.tsx`
- **Fix**: Added relative time formatting: "Just now", "Xm ago", "Xh ago" for < 24h, absolute date for older

## UX Improvements

### [Enhancement] Missing data-testid attributes

- Status filter buttons in `StatusFilter.tsx` lack `data-testid` attributes
- ApprovalList component may lack test selectors
- Cron page trigger result message lacks `data-testid`

### [Enhancement] No auth/login mechanism

- The entire app has no authentication layer
- Appropriate for demo/internal but worth noting

### [Enhancement] DBOS-dependent features show no graceful offline state

- When DBOS/PostgreSQL is unavailable, `/api/dbos` returns 503
- Dashboard silently shows error state
- No retry/reconnect UI for DBOS connection failures

## Workflow Analysis

### Config Wizard Flow (all 6 workflow types tested)

| Workflow Type | Step 1 | Step 2 | Step 3 | Step 4 | Preview | Notes |
|--------------|--------|--------|--------|--------|---------|-------|
| Example (`exampleWorkflow`) | ✅ | ✅ | ✅ | ✅ | ✅ | Message param |
| Email (`emailNotificationWorkflow`) | ✅ | ✅ | ✅ | ✅ | ✅ | To, Subject, Body |
| Data Processing (`dataProcessingWorkflow`) | ✅ | ✅ | ✅ | ✅ | ✅ | Data ID, Operation |
| User Onboarding (`onboardingWorkflow`) | ✅ | ✅ | ✅ | ✅ | ✅ | User ID, Email, Name |
| Scheduled Report (`scheduledReportWorkflow`) | ✅ | ✅ | ✅ | ✅ | ✅ | Report Type, Recipients |
| Webhook Handler (`webhookHandlerWorkflow`) | ✅ | ✅ | ✅ | ✅ | ✅ | Event Type, Payload |

All schedule types tested: Immediate ✅, Scheduled ✅, Recurring/Cron ✅

### Visual Screenshots Captured

Located in `workflow-analysis/` directory:
1. `01-dashboard-initial.png` - Main dashboard with workflow list
2. `03-config-step1-select.png` - Config wizard step 1
3. `04-after-submit.png` - Dashboard after workflow submission
4. `05-approvals.png` - Approvals page
5. `06-cron.png` - Cron & Worker Control page
6. `07-observability.png` - Monitoring dashboard
7. `08-logs.png` - Logs page
8. `09-docs.png` - API docs with Swagger UI
9. `10-about.png` - About page
10. `11-contact.png` - Contact page
11. `12-workflow-status.png` - Workflow status table
12. `13-files.png` - Files page
