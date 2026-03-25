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

## Security
- Never hardcode secrets - use env vars
- Validate all user input with Zod/schemas
- Parameterized queries only
- Sanitize HTML to prevent XSS
