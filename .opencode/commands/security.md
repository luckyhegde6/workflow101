---
description: Security review for workflow inputs and API endpoints
agent: security-reviewer
subtask: true
---

# Security Review Command

Perform security review for: $ARGUMENTS

## Security Checklist

### Input Validation
- [ ] All user inputs validated
- [ ] Schema-based validation (Zod)
- [ ] Type checking
- [ ] Length limits
- [ ] Format validation

### Authentication
- [ ] API routes protected
- [ ] RBAC implemented
- [ ] Session management secure
- [ ] Token validation

### Data Protection
- [ ] Secrets in env vars only
- [ ] HTTPS in production
- [ ] Secure headers
- [ ] No sensitive data in logs

### API Security
- [ ] Rate limiting
- [ ] CORS configured
- [ ] CSRF protection
- [ ] Request validation
- [ ] Output sanitization

## Common Vulnerabilities to Check

### Injection
```typescript
// BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD
const query = 'SELECT * FROM users WHERE id = $1';
```

### XSS
```typescript
// BAD
dangerouslySetInnerHTML={{ __html: userInput }};

// GOOD
import DOMPurify from 'dompurify';
DOMPurify.sanitize(userInput);
```

## Output Format

```markdown
## Security Review: [Component]

### Critical Issues
| Issue | Location | Fix |
|-------|----------|-----|
| | | |

### High Issues
| Issue | Location | Fix |
|-------|----------|-----|
| | | |

### Medium/Low Issues
...

### Security Score: X/10
```
