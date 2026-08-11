import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { compress } from 'hono/compress'
import { PrismaClient } from '@prisma/client'
import { structuredLogger } from './middleware/logger'
import { rateLimit } from './middleware/rateLimit'
import { securityHeaders } from './middleware/security'
import { cacheMode } from './lib/cache'
import { initSentry, captureError } from './lib/sentry'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { examRoutes } from './routes/exams'
import { questionRoutes } from './routes/questions'
import { testRoutes } from './routes/tests'
import { performanceRoutes } from './routes/performance'
import { dashboardRoutes } from './routes/dashboard'
import { rankRoutes } from './routes/rank'
import { strategyRoutes } from './routes/strategy'
import { revisionRoutes } from './routes/revision'
import { paymentsRoutes, webhookRoute } from './routes/payments'
import { realtimeRoutes } from './routes/realtime'
import { adminRoutes } from './routes/admin'
import { authMiddleware } from './middleware/auth'
import { roleGuard } from './middleware/rbac'
import type { AppEnv } from './types/env'

/* ============================================================
   9Th-Grade AI — API Server
   Hono framework, Prisma ORM, JWT auth.
   ============================================================ */

export const prisma = new PrismaClient()

// Sentry — no-op unless SENTRY_DSN is set.
initSentry()

const app = new Hono()

// Global middleware
app.use('*', structuredLogger)
app.use('*', compress())
app.use('*', securityHeaders)
// CORS: allow the frontend origin(s). `ALLOWED_ORIGINS` (comma-separated) lets
// us permit BOTH the deployed frontend and localhost dev without a redeploy;
// falls back to FRONTEND_URL, then the Vite dev origin. Brief §17: never `*`.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
app.use('*', cors({
  origin: allowedOrigins,
  credentials: true,
}))

// Health / readiness check (Phase 6 monitoring)
app.get('/api/health', async (c) => {
  let db = 'ok'
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    db = 'down'
  }
  return c.json({
    status: db === 'ok' ? 'ok' : 'degraded',
    db,
    uptime: Math.floor(process.uptime()),
    mode: process.env.NODE_ENV || 'development',
    cache: cacheMode,
    mock: {
      stripe: !process.env.STRIPE_SECRET_KEY,
      email: !process.env.RESEND_API_KEY,
    },
    timestamp: new Date().toISOString(),
  })
})

// Public routes
app.route('/api/auth', authRoutes)

// Protected routes
const protectedApp = new Hono<AppEnv>()
protectedApp.use('*', authMiddleware)
// General API limit: 100 req / min / user (auth ran above, so userId is set).
protectedApp.use('*', rateLimit({ windowMs: 60_000, max: 100, key: (c) => c.get('userId') as string | undefined }))
protectedApp.route('/users', userRoutes)
protectedApp.route('/exams', examRoutes)
protectedApp.route('/questions', questionRoutes)
protectedApp.route('/tests', testRoutes)
protectedApp.route('/performance', performanceRoutes)
protectedApp.route('/dashboard', dashboardRoutes)
protectedApp.route('/rank', rankRoutes)
// Paid-feature gates for /strategy, /ai/*, /revision/* live inside their route
// modules (featureGate.use('*', ...)) so subpaths are matched reliably.
protectedApp.route('/', strategyRoutes)
protectedApp.route('/revision', revisionRoutes)
protectedApp.route('/payments', paymentsRoutes)
protectedApp.route('/realtime', realtimeRoutes)
protectedApp.use('/admin', roleGuard('admin'))
protectedApp.route('/admin', adminRoutes)

// Public webhook — mounted outside auth (before /api) so Stripe can reach it.
app.route('/api/payments/webhook', webhookRoute)

app.route('/api', protectedApp)

// 404
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler — brief §43: never expose stack traces or internal details.
app.onError((err, c) => {
  const rid = c.req.header('x-request-id') ?? crypto.randomUUID()
  console.error(JSON.stringify({ level: 'error', request_id: rid, route: c.req.path, message: err.message }))
  captureError(err, { route: c.req.path, requestId: rid })
  return c.json({ error: 'Internal server error', requestId: rid }, 500)
})

export { app }
