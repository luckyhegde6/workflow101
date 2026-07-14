# Error Solutions Reference

## 1. ERR_MODULE_NOT_FOUND for Node.js Built-in
**Symptom**: Build/ runtime error: `ERR_MODULE_NOT_FOUND` for `crypto`, `fs`, `path`, etc.
**Cause**: Node.js built-in imported in browser bundle (e.g., server action or DBOS import chain)
**Solution**: Dynamic import with `ssr: false` + resolve alias to stub
```typescript
// next.config.ts - add resolve alias
config.resolve.fallback = { crypto: false, fs: false, path: false };
```

## 2. DBOS.launch() Hanging
**Symptom**: Dev server or route handler hangs indefinitely on DBOS initialisation
**Cause**: DBOS.launch() never resolves (often on first load or when DB is unreachable)
**Solution**: Make lazy, wrap in timeout, return fallback
```typescript
async function getClient(): Promise<DBOSClient> {
  const dbConfig = getDatabaseConfig();
  return withTimeout(DBOSClient.create({ systemDatabaseUrl: dbConfig.url }), 5000);
}
```

## 3. E2E Test Selector Ambiguity
**Symptom**: Playwright test fails with "strict mode violation" or matches wrong element
**Cause**: Text-based selectors (`text=Submit`) matching multiple elements
**Solution**: Use `data-testid` attributes
```tsx
<button data-testid="enqueue-button">Enqueue</button>
```
```typescript
const button = page.locator('[data-testid="enqueue-button"]');
```

## 4. npm Install Corruption on Windows
**Symptom**: "Invalid Version", 0-byte files, cannot find module
**Cause**: Antivirus locking files during npm install; interrupted previous install
**Solution**: Use temp directory fix
```bash
cd /d "%TEMP%"
mkdir fix-pkg && cd fix-pkg
npm init -y >nul 2>&1
npm install <corrupted-package>
xcopy /E /I /Y "%TEMP%\fix-pkg\node_modules\<pkg>\*" ".\node_modules\<pkg>\"
```

## 5. Turbopack Build Errors
**Symptom**: Build fails with module resolution errors or unexpected token
**Cause**: Node.js built-in imports in browser bundles; unsupported syntax in Turbopack
**Solution**: Check for `crypto`, `fs`, `path` imports in client components; use `ssr: false` dynamic imports

## 6. Sentry Source Map Upload
**Symptom**: Source maps not uploaded; errors show minified stack traces
**Cause**: Missing Sentry auth token or webpack plugin configuration
**Solution**: Configure Sentry in `next.config.ts` + set `SENTRY_AUTH_TOKEN` in environment
```bash
# .env.local
SENTRY_AUTH_TOKEN=your_token
SENTRY_ORG=your_org
SENTRY_PROJECT=workflow101
```

## 7. PostgreSQL Connection Failures
**Symptom**: `ECONNREFUSED ::1:5432` or `connection timeout`
**Cause**: Docker container not running; wrong connection string; port conflict
**Solution**: 
```bash
# Check Docker status
docker compose ps
# Start PostgreSQL if needed
npm run db:up
# Test connection
npm run db:config
```
Verify connection string priority: `DBOS_SYSTEM_DATABASE_URL` > `POSTGRES_URL_NON_POOLING` > `DATABASE_URL` > `postgresql://postgres:postgres@localhost:5432/workflow101`
