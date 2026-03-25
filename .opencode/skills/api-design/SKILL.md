---
name: api-design
description: REST API design patterns including resource naming, status codes, pagination, filtering, error responses, versioning, and rate limiting.
origin: ECC
---

# API Design Patterns

Conventions and best practices for designing consistent, developer-friendly REST APIs.

## When to Activate

- Designing new API endpoints
- Reviewing existing API contracts
- Adding pagination, filtering, or sorting
- Implementing error handling for APIs
- Planning API versioning strategy

## Resource Design

### URL Structure
```
# Resources are nouns, plural, lowercase, kebab-case
GET    /api/v1/users
GET    /api/v1/users/:id
POST   /api/v1/users
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

# Sub-resources for relationships
GET    /api/v1/users/:id/orders
POST   /api/v1/users/:id/orders

# Actions (use verbs sparingly)
POST   /api/v1/orders/:id/cancel
POST   /api/v1/auth/login
```

### Naming Rules
```
# GOOD
/api/v1/team-members          # kebab-case
/api/v1/orders?status=active  # query params

# BAD
/api/v1/getUsers              # verb in URL
/api/v1/user                  # singular
```

## HTTP Methods and Status Codes

### Status Code Reference
```
# Success
200 OK                    — GET, PUT, PATCH
201 Created               — POST (include Location header)
204 No Content           — DELETE

# Client Errors
400 Bad Request           — Validation failure
401 Unauthorized          — Missing authentication
403 Forbidden             — Authenticated but not authorized
404 Not Found             — Resource doesn't exist
409 Conflict              — Duplicate entry
429 Too Many Requests     — Rate limit exceeded

# Server Errors
500 Internal Server Error — Unexpected failure
502 Bad Gateway           — Upstream service failed
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "abc-123",
    "name": "Example"
  }
}
```

### Collection Response (with Pagination)
```json
{
  "data": [...],
  "meta": {
    "total": 142,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  },
  "links": {
    "self": "/api/v1/users?page=1",
    "next": "/api/v1/users?page=2"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

## Pagination

### Offset-Based (Simple)
```
GET /api/v1/users?page=2&per_page=20
```

### Cursor-Based (Scalable)
```
GET /api/v1/users?cursor=eyJpZCI6MTIzfQ&limit=20

{
  "data": [...],
  "meta": {
    "has_next": true,
    "next_cursor": "eyJpZCI6MTQzfQ"
  }
}
```

## Filtering, Sorting, and Search

```
# Simple equality
GET /api/v1/orders?status=active

# Multiple values
GET /api/v1/products?category=electronics,clothing

# Sorting
GET /api/v1/products?sort=-created_at,name

# Full-text search
GET /api/v1/products?q=wireless+headphones
```

## Rate Limiting

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000

# When exceeded
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

## Versioning

### URL Path Versioning (Recommended)
```
/api/v1/users
/api/v2/users
```

### Versioning Strategy
```
1. Start with /api/v1/
2. Maintain at most 2 active versions
3. Breaking changes require new version:
   - Removing or renaming fields
   - Changing field types
   - Changing URL structure
```

## Implementation Patterns

### TypeScript (Next.js API Route)
```typescript
import { z } from 'zod'

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: parsed.error.issues }
    }, { status: 422 })
  }

  const user = await createUser(parsed.data)
  return NextResponse.json(
    { success: true, data: user },
    { status: 201, headers: { Location: `/api/v1/users/${user.id}` } }
  )
}
```

## API Design Checklist

Before shipping a new endpoint:
- [ ] Resource URL follows naming conventions
- [ ] Correct HTTP method used
- [ ] Appropriate status codes returned
- [ ] Input validated with schema
- [ ] Error responses follow standard format
- [ ] Pagination implemented for list endpoints
- [ ] Authentication required
- [ ] Rate limiting configured
- [ ] Response does not leak internal details
