# Lessons Learned

## Node Modules Corruption Recovery (Windows)
- **Never delete `node_modules/` on Windows** — `rmdir /s /q` hangs due to antivirus
- **Use temp directory installs**: install corrupted package in `%TEMP%`, then `xcopy` into project
- **Delete corrupted `package-lock.json`** when npm install fails with "Invalid Version", then reinstall
- **Check for 0-byte files**: `for /r "node_modules" %i in (*.js) do if %~zi equ 0 echo %i`
- **Affected packages**: `source-map`, `pg-types`, `@next/swc-win32-x64-msvc`, `@testing-library/*`, `tldts`, `magic-string`, `tinyglobby`, and others

## @babel/runtime-corejs3 Exports Map
- Missing `./package.json` export causes module resolution failures
- Fix: manually add entry in package.json exports or reinstall with clean lockfile

## DBOS Patterns
- `"use workflow"` must be a **string literal**, not a template literal
- `"use step"` for step functions (full Node.js access, auto-retry)
- Workflows are **sandboxed** — no full Node.js access inside workflow functions
- **Determinism required** — same input must produce same output on replay
- **Pass-by-value** — parameters are copied; mutations are not visible
- **Queue registration** required before enqueuing
- DBOSClient: lazy creation recommended; wrap in timeout (5s) to avoid hangs
- DBOS.launch() can hang — make lazy, wrap in timeout, return fallback on failure

## Next.js 16
- Dynamic imports **require `await`** — `const Component = await import('./Component')`
- Server components **cannot use hooks**
- `'use client'` directive required for interactive/browser components
- Node.js built-in imports (`crypto`, `fs`, etc.) in browser bundles cause `ERR_MODULE_NOT_FOUND`
- Fix: dynamic import with `ssr: false` + resolve alias to stub

## Windows-Specific
- **F: drive is slow** — file operations take significantly longer
- **Antivirus causes npm install hangs** — exclude project directory from real-time scanning
- **Docker PostgreSQL** via `docker compose` — use `db:up` script; check docker-compose.yml for connection port
- **PowerShell vs cmd.exe** — scripts may need explicit `powershell -ExecutionPolicy Bypass`

## Immutability (CRITICAL)
- Always create new objects, never mutate existing ones
- Return new copies with changes applied
- Example: `{ ...obj, updated: true }` instead of `obj.updated = true`
- Spread operator and `map`/`filter` over direct mutation

## Error Handling
- Handle errors at **every level** — UI (user-friendly messages), server (detailed context), workflow (retry logic)
- Never silently swallow errors; always log context
- Use custom error classes: `WorkflowError`, `ValidationError`, `TimeoutError`, `RetryExhaustedError`, `CircuitBreakerError`
- `withRetry` — exponential backoff with jitter, configurable max attempts
- `withTimeout` — Promise.race-based timeout wrapper
- `withErrorHandling` — wraps async functions, returns `Result<T>` (success/error union)

## Testing Lessons
- Mock DBOS SDK functions properly in tests
- Use `async act()` for async state updates in React component tests
- Test error paths, not just happy paths
- 80%+ coverage target for critical code
- E2E: use `data-testid` attributes to avoid text selector ambiguity
