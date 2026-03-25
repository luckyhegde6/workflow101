---
name: security-review
description: Use this skill when adding authentication, handling user input, working with secrets, creating API endpoints, or implementing payment/sensitive features.
origin: ECC
---

# Security Review Skill

This skill ensures all code follows security best practices and identifies potential vulnerabilities.

## When to Activate

- Implementing authentication or authorization
- Handling user input or file uploads
- Creating new API endpoints
- Working with secrets or credentials
- Implementing payment features
- Storing or transmitting sensitive data

## Security Checklist

### 1. Secrets Management

#### NEVER Do This
```typescript
const apiKey = "sk-proj-xxxxx"  // Hardcoded secret
const dbPassword = "password123" // In source code
```

#### ALWAYS Do This
```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

### 2. Input Validation

```typescript
import { z } from 'zod'

const CreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

export async function createUser(input: unknown) {
  const validated = CreateSchema.parse(input)
  return await db.users.create(validated)
}
```

### 3. SQL Injection Prevention

```typescript
// DANGEROUS - SQL Injection
const query = `SELECT * FROM users WHERE email = '${userEmail}'`

// SAFE - Parameterized query
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)
```

### 4. XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify'

function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

### 5. Rate Limiting

```typescript
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
})

if (!(await rateLimiter.acquire())) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

## Pre-Deployment Checklist

- [ ] **Secrets**: No hardcoded secrets, all in env vars
- [ ] **Input Validation**: All user inputs validated
- [ ] **SQL Injection**: All queries parameterized
- [ ] **XSS**: User content sanitized
- [ ] **Rate Limiting**: Enabled on all endpoints
- [ ] **Error Handling**: No sensitive data in errors
- [ ] **Dependencies**: Up to date, no vulnerabilities

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/security)

**Remember**: Security is not optional. One vulnerability can compromise the entire platform.
