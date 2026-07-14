# Lessons Learned

## Agent Optimizations

### OpenCode Agent Setup
- Use specialized agents for domain-specific tasks
- Define clear commands with templates
- Include skills for common patterns

### Testing
- Mock DBOS SDK functions properly in tests
- Use `act()` for async state updates in React tests
- Test error paths, not just happy paths
- 80%+ coverage target for critical code

### Code Quality
- Always create new objects, never mutate (immutability)
- Small files < 400 lines
- Descriptive naming over comments
- Error handling at every level

## Bug Fixes

### Testing Library
- `@testing-library/react` exports `screen`, `fireEvent`, `waitFor`
- Use `async act()` for async user interactions
- Wrap click handlers in act() to avoid warnings

### DBOS Patterns
- `"use workflow"` must be a string literal, not template
- `"use step"` for step functions
- Use `waitUntil` in Vercel route handlers

### Next.js
- Dynamic imports require await
- Server components can't use hooks
- 'use client' directive for interactive components
- Dynamic import with `{ ssr: false }` prevents client components from importing Node.js built-ins
- Turbopack `resolveAlias` can redirect browser-bundled modules to CJS alternatives

### E2E Testing
- Use `data-testid` attributes for selectors, never `text=` for non-unique text
- `waitForLoadState('domcontentloaded')` is safer than `networkidle` (latter hangs on SSE/WebSocket)
- When testing fallback behavior, ensure timeouts are short (<10s) to avoid test hangs

### API Resilience
- DBOS initialization should be lazy (on first request) not at module top-level
- Wrap external service calls (DB, queue) with timeout wrappers
- Return fallback/error responses instead of letting endpoints hang indefinitely
- Server actions should always have error boundaries and return structured error objects

## Visual Workflow Analysis (July 2026)
- All 12 pages render without console errors (1 pre-existing Swagger UI UNSAFE warning)
- Config wizard supports 6 workflow types across 4 steps with 3 schedule types
- Status filter buttons lack `data-testid` attributes for E2E testing
- API endpoint `/api/queue/workflow` returns empty body on GET (POST-only handler)
- Server actions that use `fetch()` with relative URLs may fail in edge contexts
- Retry workflow operations should provide user-visible feedback (toast/notification)
- Config wizard Step 2 validation blocks Next button without explanation
- Dashboard shows predefined workflows (all ERROR from earlier test runs) not user-submitted
- Workflow status detail modal opens correctly on card click
- Enqueue button navigates to config with correct `?workflow=` query param

## E2E Testing Lessons (Refined)
- `waitUntil: 'load'` is needed when testing button clicks that trigger SPA navigation (React hydration must complete first)
- `waitUntil: 'domcontentloaded'` fires before React event handlers are attached
- For SPA navigation, `waitForFunction(() => location.pathname.includes(...))` is more reliable than `waitForURL`
- Running isolated test (1 worker) vs full suite (4 workers) can expose timing-dependent flakiness
- Polling assertions (toPass) work but `waitForFunction` with explicit polling interval is more reliable

## Security
- Never hardcode secrets - use env vars
- Validate all user input with Zod/schemas
- Parameterized queries only
- Sanitize HTML to prevent XSS
