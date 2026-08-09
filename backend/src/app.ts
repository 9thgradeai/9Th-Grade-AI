import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { PrismaClient } from '@prisma/client'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { examRoutes } from './routes/exams'
import { questionRoutes } from './routes/questions'
import { testRoutes } from './routes/tests'
import { performanceRoutes } from './routes/performance'
import { dashboardRoutes } from './routes/dashboard'
import { rankRoutes } from './routes/rank'
import { strategyRoutes } from './routes/strategy'
import { authMiddleware } from './middleware/auth'
import type { AppEnv } from './types/env'

/* ============================================================
   9Th-Grade AI — API Server
   Hono framework, Prisma ORM, JWT auth.
   ============================================================ */

export const prisma = new PrismaClient()

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public routes
app.route('/api/auth', authRoutes)

// Protected routes
const protectedApp = new Hono<AppEnv>()
protectedApp.use('*', authMiddleware)
protectedApp.route('/users', userRoutes)
protectedApp.route('/exams', examRoutes)
protectedApp.route('/questions', questionRoutes)
protectedApp.route('/tests', testRoutes)
protectedApp.route('/performance', performanceRoutes)
protectedApp.route('/dashboard', dashboardRoutes)
protectedApp.route('/rank', rankRoutes)
protectedApp.route('/', strategyRoutes)

app.route('/api', protectedApp)

// 404
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export { app }
