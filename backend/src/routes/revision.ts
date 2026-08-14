import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { sm2, ensureInitialSchedule, ensureRevisionItems, isOverdue } from '../lib/sm2'

/* ============================================================
   Revision routes — SM-2 spaced-repetition schedule.
   Paid feature — gated behind `unlimited-revision`.
   ============================================================ */

export const revisionRoutes = new Hono<AppEnv>()

function serialize(item: {
  id: string
  memoryStrength: number
  lastReviewed: Date
  nextReview: Date
  topic: { name: string; subject: { name: string } }
}) {
  return {
    id: item.id,
    topic: item.topic.name,
    subject: item.topic.subject.name,
    memoryStrength: item.memoryStrength,
    lastReviewed: item.lastReviewed.toISOString(),
    nextReview: item.nextReview.toISOString(),
    overdue: isOverdue(item.nextReview),
  }
}

// GET /api/revision/items
revisionRoutes.get('/items', async (c) => {
  const userId = c.get('userId') as string
  await ensureInitialSchedule(userId)

  const items = await prisma.revisionItem.findMany({
    where: { userId },
    include: { topic: { include: { subject: true } } },
    orderBy: { nextReview: 'asc' },
    take: 50,
  })

  return c.json({ items: items.map(serialize) })
})

// GET /api/revision/schedule — due now + next 7 days
revisionRoutes.get('/schedule', async (c) => {
  const userId = c.get('userId') as string
  await ensureInitialSchedule(userId)

  const now = new Date()
  const endOfWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const items = await prisma.revisionItem.findMany({
    where: { userId, nextReview: { lte: endOfWeek } },
    include: { topic: { include: { subject: true } } },
    orderBy: { nextReview: 'asc' },
    take: 100,
  })

  const due = items.filter((i) => isOverdue(i.nextReview, now.getTime()))
  const upcoming = items.filter((i) => !isOverdue(i.nextReview, now.getTime()))

  return c.json({
    dueToday: due.map(serialize),
    upcoming: upcoming.map(serialize),
    dueCount: due.length,
  })
})

const reviewSchema = z.object({
  topicId: z.string(),
  quality: z.number().int().min(0).max(5),
})

// POST /api/revision/review
revisionRoutes.post('/review', async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }
  const { topicId, quality } = parsed.data

  let item = await prisma.revisionItem.findUnique({
    where: { userId_topicId: { userId, topicId } },
  })
  if (!item) {
    await ensureRevisionItems(userId, [topicId])
    item = await prisma.revisionItem.findUnique({ where: { userId_topicId: { userId, topicId } } })
  }
  if (!item) return c.json({ error: 'Topic not found' }, 404)

  const next = sm2(
    { repetition: item.repetition, easinessFactor: item.easinessFactor, interval: item.interval },
    quality,
  )

  const updated = await prisma.revisionItem.update({
    where: { id: item.id },
    data: {
      memoryStrength: next.memoryStrength,
      lastReviewed: new Date(),
      nextReview: next.nextReview,
      repetition: next.repetition,
      easinessFactor: next.easinessFactor,
      interval: next.interval,
      overdue: false,
    },
    include: { topic: { include: { subject: true } } },
  })

  // Low recall -> schedule a near-term follow-up reminder.
  if (quality < 3) {
    await prisma.aIRecommendation.create({
      data: {
        userId,
        kind: 'memory',
        severity: 'medium',
        title: 'Revisit: ' + updated.topic.name,
        body: `You rated your recall of ${updated.topic.name} low. Review it again within 24 hours to lock it in.`,
        actionLabel: 'Review now',
        actionRoute: null,
      },
    })
  }

  return c.json({ item: serialize(updated) })
})
