# 9Th-Grade AI — Pre-Launch Requirements

Everything you need (accounts, credentials, APIs, config) to take the product
from local dev to a working, launched full-stack app. Marked **Required** vs
**Optional**. The full deployment steps live in `LAUNCH.md`; this is the
checklist of what to obtain.

---

## Summary — what's truly required to launch

The product **cannot work at all** without:
1. A **hosted database** (`DATABASE_URL`) — the API has no storage.
2. A real **`JWT_SECRET`** and **`ADMIN_EMAIL`**.
3. Frontend↔API wiring: **`VITE_API_URL`** and **`FRONTEND_URL`**.

Everything else (Stripe, email, Redis, AI, monitoring) can ship in mock/optional
mode and be enabled after launch.

---

## 1. Database — REQUIRED (hard blocker)

| Item | Value / format | Where to get it |
|------|----------------|-----------------|
| Hosted Postgres | `DATABASE_URL` connection string, e.g. `postgresql://user:pass@host:5432/db?sslmode=require` | **Supabase** (free tier) or **Neon** (free tier) or AWS RDS |

**Why:** the backend reads `DATABASE_URL` from `backend/.env`. It currently points
at your **local** Postgres (`localhost:5432`), which a cloud server cannot reach.

**Setup once you have it:**
- `cd backend && npx prisma migrate deploy` (creates schema)
- `npm run seed` (loads the exam/subject/question catalog)

## 2. Authentication — REQUIRED

| Item | Value / format | Where to get it |
|------|----------------|-----------------|
| `JWT_SECRET` | Any long random string (≥32 bytes) | Generate: `openssl rand -hex32`. **Do not ship the dev value.** |
| `ADMIN_EMAIL` | Your email address | Your own; that user is promoted to admin on boot. |

Auth is self-hosted JWT (no third-party API required).

## 3. Frontend / API wiring — REQUIRED

| Item | Value / format | Where to get it |
|------|----------------|-----------------|
| `FRONTEND_URL` | Deployed frontend origin, e.g. `https://your-app.vercel.app` | Your Vercel deployment URL |
| `VITE_API_URL` | Deployed API origin, e.g. `https://api.yourdomain.com` or `/api` (proxied) | Your API host |
| Vercel account + token | `9thgradeai` (already authenticated) | vercel.com |

---

## 4. Payments — Stripe (REQUIRED for subscriptions, OPTIONAL for launch)

| Item | Value / format | Where to get it |
|------|----------------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` → `sk_live_...` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Developers → Webhooks (create endpoint → `POST /api/payments/webhook`) |
| `STRIPE_PRICE_PRO` | `price_...` | Stripe Dashboard → Products → create "pro" recurring price |

**Until set:** the backend runs in **mock mode** (`GET /api/health` reports
`mock.stripe: true`); checkouts return a fake session. Flip to live by adding the keys.

## 5. Email — Resend (REQUIRED for transactional email, OPTIONAL for launch)

| Item | Value / format | Where to get it |
|------|----------------|-----------------|
| `RESEND_API_KEY` | `re_...` | Resend dashboard |
| `EMAIL_FROM` | Verified sender, e.g. `noreply@yourdomain.com` | Resend → Domains (verify DNS) |

**Until set:** emails are **logged as mock** lines in the server log; nothing is sent.

## 6. Cache — Upstash Redis (OPTIONAL, recommended for production)

| Item | Value / format | Where to get it |
|------|----------------|-----------------|
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | auth token | Upstash console |

**Until set:** cache falls back to in-memory (works; not shared across server
instances — fine for a single instance, replace for horizontal scaling).

## 7. AI — OpenAI (OPTIONAL)

| Item | Value / format | Where to get it |
|------|----------------|-----------------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI platform |

**Until set:** the AI engine runs its **rule-based** implementation (the seam
for the real LLM exists). No key needed to function.

## 8. Observability — OPTIONAL (post-launch)

| Item | Where to get it |
|------|-----------------|
| Sentry DSN (error tracking) | Sentry |
| Axiom token (logs) | Axiom |

## 9. Domain & DNS — OPTIONAL (recommended)

| Item | Where to get it |
|------|-----------------|
| A domain, e.g. `9thgradeai.com` | Registrar (Namecheap/Cloudflare/etc.) |
| DNS records | `www` → Vercel, `api` → API host |

---

## Complete env checklist

### Backend (`backend/.env`)
- [ ] `DATABASE_URL` — hosted Postgres ✅ **REQUIRED**
- [ ] `JWT_SECRET` — real random secret ✅ **REQUIRED**
- [ ] `FRONTEND_URL` ✅ **REQUIRED**
- [ ] `ADMIN_EMAIL` ✅ **REQUIRED**
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_PRO` (subscriptions)
- [ ] `RESEND_API_KEY` / `EMAIL_FROM` (email)
- [ ] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (cache)
- [ ] `OPENAI_API_KEY` (real LLM)

### Frontend (`.env.local`)
- [ ] `VITE_API_URL` — deployed API origin ✅ **REQUIRED**

---

## Accounts you need to create (none yet exist for this project)

1. **Supabase or Neon** — hosted Postgres (free tier is enough to launch).
2. **Stripe** — payments.
3. **Resend** — email (verify a sending domain).
4. **Upstash** — Redis (optional).
5. **OpenAI** — optional.
6. **Sentry / Axiom** — optional monitoring.
7. **Domain registrar** — optional.

---

## Minimum viable launch set
If you only set these, the product runs end-to-end (payments/email in mock mode):

```
DATABASE_URL      # Supabase/Neon
JWT_SECRET        # real random value
ADMIN_EMAIL       # your email
FRONTEND_URL      # deployed frontend
VITE_API_URL      # deployed API
```
