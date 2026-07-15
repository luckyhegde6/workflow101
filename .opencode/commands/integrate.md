---
description: Integration testing agent for API, database, and service orchestration
agent: integrator
subtask: true
---

# Integration Test Command

Write and run integration tests for API endpoints, database operations, and service orchestration.

## Instructions

### 1. API Integration Tests
- Test all API route handlers in `app/api/`
- Cover:
  - HTTP methods (GET, POST, PUT, DELETE)
  - Status codes (200, 201, 400, 401, 403, 404, 500)
  - Request validation (missing fields, invalid types)
  - Response format (JSON structure)
  - Error responses
- Use fetch or supertest for HTTP calls

### 2. Database Integration Tests
- Test database operations in `app/lib/`
- Cover:
  - CRUD operations
  - Query edge cases (empty results, pagination)
  - Transaction rollback
  - Connection errors
- Use test database or mocking

### 3. Workflow Integration Tests
- Test DBOS workflow execution
- Cover:
  - Workflow start and completion
  - Step execution and retry
  - Queue enqueue/dequeue
  - Error handling in workflows
- Test the full orchestration pipeline

### 4. Service Integration Tests
- Test service layer in `app/lib/services.ts`
- Cover:
  - Business logic flows
  - Error propagation
  - Data consistency across operations

### 5. Run Tests
- `npm test` — Run all tests
- Verify all integration tests pass
- Check for slow tests (>500ms)

## Outcome Capture
- [ ] API endpoint tests cover all routes
- [ ] Database operation tests pass
- [ ] Workflow execution tests pass
- [ ] Service layer tests cover business logic
- [ ] All tests pass with no regressions
