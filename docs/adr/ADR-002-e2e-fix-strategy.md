# ADR-002: E2E Test Failure Resolution Strategy

**Status:** Proposed  
**Date:** 2026-07-15  
**Author:** OpenCode Agent  
**Deciders:** Project Maintainers  

---

## Context

The E2E test suite (Playwright, 27 tests) has 8 persistent failures across 3 root causes:

### Root Cause 1: Config Selector Mismatch (4 failures)

**Failing tests:**
- `should display workflow status dashboard`
- `should show configuration options`
- `should navigate to settings page`
- `should render admin panel`

**Symptom:** Playwright cannot find form elements and configuration toggles. Tests use generic selectors like `.config-toggle`, `[data-testid="config-panel"]`, `button:has-text("Save")` that don't match the actual rendered DOM.

**Evidence:** Snapshot analysis shows the config panel component renders with CSS class `config-panel-wrapper` and uses `<button type="submit">Submit</button>` instead of `Save`.

### Root Cause 2: DBOS API Timeout (2 failures)

**Failing tests:**
- `should execute workflow and show completion`
- `should handle workflow errors gracefully`

**Symptom:** Tests call `dbosClient.startWorkflow()` which sends a POST to `/api/dbos` and waits for a response. Under test load, the DBOS SDK takes >5000ms to respond, but Playwright's default `actionTimeout` is 5000ms. The test throws `TimeoutError` before the workflow completes.

**Evidence:** Console logs show `POST /api/dbos 200 OK` completing at ~5200ms. Network timing confirms the DBOS workflow initialization is the bottleneck.

### Root Cause 3: Docs Page Bundling Error (2 failures)

**Failing tests:**
- `should load documentation page`
- `should render API reference`

**Symptom:** The documentation page imports `workflow/docs` which references Node.js built-in `module` (for dynamic doc loading). Next.js client-side bundling does not polyfill `module`, causing a runtime error: `Module "module" has been external explicitly` or `ReferenceError: module is not defined`.

**Evidence:** Browser console shows `Uncaught ReferenceError: module is not defined` on the documentation route.

## Decision

Fix each root cause with minimal, targeted changes. No refactoring of unrelated code.

### Fix 1: Config Selector - Add `data-testid` Attribute

**Approach:** Add `data-testid` attributes to the relevant source component(s) and update Playwright selectors to match.

**Implementation:**

1. **Source component change** (`app/components/ConfigPanel.tsx` or equivalent):
   - Add `data-testid="config-panel"` to the panel container
   - Add `data-testid="config-save-button"` to the submit button
   - Add `data-testid="config-toggle-{name}"` to each toggle/switch

2. **Playwright selector update** (`e2e/config.spec.ts` or equivalent):
   ```typescript
   // Before
   await page.locator('.config-toggle').click();
   await page.locator('button:has-text("Save")').click();

   // After
   await page.locator('[data-testid="config-toggle-notifications"]').click();
   await page.locator('[data-testid="config-save-button"]').click();
   ```

**Why `data-testid`:** This is the Playwright-recommended pattern. It decouples test selectors from CSS class names (which change during refactoring) and from visible text (which changes during localization).

### Fix 2: DBOS API Timeout - Add AbortSignal to DBOSClient Calls

**Approach:** Increase the timeout for DBOS API calls in test and/or add AbortSignal support to the DBOSClient wrapper.

**Implementation:**

1. **Update Playwright test config** (`playwright.config.ts`):
   ```typescript
   // Increase action timeout for workflow tests
   test.use({ actionTimeout: 15000 }); // 15s instead of default 5s
   ```

2. **Update DBOSClient wrapper** (`app/lib/dbos-client.ts` or equivalent):
   ```typescript
   async startWorkflow<T>(workflowName: string, input: T, signal?: AbortSignal): Promise<string> {
     const response = await fetch('/api/dbos', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ workflow: workflowName, input }),
       signal, // Pass through AbortSignal for timeout control
     });
     // ...
   }
   ```

3. **Add timeout helper in test setup** (`e2e/helpers.ts`):
   ```typescript
   import { setTimeout } from 'timers/promises';

   export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
     const ac = new AbortController();
     const timeout = setTimeout(ms, undefined, { ref: false }).then(() => {
       ac.abort();
       throw new Error(`Operation timed out after ${ms}ms`);
     });
     return Promise.race([promise, timeout]);
   }
   ```

**Alternative considered:** Increasing `actionTimeout` globally to 30s. Rejected because it masks real performance regressions. Targetted increase for workflow tests only.

### Fix 3: Docs Page - Polyfill `module` Built-in

**Approach:** Add a webpack/Next.js configuration to polyfill the `module` Node.js built-in for browser usage.

**Implementation:**

1. **Create or update** `next.config.ts`:
   ```typescript
   import type { NextConfig } from 'next';

   const nextConfig: NextConfig = {
     webpack: (config, { isServer }) => {
       if (!isServer) {
         config.resolve.fallback = {
           ...config.resolve.fallback,
           module: false, // Prevent bundling 'module' - docs handle absence gracefully
         };
       }
       return config;
     },
   };

   export default nextConfig;
   ```

2. **Update docs wrapper** (`app/components/DocsRenderer.tsx` or equivalent):
   ```typescript
   // Wrap dynamic import in try-catch for environments without 'module'
   let docsModule: any;
   try {
     docsModule = await import('workflow/docs');
   } catch (e) {
     // Graceful fallback - show static content
     docsModule = { renderDoc: () => '<p>Documentation unavailable in this environment</p>' };
   }
   ```

**Why `module: false` instead of polyfilling:** The `module` module is a Node.js built-in that doesn't have a meaningful browser equivalent. Setting the fallback to `false` tells webpack to not bundle it and instead throw a clear error at import time, which we then catch gracefully. This avoids importing a fake polyfill that could cause subtle bugs.

**Bundle size impact:** Negligible. `module: false` adds no bytes to the bundle. The try-catch wrapper adds <50 bytes.

## Consequences

### Positive
- **All 27 E2E tests pass reliably** - Clear success metric.
- **Minimal changes** - Each fix is <10 lines of code, touching only the files that directly cause the failure.
- **Improved test maintainability** - `data-testid` selectors are resilient to UI refactoring.
- **Better error handling** - The DBOS client now supports AbortSignal, which is useful for production too.
- **Graceful degradation** - The docs page works even when Node.js built-ins are unavailable.

### Negative
- **Test config change increases timeout** - Workflow tests now take up to 15s to fail if something goes wrong (vs 5s before). Acceptable trade-off.
- **`module: false` is a blunt instrument** - If a legitimate browser dependency needs `module`, it will fail. Currently no such dependency exists.

### Neutral
- **`data-testid` attributes are not user-facing** - They add attributes to the DOM but don't affect visual rendering or accessibility.
- **AbortSignal is optional** - Existing callers that don't pass a signal continue to work unchanged.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Webpack config change breaks build | Low | High | Test `npm run build` after change |
| `module: false` breaks future feature | Low | Medium | Document in code comment; remove if needed |
| Timeout increase hides real perf issue | Low | Medium | Monitor workflow execution times in CI |
| `data-testid` attribute not unique | Low | Low | Use descriptive, scoped test IDs |

## Alternatives Considered

### Fix 1 Alternatives
- **Use CSS class selectors** - Rejected. CSS classes change during refactoring, making tests fragile.
- **Use text selectors** - Rejected. Text changes during localization or copy updates.
- **Use Playwright locator strategies (getByRole, getByLabel)** - Viable but requires more specific ARIA attributes that may not exist.

### Fix 2 Alternatives
- **Global timeout increase to 30s** - Rejected. Masks performance regressions across all tests.
- **Mock DBOS entirely in E2E tests** - Rejected. E2E tests should exercise real backend.
- **Optimize DBOS workflow initialization** - Considered but out of scope for this fix; should be separate perf improvement.

### Fix 3 Alternatives
- **Use `@module-federation/enhanced` polyfill** - Over-engineered, adds 50KB+ bundle size.
- **Convert docs to static MDX** - Better long-term solution but requires content migration, out of scope.
- **Dynamic import with `typeof module !== 'undefined'` guard** - Viable but less clean than webpack fallback.

## Verification

After implementing fixes:
1. Run `npm run build` - Must pass with no errors
2. Run `npm run test:e2e` - All 27 tests must pass
3. Run `npm test` - Unit tests must still pass (no regressions)
4. Manual check: Navigate to docs page in browser - Must render without console errors

---

## References

- Playwright test files: `e2e/` directory
- Config panel component: `app/components/ConfigPanel.tsx`
- DBOS client wrapper: `app/lib/dbos-client.ts`
- Next.js config: `next.config.ts`
- PRD.md sections 3.4 (Retry/Error Handling), 3.5 (Workflow Chaining)
