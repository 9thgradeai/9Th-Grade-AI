import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import {
  computePercentile,
  computeTestResult,
  refreshPerformance,
  type GradedQuestion,
} from '../lib/score'
import { diagnoseTest, recommendDifficulty } from '../lib/ai'
import { realtime } from '../lib/realtime'
import { sendEmail } from '../lib/email'
import { cacheDel, cacheKey } from '../lib/cache'
import { featureAllowed, lockedResponse } from '../middleware/featureGate'
import { getPlan } from '../lib/subscription'

/* ============================================================
   Test lifecycle — build, take, submit, grade.
   Correct answers never leave the server; grading is server-side.
   ============================================================ */

export const testRoutes = new Hono<AppEnv>()

// Fisher-Yates shuffle (in place).
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Strip answer data before sending questions to the client. */
function sanitize(q: {
  id: string
  topicId: string
  difficulty: number
  targetSeconds: number
  content?: { correctIndex?: number; explanation?: string; prompt?: string; promptBn?: string; options?: unknown } | null
  [key: string]: unknown
}) {
  const { content, ...safe } = q
  const base: Record<string, unknown> = { ...safe }
  if (content) {
    base.prompt = content.prompt
    base.promptBn = content.promptBn
    base.options = Array.isArray(content.options)
      ? (content.options as Record<string, string>[]).map((o) => o.text ?? o)
      : content.options
  }
  return base
}

const buildSchema = z.object({
  examId: z.string().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
  count: z.number().int().min(1).max(50).optional(),
  name: z.string().optional(),
  kind: z.string().optional(),
  /** AI-adaptive: bias the sampled questions to the user's current level. */
  adaptive: z.boolean().optional(),
})

// POST /api/tests/build
testRoutes.post('/build', async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const parsed = buildSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }
  const { examId, subjectId, topicId, count = 10, name, kind, adaptive } = parsed.data

  // Paid feature gate first — a free user gets a clear 402 regardless of data.
  // Diagnostic / topic / subject practice stays free for all authenticated users.
  const effectiveKind = kind ?? (topicId ? 'topic' : examId ? 'diagnostic' : 'mock')
  if (adaptive) {
    const allowed = await featureAllowed(userId, 'adaptive-tests')
    if (!allowed) return lockedResponse(c, 'adaptive-tests', await getPlan(userId))
  }
  if (effectiveKind === 'mock') {
    const allowed = await featureAllowed(userId, 'mock-tests')
    if (!allowed) return lockedResponse(c, 'mock-tests', await getPlan(userId))
  }

  // Resolve scope. A more specific scope wins.
  let scopeWhere = {}
  let resolvedExamId = examId
  let resolvedSubjectId = subjectId

  if (topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true },
    })
    if (!topic) return c.json({ error: 'Topic not found' }, 404)
    resolvedExamId = topic.subject.examId
    resolvedSubjectId = topic.subjectId
    scopeWhere = { topicId }
  } else if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) return c.json({ error: 'Subject not found' }, 404)
    resolvedExamId = subject.examId
    scopeWhere = { topic: { subjectId } }
  } else if (examId) {
    scopeWhere = { topic: { subject: { examId } } }
  }

  if (!resolvedExamId) {
    const first = await prisma.exam.findFirst({ orderBy: { name: 'asc' } })
    if (!first) return c.json({ error: 'No exam configured' }, 500)
    resolvedExamId = first.id
    scopeWhere = { topic: { subject: { examId: first.id } } }
  }

  // Sample the question pool for this scope.
  const pool = await prisma.question.findMany({
    where: scopeWhere,
    include: {
      topic: { include: { subject: true } },
      content: { select: { correctIndex: true } },
    },
  })
  if (pool.length === 0) {
    return c.json({ error: 'No questions available for this scope' }, 404)
  }

  // AI-adaptive sampling: bias toward the user's recommended difficulty.
  let sampledPool = pool
  if (adaptive) {
    const level = await recommendDifficulty(userId, resolvedSubjectId ?? undefined)
    const near = pool.filter((q) => Math.abs(q.difficulty - level) <= 1)
    if (near.length > 0) sampledPool = near
  }

  const selected = shuffle(sampledPool).slice(0, Math.min(count, sampledPool.length))
  const questionIds = selected.map((q) => q.id)
  const durationMinutes = Math.max(1, Math.round(selected.reduce((s, q) => s + q.targetSeconds, 0) / 60))

  const testName = name ?? `Practice ${topicId ? 'Session' : 'Mock'}`

  const test = await prisma.test.create({
    data: {
      userId,
      examId: resolvedExamId,
      subjectId: resolvedSubjectId,
      topicId,
      name: testName,
      kind: effectiveKind,
      questionIds,
      durationMinutes,
    },
  })

  return c.json({
    test: {
      id: test.id,
      name: test.name,
      kind: test.kind,
      examId: test.examId,
      durationMinutes: test.durationMinutes,
      totalQuestions: questionIds.length,
      createdAt: test.startedAt,
    },
    questions: selected.map((q) => sanitize(q)),
  })
})

// GET /api/tests/:id — load (or resume) a test for the current user.
testRoutes.get('/:id', async (c) => {
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const test = await prisma.test.findFirst({
    where: { id, userId },
    include: {
      attempts: true,
      result: true,
    },
  })
  if (!test) return c.json({ error: 'Test not found' }, 404)

  const questions = await prisma.question.findMany({
    where: { id: { in: test.questionIds } },
    include: { topic: { include: { subject: true } } },
  })

  return c.json({
    test,
    questions: questions.map((q) => sanitize(q)),
    attempts: test.attempts,
    result: test.result,
  })
})

const submitSchema = z.object({
  attempts: z.array(
    z.object({
      questionId: z.string(),
      selectedIndex: z.number().int().nullable().optional(),
      timeSpentSeconds: z.number().int().min(0).default(0),
      confidence: z.number().int().min(1).max(5).optional(),
    }),
  ),
})

// POST /api/tests/:id/submit — grade and persist the result.
testRoutes.post('/:id/submit', async (c) => {
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const test = await prisma.test.findFirst({
    where: { id, userId },
    include: { result: { select: { id: true } } },
  })
  if (!test) return c.json({ error: 'Test not found' }, 404)
  if (test.completedAt || test.result) {
    return c.json({ error: 'Test already completed' }, 409)
  }

  const body = await c.req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  // Load the test's questions enriched with topic/subject AND content (for correctIndex).
  const questions = await prisma.question.findMany({
    where: { id: { in: test.questionIds } },
    include: {
      topic: { include: { subject: true } },
      content: { select: { correctIndex: true } },
    },
  })

  const byId = new Map(parsed.data.attempts.map((a) => [a.questionId, a]))

  const graded: GradedQuestion[] = questions.map((q) => ({
    questionId: q.id,
    subjectId: q.topic.subjectId,
    subjectName: q.topic.subject.name,
    topicId: q.topicId,
    topicName: q.topic.name,
    difficulty: q.difficulty,
    targetSeconds: q.targetSeconds,
  }))

  const submittedAttempts = graded.map((gq) => {
    const a = byId.get(gq.questionId)
    const selectedIndex = a?.selectedIndex ?? null
    const q = questions.find((x) => x.id === gq.questionId)!
    const correctIndex = q.content?.correctIndex ?? 0
    return {
      testId: test.id,
      questionId: gq.questionId,
      selectedIndex,
      correct: selectedIndex != null && selectedIndex === correctIndex,
      timeSpentSeconds: a?.timeSpentSeconds ?? 0,
      confidence: a?.confidence ?? 3,
    }
  })

  // Provisional grade to learn the score, then the real percentile for it.
  const provisional = computeTestResult(graded, submittedAttempts, 0)
  const percentile = await computePercentile(test.examId, provisional.score)
  const result = computeTestResult(graded, submittedAttempts, percentile)

  // Persist attempts + result + completion in a transaction.
  await prisma.$transaction(async (tx) => {
    await tx.questionAttempt.createMany({ data: submittedAttempts })
    await tx.testResult.create({
      data: {
        testId: test.id,
        userId,
        score: result.score,
        accuracy: result.accuracy,
        speed: result.speed,
        retention: result.retention,
        percentile: result.percentile,
        correct: result.correct,
        total: result.total,
        timeSpentMinutes: result.timeSpentMinutes,
        diagnosis: result.diagnosis,
        nextBestAction: result.nextBestAction,
        targetTopicId: result.targetTopicId,
        losses: JSON.stringify(result.losses),
      },
    })
    await tx.test.update({
      where: { id: test.id },
      data: { completedAt: new Date() },
    })
  })

  // Aggregate per-subject / per-topic state for the user.
  await upsertProgress(userId, graded, submittedAttempts)

  await refreshPerformance(userId, test.examId, result.timeSpentMinutes)

  // Phase 3: persist AI recommendations from the diagnosis.
  await diagnoseTest(test.id, userId)

  // Phase 6: live updates + transactional result email (fire-and-forget).
  realtime.publishToUser(userId, 'progress:update', {
    testId: test.id,
    score: result.score,
    accuracy: result.accuracy,
  })
  realtime.publishToUser(userId, 'ranking:updated', { percentile: result.percentile })
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
  if (user) {
    void sendEmail({
      to: user.email,
      subject: `Your ${test.name} result: ${result.score}%`,
      text: `Hi ${user.name || 'there'},\n\nYou scored ${result.score}% (${result.correct}/${result.total}) on "${test.name}".\n\n${result.diagnosis}\nNext: ${result.nextBestAction}\n\n— The 9Th-Grade AI team`,
    })
  }

  // Phase 7: performance/rank/strategy all changed — drop their caches.
  await cacheDel(cacheKey('rank', test.examId, userId))
  await cacheDel(cacheKey('strategy', userId))
  await cacheDel(cacheKey('briefing', userId))

  return c.json({ result })
})

// GET /api/tests/:id/result
testRoutes.get('/:id/result', async (c) => {
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const test = await prisma.test.findFirst({
    where: { id, userId },
    include: { result: true },
  })
  if (!test) return c.json({ error: 'Test not found' }, 404)
  if (!test.result) return c.json({ error: 'Result not yet available' }, 404)
  return c.json({ result: test.result })
})

/** Upsert the user's per-subject & per-topic progress from this test. */
async function upsertProgress(
  userId: string,
  graded: GradedQuestion[],
  attempts: Array<{ questionId: string; correct: boolean; timeSpentSeconds: number }>,
): Promise<void> {
  const byId = new Map(attempts.map((a) => [a.questionId, a]))

  const subjectAgg = new Map<string, { correct: number; total: number; time: number }>()
  const topicAgg = new Map<string, { correct: number; total: number; time: number }>()

  for (const g of graded) {
    const a = byId.get(g.questionId)
    if (!a) continue
    for (const [map, key] of [
      [subjectAgg, g.subjectId] as const,
      [topicAgg, g.topicId] as const,
    ]) {
      const cur = map.get(key) ?? { correct: 0, total: 0, time: 0 }
      cur.total += 1
      cur.correct += a.correct ? 1 : 0
      cur.time += a.timeSpentSeconds
      map.set(key, cur)
    }
  }

  const toMetrics = (agg: { correct: number; total: number; time: number }) => {
    const accuracy = Math.round((agg.correct / Math.max(agg.total, 1)) * 100)
    const speed = Math.round(Math.max(0, 100 - agg.time / Math.max(agg.total, 1) * 2))
    const retention = Math.round(accuracy * 0.7 + speed * 0.3)
    const mastery = Math.round(accuracy * 0.4 + speed * 0.3 + retention * 0.3)
    return { accuracy, speed, retention, mastery }
  }

  for (const [subjectId, agg] of subjectAgg) {
    const m = toMetrics(agg)
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
    if (!subject) continue
    await prisma.userSubject.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      update: m,
      create: { userId, examId: subject.examId, subjectId, ...m },
    })
  }

  for (const [topicId, agg] of topicAgg) {
    const m = toMetrics(agg)
    const status = m.accuracy >= 80 ? 'mastered' : m.accuracy >= 55 ? 'practicing' : 'learning'
    await prisma.userTopic.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: { ...m, status },
      create: { userId, topicId, ...m, status },
    })
  }
}
