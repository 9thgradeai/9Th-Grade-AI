# 9Th-Grade AI — Production Backend Integration

## Context

The frontend is complete and deployed on Vercel. All data currently comes from `lib/api.ts` (mock data via `lib/data/index.ts`). The frontend is designed for backend swap — components only depend on `api.ts` functions, never importing mock data directly. The goal: build a production-grade backend that serves real data, handles auth, generates AI strategies, processes payments, and scales to thousands of concurrent users.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Vercel CDN)                   │
│              React 19 + Vite + Tailwind v4               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   API GATEWAY (Edge)                     │
│            Rate limiting · Auth · CORS · Cache            │
└──┬───────────────┬───────────────┬──────────────────────┘
   │               │               │
┌──▼───┐    ┌──────▼──────┐  ┌────▼────────┐
│ REST │    │  WebSocket  │  │  AI Engine  │
│ API  │    │  Server     │  │  (Worker)   │
└──┬───┘    └──────┬──────┘  └────┬────────┘
   │               │               │
┌──▼───────────────▼───────────────▼──────────────────────┐
│                    DATA LAYER                            │
│     PostgreSQL (Prisma) · Redis Cache · S3 (files)      │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Runtime** | Node.js 20 + TypeScript | Matches frontend, shared types |
| **Framework** | Hono (Edge) + Express (Workers) | Fast, lightweight, edge-compatible |
| **ORM** | Prisma | Type-safe, migration system, excellent DX |
| **Database** | PostgreSQL (Supabase) | Relational, ACID, full-text search, row-level security |
| **Cache** | Upstash Redis | Serverless-friendly, edge-compatible |
| **Auth** | Better Auth | Modern, TypeScript-native, social + email |
| **AI** | OpenAI API + custom prompts | Strategy generation, diagnosis, adaptive difficulty |
| **Payments** | Stripe | Subscriptions, one-time payments, webhooks |
| **Queue** | BullMQ (Redis) | Background jobs: AI processing, email, analytics |
| **Storage** | Cloudflare R2 / S3 | Question images, user uploads |
| **Real-time** | WebSocket (ws) | Live progress, notifications |
| **Monitoring** | Sentry + Axiom | Error tracking, logs, analytics |
| **Email** | Resend | Transactional email (verification, reminders) |

---

## Database Schema

### Core Tables

```sql
-- Users & Auth
users (id, email, name, firstName, timezone, avatar, createdAt, updatedAt)
accounts (id, userId, provider, providerAccountId)
sessions (id, userId, expires, token)
verification_tokens (token, identifier, expires)

-- Exams & Syllabus
exams (id, slug, name, shortName, tagline, description, color, icon, configurableSyllabus)
subjects (id, examId, name, nameBn, weight, sortOrder)
topics (id, subjectId, name, mastery, accuracy, speed, retention, status, reviewDue)

-- Questions & Tests
questions (id, topicId, prompt, promptBn, options, optionsBn, correctIndex, explanation, difficulty, targetSeconds, tags)
tests (id, userId, examId, name, kind, subjectId, topicId, questionIds, durationMinutes, startedAt, completedAt)
question_attempts (id, testId, questionId, selectedIndex, correct, timeSpentSeconds, confidence, answeredAt)

-- Results & Performance
test_results (id, testId, userId, score, accuracy, speed, retention, percentile, correct, total, timeSpentMinutes, diagnosis, nextBestAction, targetTopicId, losses, completedAt)
performance (id, userId, examId, mastery, syllabusCoverage, consistency, accuracy, speed, retention, examReadiness, potentialScore, percentile, trajectory, studyHistory, streakDays, updatedAt)

-- AI & Strategy
ai_recommendations (id, userId, kind, severity, title, body, actionLabel, actionRoute, createdAt, readAt)
daily_tasks (id, userId, subject, topic, kind, durationMinutes, priority, impact, expectedQuestions, status, date)
roadmaps (id, userId, examId, examName, examDate, daysRemaining, currentMastery, targetMastery, dailyEffortMinutes, phases, priorities, updatedAt)

-- Memory & Revision
revision_items (id, userId, topicId, memoryStrength, lastReviewed, nextReview, overdue)
study_sessions (id, userId, date, minutes, tasks)

-- Subscriptions & Payments
subscriptions (id, userId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd)
invoices (id, userId, stripeInvoiceId, amount, status, createdAt)
```

### Indexes (Performance)

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_questions_topic ON questions(topicId);
CREATE INDEX idx_tests_user ON tests(userId, createdAt DESC);
CREATE INDEX idx_attempts_test ON question_attempts(testId);
CREATE INDEX idx_results_user ON test_results(userId, completedAt DESC);
CREATE INDEX idx_performance_user_exam ON performance(userId, examId);
CREATE INDEX idx_revision_user ON revision_items(userId, nextReview);
CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(userId, date);
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/social/:provider
POST   /api/auth/logout
GET    /api/auth/session
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Users
```
GET    /api/users/me
PUT    /api/users/me
DELETE /api/users/me
```

### Exams & Syllabus
```
GET    /api/exams
GET    /api/exams/:slug
GET    /api/exams/:slug/subjects
GET    /api/subjects/:id
GET    /api/topics/:id
```

### Questions & Practice
```
GET    /api/questions/:topicId
POST   /api/tests/build
GET    /api/tests/:id
POST   /api/tests/:id/submit
GET    /api/tests/:id/result
```

### Performance & Analytics
```
GET    /api/performance
GET    /api/performance/trajectory
GET    /api/performance/subjects
```

### AI & Strategy
```
GET    /api/strategy
POST   /api/strategy/regenerate
GET    /api/ai/recommendations
GET    /api/ai/briefing
POST   /api/ai/diagnose/:testId
```

### Memory & Revision
```
GET    /api/revision/items
POST   /api/revision/review
GET    /api/revision/schedule
```

### Dashboard
```
GET    /api/dashboard/daily-tasks
PUT    /api/dashboard/daily-tasks/:id
GET    /api/dashboard/quick-stats
```

### Rankings
```
GET    /api/rank/leaderboard
GET    /api/rank/me
```

### Payments
```
POST   /api/payments/checkout
POST   /api/payments/webhook
GET    /api/payments/subscription
POST   /api/payments/cancel
```

### Admin
```
GET    /api/admin/questions
POST   /api/admin/questions
PUT    /api/admin/questions/:id
DELETE /api/admin/questions/:id
GET    /api/admin/analytics
```

---

## AI Engine

| Component | Input | Process | Output |
|-----------|-------|---------|--------|
| **Strategy** | Performance, exam date, syllabus | Analyze weaknesses, calculate optimal path | Roadmap + daily tasks |
| **Adaptive Difficulty** | Question history, accuracy, speed | IRT / Elo rating | Next difficulty level (1-5) |
| **Diagnosis** | Test result (attempts, time) | Pattern analysis, error classification | Diagnosis + next best action |
| **Spaced Repetition** | Memory strength, review history | SM-2 algorithm | Next review date |

---

## Scalability

### Horizontal Scaling
- **API**: Stateless, behind load balancer
- **Workers**: BullMQ scale independently
- **Database**: Read replicas + connection pooling
- **Cache**: Redis cluster

### Caching Strategy
```
Layer 1: Browser (HTTP cache, service worker)
Layer 2: Edge (Vercel KV / Cloudflare)
Layer 3: Application (Upstash Redis)
Layer 4: Database (PostgreSQL materialized views)
```

### Rate Limiting
```
Auth:     5 req/min per IP
API:      100 req/min per user
AI:       10 req/min per user
WebSocket: 1 connection per user
```

---

## Security

- JWT with HTTP-only cookies + CSRF protection
- Zod input validation on all endpoints
- Prisma parameterized queries (no SQL injection)
- React auto-escaping + CSP headers (no XSS)
- Per-IP and per-user rate limiting
- Row-level security (RLS) in PostgreSQL
- TLS everywhere, encrypted at rest
- Environment variables for secrets
- Audit log for sensitive operations

---

## Real-time Events

```
progress:update      — live performance changes
task:completed       — daily task marked done
recommendation:new   — AI generated new recommendation
streak:milestone     — study streak milestone
ranking:updated      — leaderboard position change
```

---

## Deployment

```
Frontend:  Vercel (CDN, Edge, auto-deploy from GitHub)
API:       Vercel Edge Functions (REST) + Railway (Workers)
Database:  Supabase (PostgreSQL + Auth + Realtime)
Cache:     Upstash Redis (serverless-friendly)
Storage:   Cloudflare R2 (images, uploads)
AI:        OpenAI API (strategy, diagnosis)
Payments:  Stripe (subscriptions)
Email:     Resend (transactional)
Queue:     BullMQ + Redis (background jobs)
Monitor:   Sentry (errors) + Axiom (logs)
```

---

## Frontend Integration

The frontend depends on `lib/api.ts`. The backend swap is clean:

```ts
// Before (mock)
export const api = {
  getUser: () => withLoading(data.user),
  listExams: () => withLoading(data.exams),
}

// After (real)
export const api = {
  getUser: () => fetch('/api/users/me').then(r => r.json()),
  listExams: () => fetch('/api/exams').then(r => r.json()),
}
```

### Auth Flow
1. Landing page → public (no auth)
2. "Start Preparing" → `/onboarding`
3. Onboarding complete → creates account
4. JWT cookie set → authenticated session
5. `/dashboard/*` routes → auth check → redirect if unauthenticated

---

## Implementation Phases

| Phase | Weeks | Deliverables |
|-------|-------|-------------|
| **1: Foundation** | 1-2 | DB schema, Prisma, Auth, User CRUD, API framework |
| **2: Core Data** | 3-4 | Exams, Subjects, Questions, Tests, Performance |
| **3: AI Engine** | 5-6 | Strategy, Adaptive Difficulty, Diagnosis, Daily Tasks |
| **4: Memory** | 7 | SM-2 Spaced Repetition, Review Scheduling |
| **5: Payments** | 8 | Stripe, Subscriptions, Feature Gating |
| **6: Real-time** | 9-10 | WebSocket, Email, Rate Limiting, Monitoring |
| **7: Scale** | 11-12 | Read Replicas, Cache, Partitioning, Hardening |

---

## Estimated Cost (1000 users)

| Service | Monthly |
|---------|---------|
| Supabase (Pro) | $25 |
| Upstash Redis | $10 |
| Vercel (Pro) | $20 |
| Railway (Workers) | $10 |
| OpenAI API | $50-200 |
| Stripe | 2.9% + $0.30/txn |
| Resend | $20 |
| Sentry | $26 |
| Cloudflare R2 | $5 |
| **Total** | **~$170-320/mo** |

---

## Verification Checklist

- [ ] Auth: register → login → session → logout
- [ ] Onboarding: creates user, generates initial strategy
- [ ] Dashboard: real performance data, daily tasks, AI briefing
- [ ] Practice: adaptive questions, real-time difficulty
- [ ] Mock test: timed, graded, diagnosis generated
- [ ] Strategy: AI-generated roadmap with daily plan
- [ ] Memory: spaced repetition scheduling
- [ ] Payments: Stripe checkout → subscription → feature access
- [ ] Real-time: WebSocket updates on test completion
- [ ] Scale: 100 concurrent users, <200ms API response
