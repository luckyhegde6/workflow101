---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Node.js and Next.js API routes.
origin: ECC
---

# Backend Development Patterns

Backend architecture patterns and best practices for scalable server-side applications.

## When to Activate

- Designing REST or GraphQL API endpoints
- Implementing repository, service, or controller layers
- Optimizing database queries
- Adding caching (Redis, in-memory)
- Setting up background jobs or async processing
- Structuring error handling and validation for APIs

## API Design Patterns

### RESTful API Structure
```
GET    /api/markets                 # List resources
GET    /api/markets/:id             # Get single resource
POST   /api/markets                 # Create resource
PUT    /api/markets/:id             # Replace resource
PATCH  /api/markets/:id             # Update resource
DELETE /api/markets/:id             # Delete resource
```

### Response Format
```typescript
// Success response
return NextResponse.json({
  success: true,
  data: resource,
  meta: { total: 100, page: 1 }
})

// Error response
return NextResponse.json({
  success: false,
  error: { code: 'NOT_FOUND', message: 'Resource not found' }
}, { status: 404 })
```

## Database Patterns

### Query Optimization
```typescript
// GOOD: Select only needed columns
const { data } = await supabase
  .from('markets')
  .select('id, name, status')
  .eq('status', 'active')
  .limit(10)

// BAD: Select everything
const { data } = await supabase
  .from('markets')
  .select('*')
```

### N+1 Query Prevention
```typescript
// BAD: N+1 query problem
for (const market of markets) {
  market.creator = await getUser(market.creator_id)
}

// GOOD: Batch fetch
const creatorIds = markets.map(m => m.creator_id)
const creators = await getUsers(creatorIds)
```

## Error Handling Patterns

```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string
  ) {
    super(message)
  }
}

export function errorHandler(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: { code: error.code, message: error.message }
    }, { status: error.statusCode })
  }

  console.error('Unexpected error:', error)
  return NextResponse.json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  }, { status: 500 })
}
```

### Retry with Exponential Backoff
```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000)
      }
    }
  }

  throw lastError!
}
```

## Authentication & Authorization

### JWT Token Validation
```typescript
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
  } catch {
    throw new ApiError(401, 'Invalid token', 'INVALID_TOKEN')
  }
}
```

### Role-Based Access Control
```typescript
const rolePermissions: Record<string, string[]> = {
  admin: ['read', 'write', 'delete'],
  user: ['read', 'write']
}

export function hasPermission(role: string, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}
```

## Caching Strategies

### Cache-Aside Pattern
```typescript
async function getMarketWithCache(id: string): Promise<Market> {
  const cached = await redis.get(`market:${id}`)
  if (cached) return JSON.parse(cached)

  const market = await db.markets.findUnique({ where: { id } })
  await redis.setex(`market:${id}`, 300, JSON.stringify(market))

  return market
}
```

## Logging & Monitoring

### Structured Logging
```typescript
const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...context
    }))
  },
  error: (message: string, error: Error, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      ...context
    }))
  }
}
```

**Remember**: Backend patterns enable scalable, maintainable server-side applications. Choose patterns that fit your complexity level.
