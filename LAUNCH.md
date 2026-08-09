# 9Th-Grade AI — Launch Plan

Goal: take the product from "backend done + frontend shell" to a live, working,
launchable product. Backend feature work is complete (Phases 1–8). The remaining
work is frontend wiring, deployment, credentials, and hardening — in that order.

---

## Credentials & APIs required

### Backend environment (`backend/.env`)

| Variable | Provider / how to get | Required | Notes |
|----------|----------------------|:--------:|-------|
| `DATABASE_URL` | Supabase, Neon, or RDS (hosted Postgres) | ✅ | Create a project, copy the pooled connection string. Run `prisma migrate deploy` against it. |
| `JWT_SECRET` | You generate | ✅ | `openssl rand -hex 32`. Used for auth tokens. |
| `FRONTEND_URL` | Deployed frontend origin | ✅ | CORS allowlist, e.g. `https://9thgradeai.vercel.app`. |
| `ADMIN_EMAIL` | Your email | ✅ | User with this email is promoted to admin on boot. |
| `STRIPE_SECRET_KEY` | Stripe dashboard | ⏸ for launch | Live-mode key (keep test key until go-live). |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → webhook | ⏸ for launch | Required to verify payment webhooks in production. |
| `STRIPE_PRICE_PRO` | Stripe product/price id | ⏸ for launch | The "pro" subscription price id. |
| `RESEND_API_KEY` | Resend dashboard | ⏸ for launch | Transactional email. Verify a sending domain first. |
| `EMAIL_FROM` | Resend-verified sender | ⏸ | e.g. `9Th-Grade AI <noreply@yourdomain.com>`. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash | ⏸ optional | Shared cache + rate-limit store (correct across instances). Falls back to in-memory. |
| `NODE_ENV` / `PORT` | Runtime | ✅ | Set by host; `NODE_ENV=production`. |
| `OPENAI_API_KEY` | OpenAI | ⏸ optional | Only needed if you enable the real LLM AI engine. |

> ⏸ = not a launch blocker (the app falls back to mock/test/in-memory for those).
> ✅ = required for any working deployment.

### Frontend environment (`.env.local` / Vite)

| Variable | Value | Required | Notes |
|----------|-------|:--------:|-------|
| `VITE_API_URL` | Deployed API origin, e.g. `https://api.9thgradeai.com` | ✅ | Base URL the UI fetches. See **Auth transport** below. |

### External services to sign up for
1. **Hosted Postgres** — Supabase (free tier) or Neon (auth + DB in one) or RDS.
2. **Vercel** — deploy the frontend (and optionally the API as Functions).
3. **Stripe** — payments (test mode → live at go-live).
4. **Resend** — transactional email (verify domain).
5. **Upstash** — Redis cache (optional).
6. **OpenAI** — optional AI engine.
7. **Sentry + Axiom** — optional monitoring.
8. **Domain + DNS** — e.g. `9thgradeai.com`; point `www` → Vercel, `api` → API host.

---

## Phase A — Frontend Integration (blocker #1)

The UI reads mock data. Rewrite the service layer to call the real API.

- **A1. HTTP client** — add a `fetch` wrapper in `src/lib/http.ts`:
  - base URL from `import.meta.env.VITE_API_URL`, `credentials`-aware, JSON error handling.
- **A2. Auth transport** — the backend accepts a token via **cookie or `Authorization: Bearer`**.
  For cross-origin simplicity and reliability, store the returned `token` and send the
  `Authorization` header (avoids SameSite/cookie pitfalls across domains). Wire
  register/login/logout/session and a 401 → redirect-to-login guard.
- **A3. Replace `api.*` bodies** — swap each `withLoading(data.*)` for a `fetch` call
  to the matching route (see route map below). The service layer comment already
  guarantees components don't change.
- **A4. Wire pages** — Dashboard, Subject, Topic, MockTest, Rank, Onboarding, Strategy
  render real data; add loading/empty/error states.
- **A5. Local dev proxy** — Vite `server.proxy` `/api` → `http://localhost:3001` so
  dev works with `VITE_API_URL=/api`.
- **A6. Verify each page in the browser** against the live backend.

### API route map (backend → frontend)
| Frontend call | Endpoint |
|---------------|----------|
| auth | `POST /api/auth/register` `login` `logout`, `GET /session` |
| exams/subjects | `GET /api/exams`, `GET /api/exams/:slug/subjects` |
| questions | `GET /api/questions/:topicId` |
| tests | `POST /api/tests/build`, `GET /api/tests/:id`, `POST /:id/submit`, `GET /:id/result` |
| performance | `GET /api/performance` |
| dashboard | `GET /api/dashboard/quick-stats`, `GET /api/dashboard/daily-tasks`, `PATCH /:id` |
| rank | `GET /api/rank/leaderboard`, `GET /api/rank/me` |
| strategy | `GET /api/strategy`, `POST /api/strategy/regenerate` |
| ai | `GET /api/ai/briefing`, `GET /api/ai/recommendations`, `POST /api/ai/diagnose/:testId` |
| revision | `GET /api/revision/items`, `GET /api/revision/schedule`, `POST /api/revision/review` |
| payments | `GET /api/payments/subscription`, `POST /api/payments/checkout` `cancel` |

## Phase B — Deployment scaffold (blocker #2)

- **B1. Database** — provision hosted Postgres; `prisma migrate deploy` (not `db push`) for schema; seed the catalog.
- **B2. Deploy the API** — Vercel Functions (Fluid Compute) or Railway/Fly; set all backend env vars; enable the `/api/payments/webhook` as a public route.
- **B3. Deploy the frontend** — Vercel; set `VITE_API_URL`; connect the domain.
- **B4. CORS + cookies** — confirm CORS origin matches `FRONTEND_URL`; decide cookie vs `Authorization` header for auth (A2).
- **B5. Stripe webhook** — configure the webhook URL; set `STRIPE_WEBHOOK_SECRET`; run a test checkout.
- **B6. Smoke test** — register → login → build/test → performance → rank → subscription.

## Phase C — Automated tests + CI

- **C1. Unit tests** — grading math (`lib/score`), SM-2 (`lib/sm2`), AI difficulty/diagnosis (`lib/ai`), rate-limit.
- **C2. Integration tests** — auth, test lifecycle, admin, payments (mock).
- **C3. CI/CD** — GitHub Actions: `lint → test → build` on PR; migrate + deploy on merge to `main`.

## Phase D — Auth-flow polish

- **D1.** Password-reset + email-verification UI (backend endpoints exist).
- **D2.** Protected-route guards + session expiry handling in the frontend.

## Phase E — Post-launch hardening (non-blocking)

- **E1.** Real LLM AI engine (OpenAI) — rule-based engine is already the seam.
- **E2.** Sentry (errors) + Axiom (logs).
- **E3.** Read replicas, mat-views, partitioning, Redis cluster (Phase7 runbook).
- **E4.** WebSocket transport upgrade for realtime (currently SSE).
- **E5.** Privacy policy, terms, consent.

---

## Go-live checklist
- [ ] Frontend loads real data on all pages (Phase A)
- [ ] API + frontend deployed to production URLs (Phase B)
- [ ] `prisma migrate deploy` applied; catalog seeded
- [ ] Real `JWT_SECRET` set; admin promoted via `ADMIN_EMAIL`
- [ ] Stripe test checkout + webhook verified (then live keys)
- [ ] Email sending verified via Resend (domain verified)
- [ ] Tests + CI green (Phase C)
- [ ] Health endpoint `200`; password reset + verification work (Phase D)

---

## Recommended next step
Start with **Phase A — Frontend Integration**, which turns the product from a shell
into a working app. I can begin by adding the HTTP client and rewriting `api.ts`,
then wiring each page.
