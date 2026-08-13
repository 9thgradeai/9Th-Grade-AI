# Production-Grade Launch Plan

> **Created:** 2026-08-13
> **Status:** Planning
> **Estimated Timeline:** 2-3 weeks

## Executive Summary

The 9Th-Grade AI application has strong architectural foundations but requires critical infrastructure and testing work before production deployment. This plan prioritizes blockers by severity and business impact with a phased approach.

**Overall Production Readiness Score: Not Ready** - Critical blockers in testing and CI/CD must be addressed.

---

## Production Readiness Assessment

| Category | Score | Status |
|----------|-------|--------|
| Architecture | 9/10 | Ready |
| Authentication & Security | 7/10 | Needs CSP header |
| Error Handling & Observability | 9/10 | Ready |
| Performance | 8/10 | Ready |
| **Testing** | **0/10** | **Blocking** |
| Infrastructure & Deployment | 6/10 | Needs CI/CD |
| Data Layer | 9/10 | Ready |
| Accessibility | 8/10 | Ready |
| Code Quality | 9/10 | Ready |
| Documentation | 9/10 | Ready |

---

## Phase 1: Critical Blockers (Week 1)

### 1.1 Test Suite Implementation

**Priority: CRITICAL** | **Estimated Effort: 3-4 days**

**Unit Tests (Vitest):**
```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event happy-dom
```

**Target Coverage:**
| Area | Minimum Coverage | Priority |
|------|------------------|----------|
| Auth flows (`lib/auth.tsx`) | 80% | Critical |
| API client (`lib/client.ts`) | 80% | Critical |
| Redirect safety (`lib/redirect.ts`) | 100% | Critical |
| Error boundary | 70% | High |
| useAsync/useSubmit hooks | 70% | High |

**Test Files to Create:**
- `src/lib/auth.test.tsx` - Login, register, logout, session refresh, 401 handling
- `src/lib/client.test.ts` - Request retry, timeout, token refresh, error handling
- `src/lib/redirect.test.ts` - Open redirect prevention (security critical)
- `src/lib/safeRedirect.test.ts` - URL validation edge cases
- `src/components/ErrorBoundary.test.tsx` - Error catching and recovery

**E2E Tests (Playwright):**
```bash
npm install -D @playwright/test
npx playwright install
```

**Critical User Flows to Test:**
| Flow | Test Cases |
|------|------------|
| Authentication | Register → Verify email → Login → Logout |
| Auth edge cases | Invalid credentials, expired token, password reset |
| Protected routes | Unauthenticated redirect, session persistence |
| Practice session | Start practice → Answer questions → Submit → View results |
| Mock test | Start timed test → Complete → View diagnosis |
| Payments | Checkout → Webhook → Feature unlock (Stripe test mode) |

---

### 1.2 CI/CD Pipeline

**Priority: CRITICAL** | **Estimated Effort: 1-2 days**

**GitHub Actions Workflows to Create:**

**`.github/workflows/ci.yml` - Frontend CI:**
- Lint, test, build on push/PR to main
- Upload coverage to Codecov
- Run Playwright E2E tests
- Lighthouse CI for performance budgets

**`.github/workflows/backend-ci.yml` - Backend CI:**
- Lint and test on backend changes
- Run Prisma migrations against test database
- PostgreSQL service container for integration tests

**`.github/workflows/deploy.yml` - Deployment:**
- Auto-deploy to Vercel preview on PR
- Auto-deploy to production on main merge
- Separate workflow for backend deployment

---

### 1.3 Content-Security-Policy Header

**Priority: HIGH** | **Estimated Effort: 2-4 hours**

Update `backend/src/middleware/security.ts`:

```typescript
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.openai.com https://o449531.ingest.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

c.header('Content-Security-Policy', csp)
```

---

### 1.4 Database Backup Strategy

**Priority: HIGH** | **Estimated Effort: 1 hour**

- Enable daily automatic backups in Supabase/Neon dashboard
- Configure point-in-time recovery (Pro tier)
- Create backup verification script: `scripts/verify-backup.sh`

---

## Phase 2: High Priority (Week 2)

### 2.1 Rate Limiting Migration to Redis

**Priority: HIGH** | **Estimated Effort: 1 day**

Create `backend/src/middleware/rateLimitRedis.ts` using Upstash Redis:

- Install `@upstash/redis` package
- Environment detection: fallback to in-memory if Redis unavailable
- Configure via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

---

### 2.2 Log Aggregation (Axiom)

**Priority: HIGH** | **Estimated Effort: 4 hours**

- Install `@axiomhq/js`
- Create `backend/src/lib/logger.ts` with structured logging
- Configure `AXIOM_TOKEN` environment variable
- Ingest logs to `app-logs` dataset

---

### 2.3 Sentry Alert Configuration

**Priority: HIGH** | **Estimated Effort: 2 hours**

Configure alert rules in Sentry dashboard:

| Alert | Condition | Action |
|-------|-----------|--------|
| High error rate | >10 errors/minute | Slack + Email |
| Auth failures spike | >50 401s/minute | Email |
| Payment failures | Any `stripe.*` error | Email immediately |
| Database connection | Health check down >1min | PagerDuty |

---

## Phase 3: Medium Priority (Week 3)

### 3.1 Accessibility Testing

**Priority: MEDIUM** | **Estimated Effort: 4 hours**

- Install `@axe-core/react` for dev-time auditing
- Install `@axe-core/playwright` for automated E2E a11y tests
- Run Lighthouse accessibility audit in CI (minimum 90 score)

---

### 3.2 API Documentation (OpenAPI)

**Priority: MEDIUM** | **Estimated Effort: 1 day**

- Install `@hono/zod-openapi`
- Create OpenAPI spec from Hono routes
- Serve at `/api/docs` endpoint
- Add Swagger UI for interactive documentation

---

### 3.3 Service Worker for Offline

**Priority: MEDIUM** | **Estimated Effort: 1 day**

- Create `public/sw.js` for offline caching
- Cache static assets (fonts, CSS, JS)
- Register in `src/main.tsx` for production builds
- Enable offline question practice capability

---

## Phase 4: Pre-Launch Checklist

### Environment Variables

**Backend (`backend/.env` production):**
```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="<32-byte-random>"
FRONTEND_URL="https://yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_PRO="price_..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Monitoring
SENTRY_DSN="https://...@sentry.io/..."
AXIOM_TOKEN="xaat-..."

# AI (optional)
OPENAI_API_KEY="sk-..."
```

**Frontend (`.env.production`):**
```bash
VITE_API_URL="/api"
VITE_SENTRY_DSN="https://...@sentry.io/..."
VITE_COMMIT_SHA="${process.env.COMMIT_SHA}"
```

---

### Database Migration Checklist

1. Run migrations: `npx prisma migrate deploy`
2. Seed catalog data: `npm run db:seed`
3. Verify indexes: `\di in psql`
4. Enable backups (Supabase/Neon dashboard)
5. Create admin user: Update `ADMIN_EMAIL` in env

---

### Security Checklist

- [ ] CSP header configured
- [ ] HSTS enabled (63072000 seconds)
- [ ] HTTPS enforced
- [ ] JWT_SECRET is 32+ bytes random
- [ ] No secrets in git
- [ ] Stripe webhook signature verification enabled
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] CORS restricted to frontend origin
- [ ] Security.txt at `/.well-known/security.txt`

---

### Monitoring Checklist

- [ ] Sentry DSN configured
- [ ] Alert rules active
- [ ] Health check endpoint responding
- [ ] Axiom logs flowing
- [ ] Uptime monitoring (Vercel/Sentry)
- [ ] Performance budgets (Lighthouse CI)

---

## Timeline Summary

| Phase | Duration | Must Complete |
|-------|----------|---------------|
| 1. Critical Blockers | Week 1 | Tests, CI/CD, CSP, Backups |
| 2. High Priority | Week 2 | Redis, Logging, Alerts |
| 3. Medium Priority | Week 3 | A11y, API Docs, Offline |
| 4. Pre-Launch | Week 3 | Final checks and deployment |

**Total Estimated Time: 2-3 weeks**

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Test suite incomplete at deadline | Prioritize auth and payment flows; accept lower coverage on non-critical paths |
| CSP breaks third-party scripts | Test in staging with CSP-Report-Only header first |
| Redis unavailable | Fallback to in-memory rate limiting already implemented |
| Stripe webhook fails | Add retry logic with exponential backoff |
| Database migration fails | Backup before migration; use transactions; have rollback script |

---

## Success Criteria

Before production launch, the following must pass:

1. All CI checks green (lint, test, build, e2e)
2. Minimum 60% test coverage on critical paths
3. Lighthouse scores: Desktop 95+, Mobile 90+
4. All security headers present (verified by securityheaders.com)
5. Database backups verified
6. Monitoring dashboards active
7. Load test: 100 concurrent users, <200ms p95 response time
8. Successful end-to-end test purchase in Stripe test mode
