import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { rateLimit } from '../middleware/rateLimit'
import { cacheGet, cacheSet, cacheDel, cacheKey } from '../lib/cache'
import { buildRoadmap, diagnoseTest, planDailyTasks } from '../lib/ai'

/* ============================================================
   Strategy & AI routes — roadmap, recommendations, briefing,
   diagnosis. The rule-based engine in lib/ai is the single source
   of truth; an LLM provider can replace it later without touching
   this layer.

   The whole surface (/strategy, /strategy/*, /ai/*) is a paid
   feature — gated behind `ai-strategy`.
   ============================================================ */

export const strategyRoutes = new Hono<AppEnv>()

// AI endpoints are the most expensive: 10 req / min / user.
strategyRoutes.use('/ai/*', rateLimit({
  windowMs: 60_000,
  max: 10,
  key: (c) => c.get('userId') as string | undefined,
}))

/** The user's primary exam: first with activity, else the first catalog exam. */
async function primaryExam(userId: string) {
  const withActivity = await prisma.testResult.findFirst({
    where: { userId },
    select: { test: { select: { examId: true } } },
    orderBy: { completedAt: 'desc' },
  })
  const examId = withActivity?.test.examId
  if (examId) {
    return prisma.exam.findUnique({ where: { id: examId } })
  }
  return prisma.exam.findFirst({ orderBy: { name: 'asc' } })
}

const DEFAULT_EXAM_DATE = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

function serializeRoadmap(r: {
  examName: string
  daysRemaining: number
  currentMastery: number
  targetMastery: number
  dailyEffortMinutes: number
  phases: string | null
  priorities: string | null
}) {
  return {
    examName: r.examName,
    daysRemaining: r.daysRemaining,
    currentMastery: r.currentMastery,
    targetMastery: r.targetMastery,
    dailyEffortMinutes: r.dailyEffortMinutes,
    phases: r.phases ? JSON.parse(r.phases) : [],
    priorities: r.priorities ? JSON.parse(r.priorities) : [],
  }
}

async function upsertRoadmap(
  userId: string,
  examId: string,
  examName: string,
  examDate: Date,
  targetMastery: number,
) {
  const data = await buildRoadmap({ userId, examId, examName, examDate, targetMastery })
  const roadmap = await prisma.roadmap.upsert({
    where: { userId_examId: { userId, examId } },
    update: {
      examDate: data.examDate,
      daysRemaining: data.daysRemaining,
      currentMastery: data.currentMastery,
      targetMastery: data.targetMastery,
      dailyEffortMinutes: data.dailyEffortMinutes,
      phases: JSON.stringify(data.phases),
      priorities: JSON.stringify(data.priorities),
    },
    create: {
      userId,
      examId,
      examName: data.examName,
      examDate: data.examDate,
      daysRemaining: data.daysRemaining,
      currentMastery: data.currentMastery,
      targetMastery: data.targetMastery,
      dailyEffortMinutes: data.dailyEffortMinutes,
      phases: JSON.stringify(data.phases),
      priorities: JSON.stringify(data.priorities),
    },
  })
  return serializeRoadmap(roadmap)
}

// GET /api/strategy — current roadmap (created on first visit if missing).
strategyRoutes.get('/strategy', async (c) => {
  const userId = c.get('userId') as string
  const key = cacheKey('strategy', userId)
  const cached = await cacheGet(key)
  if (cached) return c.json(cached)

  const exam = await primaryExam(userId)
  if (!exam) return c.json({ error: 'No exam configured' }, 500)

  const existing = await prisma.roadmap.findUnique({
    where: { userId_examId: { userId, examId: exam.id } },
  })
  const body = existing
    ? { examId: exam.id, roadmap: serializeRoadmap(existing) }
    : await upsertRoadmap(userId, exam.id, exam.name, DEFAULT_EXAM_DATE, 90).then((roadmap) => ({
        examId: exam.id,
        roadmap,
      }))

  await cacheSet(key, body, 300)
  return c.json(body)
})

const regenSchema = z.object({
  examDate: z.string().datetime().optional(),
  targetMastery: z.number().int().min(50).max(100).optional(),
})

// POST /api/strategy/regenerate
strategyRoutes.post('/strategy/regenerate', async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json().catch(() => ({}))
  const parsed = regenSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }
  const exam = await primaryExam(userId)
  if (!exam) return c.json({ error: 'No exam configured' }, 500)

  const examDate = parsed.data.examDate ? new Date(parsed.data.examDate) : DEFAULT_EXAM_DATE
  const roadmap = await upsertRoadmap(userId, exam.id, exam.name, examDate, parsed.data.targetMastery ?? 90)

  // Strategy changed — drop the cached roadmap/briefing for this user.
  await cacheDel(cacheKey('strategy', userId))
  await cacheDel(cacheKey('briefing', userId))

  return c.json({ examId: exam.id, roadmap })
})

// GET /api/ai/recommendations?unread=true
strategyRoutes.get('/ai/recommendations', async (c) => {
  const userId = c.get('userId') as string
  const unread = c.req.query('unread') === 'true'
  const recs = await prisma.aIRecommendation.findMany({
    where: { userId, ...(unread ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return c.json({ recommendations: recs })
})

// PATCH /api/ai/recommendations/:id — mark read
strategyRoutes.patch('/ai/recommendations/:id', async (c) => {
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const rec = await prisma.aIRecommendation.findFirst({ where: { id, userId } })
  if (!rec) return c.json({ error: 'Recommendation not found' }, 404)
  const updated = await prisma.aIRecommendation.update({
    where: { id },
    data: { readAt: new Date() },
  })
  return c.json(updated)
})

// GET /api/ai/briefing
strategyRoutes.get('/ai/briefing', async (c) => {
  const userId = c.get('userId') as string
  const key = cacheKey('briefing', userId)
  const cached = await cacheGet(key)
  if (cached) return c.json(cached)

  const exam = await primaryExam(userId)
  if (!exam) return c.json({ error: 'No exam configured' }, 500)

  const [roadmap, recs, tasks] = await Promise.all([
    prisma.roadmap.findUnique({ where: { userId_examId: { userId, examId: exam.id } } }),
    prisma.aIRecommendation.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.dailyTask.findMany({
      where: { userId, status: 'pending' },
      orderBy: { priority: 'asc' },
      take: 3,
    }),
  ])

  const items: string[] = []
  if (roadmap?.priorities) {
    const p = JSON.parse(roadmap.priorities) as string[]
    if (p[0]) items.push(`Lead with your highest-impact gap: ${p[0]}.`)
  }
  if (recs[0]) items.push(recs[0].body)
  if (tasks[0]) items.push(`Today: ${tasks[0].kind} on ${tasks[0].topic} (${tasks[0].durationMinutes} min).`)
  if (roadmap) {
    items.push(`${roadmap.daysRemaining} days to ${roadmap.examName} — stay on the ${roadmap.phases ? JSON.parse(roadmap.phases)[0]?.title : 'plan'} phase.`)
  }
  if (items.length === 0) items.push('Run a diagnostic test to unlock your AI briefing.')

  const briefing = { id: `brief_${Date.now()}`, title: 'AI Daily Briefing', items }
  await cacheSet(key, { briefing }, 60)
  return c.json({ briefing })
})

// POST /api/ai/diagnose/:testId
strategyRoutes.post('/ai/diagnose/:testId', async (c) => {
  const userId = c.get('userId') as string
  const testId = c.req.param('testId')
  const test = await prisma.test.findFirst({
    where: { id: testId, userId },
    include: { result: true },
  })
  if (!test) return c.json({ error: 'Test not found' }, 404)
  if (!test.result) return c.json({ error: 'Result not available yet' }, 404)

  const diagnosis = await diagnoseTest(testId, userId)
  return c.json({ diagnosis })
})

// GET /api/ai/daily-plan — convenience for the dashboard to fetch an AI plan.
strategyRoutes.get('/ai/daily-plan', async (c) => {
  const userId = c.get('userId') as string
  const exam = await primaryExam(userId)
  if (!exam) return c.json({ error: 'No exam configured' }, 500)
  const tasks = await planDailyTasks(userId, exam.id, 3)
  return c.json({ tasks })
})
