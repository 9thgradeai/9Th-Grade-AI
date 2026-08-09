import { Hono } from 'hono'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'

/* ============================================================
   Rank routes — per-exam leaderboard derived from real results.
   ============================================================ */

export const rankRoutes = new Hono<AppEnv>()

// GET /api/rank/leaderboard?examId=&limit=
rankRoutes.get('/leaderboard', async (c) => {
  const userId = c.get('userId') as string
  const examId = c.req.query('examId')
  const limit = Math.min(Number(c.req.query('limit') ?? 50) || 50, 100)

  const resolvedExamId =
    examId ||
    (await prisma.testResult
      .findFirst({ where: { userId }, select: { test: { select: { examId: true } } } })
      .then((r) => r?.test.examId))

  if (!resolvedExamId) {
    return c.json({ examId: null, leaderboard: [], me: null })
  }

  const grouped = await prisma.testResult.groupBy({
    by: ['userId'],
    where: { test: { examId: resolvedExamId } },
    _avg: { score: true, accuracy: true },
    _count: true,
    orderBy: { _avg: { score: 'desc' } },
    take: limit,
  })

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, name: true, firstName: true, avatar: true },
  })
  const byId = new Map(users.map((u) => [u.id, u]))

  const leaderboard = grouped.map((g, i) => ({
    rank: i + 1,
    userId: g.userId,
    name: byId.get(g.userId)?.name ?? 'Anonymous',
    avatar: byId.get(g.userId)?.avatar ?? null,
    avgScore: Math.round(g._avg.score ?? 0),
    avgAccuracy: Math.round(g._avg.accuracy ?? 0),
    tests: g._count,
  }))

  const myRank = leaderboard.find((l) => l.userId === userId)?.rank ?? null

  return c.json({ examId: resolvedExamId, leaderboard, me: myRank })
})

// GET /api/rank/me
rankRoutes.get('/me', async (c) => {
  const userId = c.get('userId') as string
  const examId = c.req.query('examId')
  const resolvedExamId =
    examId ||
    (await prisma.testResult
      .findFirst({ where: { userId }, select: { test: { select: { examId: true } } } })
      .then((r) => r?.test.examId))

  if (!resolvedExamId) {
    return c.json({ rank: null, percentile: null })
  }

  const grouped = await prisma.testResult.groupBy({
    by: ['userId'],
    where: { test: { examId: resolvedExamId } },
    _avg: { score: true },
    orderBy: { _avg: { score: 'desc' } },
  })

  const index = grouped.findIndex((g) => g.userId === userId)
  if (index === -1) return c.json({ rank: null, percentile: null })

  const rank = index + 1
  const percentile = Math.round(((grouped.length - rank) / grouped.length) * 100)
  return c.json({ rank, percentile, total: grouped.length })
})
