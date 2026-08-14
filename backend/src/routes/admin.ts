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

// GET /api/admin/questions?limit=&offset=&topicId=&status=
adminRoutes.get('/questions', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50) || 50, 100)
  const offset = Number(c.req.query('offset') ?? 0) || 0
  const topicId = c.req.query('topicId')
  const status = c.req.query('status')
  const where: Record<string, unknown> = {}
  if (topicId) where.topicId = topicId
  if (status) where.status = status
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
      content: {
        create: {
          prompt: d.prompt,
          promptBn: d.promptBn,
          options: d.options.map((opt) => ({ text: opt, textBn: opt })),
          correctIndex: d.correctIndex,
          explanation: d.explanation,
        },
      },
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

// POST /api/admin/questions/import — bulk import questions from JSON array.
// Each item must match the QuestionImport schema. Duplicates are skipped.
adminRoutes.post('/questions/import', async (c) => {
  const body = await c.req.json()
  const items = z.array(z.object({
    id: z.string().optional(),
    topicId: z.string(),
    subTopicId: z.string().optional(),
    questionType: z.string().optional(),
    difficulty: z.number().int().min(1).max(5).optional(),
    targetSeconds: z.number().int().positive().optional(),
    tags: z.array(z.string()).optional(),
    bloomLevel: z.string().optional(),
    status: z.string().optional(),
    content: z.object({
      prompt: z.string().min(1),
      promptBn: z.string().optional(),
      options: z.array(z.object({ text: z.string(), textBn: z.string().optional() })).min(2),
      correctIndex: z.number().int().min(0),
      explanation: z.string().min(1),
      explanationBn: z.string().optional(),
      detailedExplanation: z.string().optional(),
    }),
    source: z.object({
      examYear: z.number().int().optional(),
      questionNumber: z.number().int().optional(),
      sourceType: z.string().min(1),
      sourceName: z.string().optional(),
      sourceUrl: z.string().url().optional(),
    }).optional(),
  })).safeParse(body)

  if (!items.success) {
    return c.json({ error: 'Invalid input', details: items.error.flatten() }, 400)
  }

  const { createHash } = await import('crypto')
  const results = { imported: 0, skipped: 0, errors: 0, details: [] as string[] }

  for (const data of items.data) {
    try {
      const normalized = data.content.prompt.trim().toLowerCase() + '|' +
        data.content.options.map(o => o.text.trim().toLowerCase()).sort().join('|')
      const contentHash = createHash('sha256').update(normalized).digest('hex')

      const existing = await prisma.question.findFirst({ where: { contentHash } })
      if (existing) {
        results.skipped++
        results.details.push(`Duplicate (hash): ${data.id ?? 'unknown'} -> ${existing.id}`)
        continue
      }

      await prisma.question.create({
        data: {
          id: data.id,
          topicId: data.topicId,
          subTopicId: data.subTopicId,
          questionType: data.questionType ?? 'mcq-single',
          difficulty: data.difficulty ?? 2,
          targetSeconds: data.targetSeconds ?? (data.difficulty ?? 2) * 30 + 10,
          tags: data.tags ?? [],
          bloomLevel: data.bloomLevel,
          status: data.status ?? 'IMPORTED',
          verificationStatus: 'unverified',
          contentHash,
          isCanonical: true,
          publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
          content: { create: data.content },
          source: data.source ? { create: { ...data.source, verifiedBy: c.get('userId') || 'system' } } : undefined,
          stats: { create: { attemptCount: 0, correctCount: 0, avgTimeSeconds: 0, difficultyRating: 0 } },
        },
      })
      results.imported++
      results.details.push(`Imported: ${data.id ?? 'generated'}`)
    } catch (e) {
      if (e instanceof Error && e.message.includes('Unique constraint failed on the fields: (`contentHash`)')) {
        results.skipped++
        results.details.push(`Duplicate (hash): ${data.id ?? 'unknown'}`)
        continue
      }
      results.errors++
      results.details.push(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return c.json(results)
})

// GET /api/admin/analytics
adminRoutes.get('/analytics', async (c) => {
  const [users, admins, exams, questions, tests, results, accuracyAgg] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.exam.count(),
      prisma.question.count(),
      prisma.test.count(),
      prisma.testResult.count(),
      prisma.testResult.aggregate({ _avg: { accuracy: true } }),
    ])

  return c.json({
    users,
    admins,
    exams,
    questions,
    tests,
    results,
    avgAccuracy: Math.round(accuracyAgg._avg.accuracy ?? 0),
  })
})
