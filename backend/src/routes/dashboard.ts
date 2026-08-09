import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { planDailyTasks } from '../lib/ai'

/* ============================================================
   Dashboard routes — quick stats + a rule-based daily task plan.
   The full AI planner arrives in Phase 3; this generates a sensible
   default from the user's weakest topics.
   ============================================================ */

export const dashboardRoutes = new Hono<AppEnv>()

// GET /api/dashboard/quick-stats
dashboardRoutes.get('/quick-stats', async (c) => {
  const userId = c.get('userId') as string

  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)
  const startWeek = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)

  const [todaySessions, weekSessions, perf, results] = await Promise.all([
    prisma.studySession.aggregate({
      where: { userId, date: { gte: startToday } },
      _sum: { minutes: true },
    }),
    prisma.studySession.aggregate({
      where: { userId, date: { gte: startWeek } },
      _sum: { minutes: true },
    }),
    prisma.performance.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.testResult.aggregate({
      where: { userId },
      _sum: { total: true },
      _count: true,
    }),
  ])

  return c.json({
    todayMinutes: todaySessions._sum.minutes ?? 0,
    weeklyMinutes: weekSessions._sum.minutes ?? 0,
    streakDays: perf?.streakDays ?? 0,
    avgAccuracy: perf?.accuracy ?? 0,
    testsTaken: results._count,
    questionsAnswered: results._sum.total ?? 0,
  })
})

// GET /api/dashboard/daily-tasks — returns today's plan, generating it if needed.
dashboardRoutes.get('/daily-tasks', async (c) => {
  const userId = c.get('userId') as string
  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)

  const existing = await prisma.dailyTask.findMany({
    where: { userId, date: { gte: startToday } },
    orderBy: { priority: 'asc' },
  })
  if (existing.length > 0) return c.json({ tasks: existing })

  // No plan yet today — the AI engine plans it from the weakest topics.
  const examId =
    (await prisma.testResult
      .findFirst({ where: { userId }, select: { test: { select: { examId: true } } } })
      .then((r) => r?.test.examId)) ??
    (await prisma.exam.findFirst())?.id
  if (!examId) return c.json({ error: 'No exam configured' }, 500)

  const plan = await planDailyTasks(userId, examId, 3)
  const created = await prisma.dailyTask.createManyAndReturn({ data: plan })
  return c.json({ tasks: created })
})

const taskSchema = z.object({ status: z.enum(['pending', 'done']) })

// PATCH /api/dashboard/daily-tasks/:id
dashboardRoutes.patch('/daily-tasks/:id', async (c) => {
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = taskSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const task = await prisma.dailyTask.findFirst({ where: { id, userId } })
  if (!task) return c.json({ error: 'Task not found' }, 404)

  const updated = await prisma.dailyTask.update({
    where: { id },
    data: { status: parsed.data.status },
  })
  return c.json(updated)
})
