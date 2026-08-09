import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { requireAdmin } from '../middleware/admin'

/* ============================================================
   Admin routes (Phase 8) — protected by requireAdmin.
   Question management + platform analytics.
   ============================================================ */

export const adminRoutes = new Hono<AppEnv>()
adminRoutes.use('*', requireAdmin)

const questionSchema = z.object({
  topicId: z.string(),
  prompt: z.string().min(1),
  promptBn: z.string().optional(),
  options: z.array(z.string()).min(2),
  optionsBn: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
  difficulty: z.number().int().min(1).max(5).optional(),
  targetSeconds: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/admin/questions?limit=&offset=&topicId=
adminRoutes.get('/questions', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50) || 50, 100)
  const offset = Number(c.req.query('offset') ?? 0) || 0
  const topicId = c.req.query('topicId')
  const where = topicId ? { topicId } : {}
  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip: offset,
      take: limit,
      include: { topic: { include: { subject: true } } },
    }),
  ])
  return c.json({ total, offset, limit, questions })
})

// POST /api/admin/questions
adminRoutes.post('/questions', async (c) => {
  const parsed = questionSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  const d = parsed.data
  const topic = await prisma.topic.findUnique({ where: { id: d.topicId } })
  if (!topic) return c.json({ error: 'Topic not found' }, 400)

  const question = await prisma.question.create({
    data: {
      topicId: d.topicId,
      prompt: d.prompt,
      promptBn: d.promptBn,
      options: d.options,
      optionsBn: d.optionsBn ?? [],
      correctIndex: d.correctIndex,
      explanation: d.explanation,
      difficulty: d.difficulty ?? 2,
      targetSeconds: d.targetSeconds ?? 40,
      tags: d.tags ?? [],
    },
  })
  return c.json(question, 201)
})

// PUT /api/admin/questions/:id
adminRoutes.put('/questions/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await prisma.question.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Question not found' }, 404)

  const parsed = questionSchema.partial().safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)

  const question = await prisma.question.update({ where: { id }, data: parsed.data })
  return c.json(question)
})

// DELETE /api/admin/questions/:id
adminRoutes.delete('/questions/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await prisma.question.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Question not found' }, 404)
  await prisma.question.delete({ where: { id } })
  return c.json({ ok: true })
})

// GET /api/admin/analytics
adminRoutes.get('/analytics', async (c) => {
  const [users, admins, exams, questions, tests, results, invoices, accuracyAgg, revenue] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.exam.count(),
      prisma.question.count(),
      prisma.test.count(),
      prisma.testResult.count(),
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.testResult.aggregate({ _avg: { accuracy: true } }),
      prisma.invoice.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
    ])

  return c.json({
    users,
    admins,
    exams,
    questions,
    tests,
    results,
    invoices,
    revenueCents: revenue._sum.amount ?? 0,
    avgAccuracy: Math.round(accuracyAgg._avg.accuracy ?? 0),
  })
})
