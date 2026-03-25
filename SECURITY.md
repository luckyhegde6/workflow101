# Security Policy

## Known Vulnerabilities

This project has some known vulnerabilities in transitive dependencies that cannot be immediately resolved without breaking changes:

### High Severity

1. **Undici WebSocket Vulnerabilities**
   - Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation
   - Malicious WebSocket 64-bit length overflows parser
   - Unbounded Memory Consumption in WebSocket permessage-deflate Decompression
   
   **Source:** `undici` transitive dependency from `@workflow/world-*` packages
   
   **Status:** Pending upstream fix in workflow package

2. **HTTP Request/Response Smuggling**
   - Undici HTTP Request/Response Smuggling issue
   
   **Source:** `undici` transitive dependency
   
   **Status:** Pending upstream fix

### Moderate Severity

1. **Devaluate Prototype Pollution**
   - `devalue.parse` and `devalue.unflatten` emit objects with `__proto__` own properties
   
   **Source:** `@workflow/core` transitive dependency
   
   **Status:** Pending upstream fix in workflow package

2. **esbuild Dev Server Request Forwarding**
   - Any website can send requests to the development server
   
   **Source:** Vite/esbuild in development mode only
   
   **Status:** Development-only, not production issue

3. **file-type Vulnerabilities**
   - ZIP Decompression Bomb DoS
   - Infinite loop in ASF parser
   
   **Source:** Swagger UI React transitive dependencies
   
   **Status:** Impact limited to API documentation feature

## Mitigation Strategies

1. **Development Environment**
   - Vulnerabilities in `esbuild` only affect development server
   - Do not use development server in production

2. **Production Deployment**
   - Vulnerabilities in `undici` and `devalue` are from beta workflow packages
   - Consider removing `workflow` package if not essential
   - Use production-ready workflow patterns from useworkflow.dev instead

3. **API Documentation**
   - `swagger-ui-react` dependencies have known issues
   - Consider alternative API documentation approach for production

## Recommended Actions

1. **Monitor** upstream packages for security updates
2. **Consider** removing `workflow` package if not essential
3. **Use** DBOS SDK patterns directly from useworkflow.dev
4. **Upgrade** to stable versions when available

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it by:
1. Opening a GitHub Issue with [SECURITY] prefix
2. Or contacting the maintainers directly

## Dependencies to Watch

- `workflow` (beta) - Check for stable release with fixed dependencies
- `@workflow/core` - Depends on vulnerable devalue
- `@workflow/world-*` - Depends on vulnerable undici
