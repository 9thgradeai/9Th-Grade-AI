# Production-Grade Hardening — Full Repository Audit

**Date:** 2026-08-14  
**Auditor:** Kilo (Lead Staff Engineer)  
**Scope:** Complete backend + frontend + data layer + deployment  
**Status:** Phase 0 Complete — No code modified yet

---

## Executive Summary

The 9Th-Grade AI platform has a **sound architectural foundation** (Hono v4, Prisma, PostgreSQL, Redis-ready) but contains **critical security and correctness blockers** that must be resolved before production scale. The most severe issues are:

1. **SQL injection** via `$queryRawUnsafe` in the question random endpoint
2. **Client-side grading** in Practice/MockTest flows (score manipulation possible)
3. **IDOR vulnerability** in `GET /api/questions/:id/full` (no ownership check)
4. **Horizontal scaling blockers**: in-memory rate limiting, realtime hub, and cache
5. **Unbounded queries** (`ORDER BY RANDOM()`, `computePercentile` loading all results)

The schema is well-designed with proper indexes and foreign keys. The question bank data pipeline exists but needs hardening for production idempotency and lifecycle management.

---

## Phase 0 Findings (Categorized)

### P0 — Security / Data-loss / Correctness Blockers

| ID | File | Line | Issue | Severity | Description |
|----|------|------|-------|----------|-------------|
| P0-1 | `backend/src/routes/questions.ts` | 124-137 | SQL Injection | Critical | `$queryRawUnsafe` with string interpolation of `subTopicId`, `difficulty`, and `excludeIds` directly into SQL |
| P0-2 | `backend/src/routes/questions.ts` | 133 | Unbounded Random | Critical | `ORDER BY RANDOM()` on Question table — O(n) scan, will timeout at 100K+ rows |
| P0-3 | `src/pages/Practice.tsx` | 40-67 | Client-side grading | Critical | `onFinish` computes score locally; `correctIndex` is available client-side via `listQuestions` |
| P0-4 | `src/pages/MockTest.tsx` | 34-58 | Client-side grading | Critical | Same as P0-3; mock tests grade client-side with full answer data |
| P0-5 | `backend/src/routes/questions.ts` | 73-92 | IDOR + Answer Leakage | Critical | `GET /api/questions/:id/full` has no `userId` ownership check; returns `correctIndex` and `explanation` to any authenticated user |
| P0-6 | `backend/src/routes/payments.ts` | 126-128 | Webhook bypass | High | Mock mode parses raw JSON without `stripe-signature` verification; in production with missing env, webhook is unauthenticated |
| P0-7 | `backend/src/middleware/auth.ts` | 10 | JWT fallback | Medium | `JWT_SECRET` falls back to `dev-secret-change-this` in non-production; production guard exists but pattern is risky |
| P0-8 | `backend/src/routes/admin.ts` | 13 | Redundant admin check | Low | Both `roleGuard('admin')` and `requireAdmin` run; double DB query per admin request |

### P1 — Scalability / Reliability Blockers

| ID | File | Line | Issue | Severity | Description |
|----|------|------|-------|----------|-------------|
| P1-1 | `backend/src/middleware/rateLimit.ts` | 26 | In-memory rate limiting | High | `Map`-based bucketing is per-instance; Vercel serverless has no shared memory across invocations |
| P1-2 | `backend/src/lib/realtime.ts` | 25-69 | In-memory pub/sub | High | `RealtimeHub` uses `Map`/`Set`; horizontal scaling means events only reach connections on the same instance |
| P1-3 | `backend/src/lib/cache.ts` | 22 | In-memory cache fallback | High | `Map`-based TTL cache is per-process; stale reads across instances |
| P1-4 | `backend/src/lib/score.ts` | 147-155 | Unbounded percentile query | High | `computePercentile` loads **all** `TestResult` rows for an exam into memory |
| P1-5 | `backend/src/routes/tests.ts` | 108-114 | Full-table pool scan | High | `findMany` without filters loads every question for the scope into memory before sampling |
| P1-6 | `backend/src/routes/tests.ts` | 258-313 | Blocking async work | High | Test submission runs `diagnoseTest`, `sendEmail`, and `realtime.publish` synchronously in the request path |
| P1-7 | `backend/src/index.ts` | 11-16 | Cold-start race | Medium | `updateMany` on every serverless cold start; concurrent invocations can thrash |
| P1-8 | `backend/src/app.ts` | 59 | Raw SQL in health | Low | `$queryRaw\`SELECT 1\`` is safe but unnecessary; `prisma.$queryRaw` should use `$queryRawUnsafe` only with parameterized queries |

### P2 — Performance / Maintainability Improvements

| ID | File | Line | Issue | Severity | Description |
|----|------|------|-------|----------|-------------|
| P2-1 | `backend/src/routes/tests.ts` | 329-382 | Sequential upserts | Medium | `upsertProgress` loops per-subject and per-topic sequentially; should batch with `createMany` / transaction |
| P2-2 | `backend/src/lib/sm2.ts` | 70-78 | Sequential loop | Low | `ensureRevisionItems` iterates `topicIds` with individual DB calls |
| P2-3 | `backend/src/middleware/security.ts` | 1-15 | Missing CSP | Medium | No `Content-Security-Policy` header |
| P2-4 | `backend/src/routes/auth.ts` | 73 | Cookie Secure flag | Low | `Secure` cookie breaks on local HTTP dev; should be conditional on `NODE_ENV === 'production'` |
| P2-5 | `backend/src/routes/payments.ts` | 162-170 | Fire-and-forget invoice | Low | `invoice.create` after `subscription.upsert` is not in the same transaction; partial failure possible |
| P2-6 | `backend/src/lib/email.ts` | 20-35 | Silent email failure | Low | `sendEmail` catches and logs errors but never surfaces them; transactional emails can silently fail |
| P2-7 | `backend/src/middleware/rateLimit.ts` | 19-23 | Generic key function | Low | `key` function is called even when `userId` is undefined; auth middleware sets it but public routes bypass this limiter |
| P2-8 | `backend/prisma/schema.prisma` | 490-517 | Subscription plan gating | Low | All plans grant every feature; monetization is cosmetic |

### P3 — Optional / Tech Debt

| ID | File | Line | Issue | Severity | Description |
|----|------|------|-------|----------|-------------|
| P3-1 | `src/lib/api.ts` | 49-56 | Dev mock fallbacks | Low | `fromBackend` falls back to bundled `data/*` in dev; should be removed for production purity |
| P3-2 | `src/lib/memoryStore.ts` | 1-54 | localStorage revision | Low | Client-side revision items in localStorage are not synced with backend |
| P3-3 | `backend/src/routes/strategy.ts` | 100-121 | Uncached roadmap generation | Low | First-visit roadmap generation hits DB for primary exam, then builds roadmap |
| P3-4 | `.github/workflows/ci-cd.yml` | 1-51 | No backend CI | Low | CI only builds and runs `npm test`; no backend lint, typecheck, or migration test |
| P3-5 | `backend/package.json` | 18 | No test script | Low | `oxlint` is the only check; no unit/integration test runner configured |
| P3-6 | `data/Question_Bank/BCS/` | — | JSONL in repo | Info | Question bank is correctly outside `src/` but needs formal ingestion pipeline with checksums |

---

## Architecture Assessment (Before vs. After Target)

### Before
```
Frontend (Vite/React)
  ├── Mock data fallbacks in src/lib/data.ts
  ├── Client-side grading (correctIndex exposed)
  ├── localStorage revision items
  └── In-memory session store

Backend (Vercel Serverless)
  ├── Single Hono app (api/index.js)
  ├── In-memory rate limiting
  ├── In-memory RealtimeHub (SSE)
  ├── In-memory cache fallback
  ├── Raw SQL injection risk
  ├── Synchronous AI/email in request path
  └── JWT auth (no refresh tokens / rotation)

Data Layer
  ├── PostgreSQL (Supabase/Neon) — single source of truth
  ├── Prisma ORM
  ├── Upstash Redis (optional, not default)
  └── JSONL question bank (data/)
```

### After (Target)
```
Frontend (Vite/React)
  ├── Zero mock fallbacks in production paths
  ├── Server-authoritative grading only
  ├── Backend-backed revision/session
  └── Strict input validation

Backend (Vercel Serverless + Edge Config)
  ├── Hono v4 with structured middleware
  ├── Redis-backed rate limiting (Upstash)
  ├── Distributed realtime (Redis pub/sub + SSE)
  ├── Redis cache with memory fallback
  ├── Parameterized queries only ($queryRaw`...`)
  ├── Background job offload (AI, emails, notifications)
  └── JWT auth with refresh token rotation

Data Layer
  ├── PostgreSQL — single source of truth
  ├── Prisma ORM with strict migration workflow
  ├── Redis — cache, rate limit, ephemeral state, pub/sub
  ├── Idempotent JSONL ingestion pipeline
  └── Question lifecycle: IMPORTED → NEEDS_REVIEW → VALIDATED → PUBLISHED → ARCHIVED → REJECTED
```

---

## Migration Safety Assessment

**Current migration state:**
- `0_init` — creates all tables, indexes, foreign keys
- `1_enhance_question_bank` — adds SubTopic, QuestionContent, QuestionSource, QuestionVersion, QuestionStats, CurrentAffairsQuestion; migrates legacy Question data

**Assessment:** Migrations are **safe and backward-compatible**. No destructive operations detected. `IF NOT EXISTS` is used throughout. Legacy data migration is included inline.

**Recommendation:** Continue using `prisma migrate dev` for development and `prisma migrate deploy` for production. Never use `prisma db push --force-reset`.

---

## Next Steps

1. **Phase 1:** Establish strict migration workflow (already compliant)
2. **Phase 2:** Audit constraints and add missing indexes
3. **Phase 3:** Harden JSONL ingestion pipeline
4. **Phase 4-10:** Fix P0/P1 issues in priority order
5. **Phase 11-14:** Auth, Stripe, Realtime hardening
6. **Phase 15-23:** Observability, testing, background jobs
7. **Phase 24-30:** CI/CD, deployment, final audit
