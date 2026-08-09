import { Hono } from 'hono'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'

/* ============================================================
   Question routes — study/practice question bank.
   ============================================================ */

export const questionRoutes = new Hono<AppEnv>()

// GET /api/questions/:topicId?difficulty=2&limit=20&offset=0
questionRoutes.get('/:topicId', async (c) => {
  const topicId = c.req.param('topicId')
  const q = c.req.query()

  const difficulty = q.difficulty ? Number(q.difficulty) : undefined
  const limit = Math.min(Number(q.limit ?? 20) || 20, 50)
  const offset = Number(q.offset ?? 0) || 0

  const where = {
    topicId,
    ...(difficulty && !Number.isNaN(difficulty) ? { difficulty } : {}),
  }

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { difficulty: 'asc' },
      take: limit,
      skip: offset,
    }),
  ])

  return c.json({ total, offset, limit, questions })
})
