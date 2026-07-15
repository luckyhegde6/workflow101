---
description: DevOps agent for Docker, Vercel, CI/CD, and infrastructure
agent: devops
subtask: true
---

# DevOps Command

Manage infrastructure, deployment, Docker containers, and CI/CD pipelines.

## Instructions

### 1. Docker Management
- Start PostgreSQL: `npm run db:up`
- Check container status: `docker compose ps`
- View logs: `docker compose logs`
- Restart services: `docker compose restart`
- Rebuild: `docker compose build --no-cache`

### 2. Vercel Deployment
- Deploy to preview: `vercel`
- Deploy to production: `vercel --prod`
- Check deployment status: `vercel list`
- View deployment logs: `vercel logs <deployment-url>`
- Set environment variables: `vercel env add`
- Check deployment configuration: `vercel.json`

### 3. CI/CD Pipeline
- Check GitHub Actions status
- Review CI configuration in `.github/workflows/`
- Verify pipeline steps:
  - Install dependencies
  - Run linting
  - Run tests
  - Build
  - Deploy
- Check for pipeline failures and fix

### 4. Infrastructure Checks
- Verify database connection string priorities:
  1. `DBOS_SYSTEM_DATABASE_URL`
  2. `POSTGRES_URL_NON_POOLING`
  3. `DATABASE_URL`
  4. Local fallback
- Check Vercel environment variables are synchronized
- Verify cron triggers are configured in Vercel dashboard

### 5. Security & Vulnerabilities
- Check `npm audit` for vulnerabilities
- Review `dependabot` alerts
- Check for outdated packages: `npm outdated`
- Verify no secrets in .env files committed

## Outcome Capture
- [ ] Docker containers running correctly
- [ ] Vercel deployment successful
- [ ] CI/CD pipeline passes
- [ ] Infrastructure configuration verified
- [ ] Security vulnerabilities checked
