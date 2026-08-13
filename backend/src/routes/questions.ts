import { Hono } from 'hono'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { cacheGet, cacheSet, cacheKey } from '../lib/cache'
import { z } from 'zod'

/* ============================================================
   Question routes — study/practice question bank.
   Enhanced with QuestionContent, SubTopic, QuestionSource, QuestionStats
   ============================================================ */

export const questionRoutes = new Hono<AppEnv>()

// GET /api/questions/:topicId?difficulty=2&limit=20&offset=0&subTopicId=&status=published
questionRoutes.get('/:topicId', async (c) => {
  const topicId = c.req.param('topicId')
  const q = c.req.query()

  const difficulty = q.difficulty ? Number(q.difficulty) : undefined
  const subTopicId = q.subTopicId || undefined
  const status = q.status || 'published'
  const limit = Math.min(Number(q.limit ?? 20) || 20, 100)
  const offset = Number(q.offset ?? 0) || 0

  // Cache key includes all filters
  const key = cacheKey('questions', topicId, subTopicId ?? 'any', difficulty ?? 'any', status, limit, offset)
  const cached = await cacheGet(key)
  if (cached) return c.json(cached)

  const where = {
    topicId,
    status,
    ...(subTopicId ? { subTopicId } : {}),
    ...(difficulty && !Number.isNaN(difficulty) ? { difficulty } : {}),
  }

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { difficulty: 'asc' },
      take: limit,
      skip: offset,
      include: {
        content: true,
        source: true,
        stats: true,
        subTopic: { select: { id: true, name: true, nameBn: true } },
      },
    }),
  ])

  // Sanitize: remove correctIndex and explanation from client response
  const sanitizedQuestions = questions.map((q) => {
    const { content, ...rest } = q
    return {
      ...rest,
      content: content ? {
        prompt: content.prompt,
        promptBn: content.promptBn,
        options: content.options,
        // correctIndex and explanation intentionally omitted
      } : null,
    }
  })

  const body = { total, offset, limit, questions: sanitizedQuestions }
  await cacheSet(key, body, 300)
  return c.json(body)
})

// GET /api/questions/:id/full — Get full question with explanation (for review/results)
questionRoutes.get('/:id/full', async (c) => {
  const id = c.req.param('id')

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      content: true,
      source: true,
      stats: true,
      subTopic: { select: { id: true, name: true, nameBn: true } },
      topic: { select: { id: true, name: true, subjectId: true } },
    },
  })

  if (!question) {
    return c.json({ error: 'Question not found' }, 404)
  }

  return c.json(question)
})

// GET /api/questions/random — Random question selection for adaptive practice
questionRoutes.get('/random', async (c) => {
  const q = c.req.query()

  const topicId = q.topicId
  const subTopicId = q.subTopicId || undefined
  const difficulty = q.difficulty ? Number(q.difficulty) : undefined
  const count = Math.min(Number(q.count ?? 5) || 5, 20)
  const status = q.status || 'published'
  const excludeIds = q.exclude ? q.exclude.split(',') : []

  if (!topicId) {
    return c.json({ error: 'topicId is required' }, 400)
  }

  const where = {
    topicId,
    status,
    ...(subTopicId ? { subTopicId } : {}),
    ...(difficulty && !Number.isNaN(difficulty) ? { difficulty } : {}),
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
  }

  // Get total count for this filter
  const total = await prisma.question.count({ where })
  if (total === 0) {
    return c.json({ questions: [] })
  }

  // Use Prisma's random ordering via raw query for efficiency
  const questions = await prisma.$queryRawUnsafe(
    `SELECT q.*, qc.prompt, qc.prompt_bn, qc.options, qc.correct_index, qc.explanation, qc.explanation_bn, qc.detailed_explanation
     FROM "Question" q
     LEFT JOIN "QuestionContent" qc ON qc."questionId" = q.id
     WHERE q."topicId" = $1
     AND q."status" = $2
     ${subTopicId ? `AND q."subTopicId" = '${subTopicId}'` : ''}
     ${difficulty ? `AND q.difficulty = ${difficulty}` : ''}
     ${excludeIds.length > 0 ? `AND q.id NOT IN (${excludeIds.map(id => `'${id}'`).join(',')})` : ''}
     ORDER BY RANDOM()
     LIMIT ${count}`,
    topicId,
    status
  ) as any[]

  // Sanitize for practice mode (no correct answer)
  const sanitized = questions.map((q) => ({
    id: q.id,
    topicId: q.topicId,
    subTopicId: q.subTopicId,
    questionType: q.questionType,
    difficulty: q.difficulty,
    targetSeconds: q.targetSeconds,
    tags: q.tags,
    bloomLevel: q.bloomLevel,
    status: q.status,
    verificationStatus: q.verificationStatus,
    contentHash: q.contentHash,
    content: q.prompt ? {
      prompt: q.prompt,
      promptBn: q.prompt_bn,
      options: q.options,
      // correctIndex and explanation omitted for practice
    } : null,
  }))

  return c.json({ questions: sanitized, total })
})

// GET /api/questions/stats/:topicId — Get question statistics for a topic
questionRoutes.get('/stats/:topicId', async (c) => {
  const topicId = c.req.param('topicId')
  const q = c.req.query()
  const subTopicId = q.subTopicId || undefined

  const key = cacheKey('question-stats', topicId, subTopicId ?? 'all')
  const cached = await cacheGet(key)
  if (cached) return c.json(cached)

  const where = { topicId, ...(subTopicId ? { subTopicId } : {}) }

  const [total, byDifficulty, byStatus, avgStats] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.groupBy({
      by: ['difficulty'],
      where,
      _count: { difficulty: true },
      orderBy: { difficulty: 'asc' },
    }),
    prisma.question.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
    prisma.questionStats.aggregate({
      where: { question: { topicId, ...(subTopicId ? { subTopicId } : {}) } },
      _avg: { difficultyRating: true, avgTimeSeconds: true },
      _sum: { attemptCount: true, correctCount: true },
    }),
  ])

  const stats = {
    total,
    byDifficulty: byDifficulty.map(d => ({ difficulty: d.difficulty, count: d._count.difficulty })),
    byStatus: byStatus.map(s => ({ status: s.status, count: s._count.status })),
    aggregate: {
      avgDifficultyRating: avgStats._avg.difficultyRating ?? 0,
      avgTimeSeconds: avgStats._avg.avgTimeSeconds ?? 0,
      totalAttempts: avgStats._sum.attemptCount ?? 0,
      totalCorrect: avgStats._sum.correctCount ?? 0,
    },
  }

  await cacheSet(key, stats, 600)
  return c.json(stats)
})

// POST /api/questions — Create new question (admin)
const createQuestionSchema = z.object({
  topicId: z.string(),
  subTopicId: z.string().optional(),
  questionType: z.enum(['mcq-single', 'mcq-multiple', 'fill-blank']).default('mcq-single'),
  difficulty: z.number().int().min(1).max(5).default(2),
  targetSeconds: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze']).optional(),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived']).default('draft'),
  content: z.object({
    prompt: z.string().min(1),
    promptBn: z.string().optional(),
    options: z.array(z.object({
      text: z.string(),
      textBn: z.string().optional(),
    })).min(2),
    correctIndex: z.number().int().min(0),
    explanation: z.string().min(1),
    explanationBn: z.string().optional(),
    detailedExplanation: z.string().optional(),
  }),
  source: z.object({
    examYear: z.number().int().optional(),
    questionNumber: z.number().int().optional(),
    sourceType: z.enum(['bcs-official', 'bcs-unofficial', 'curated', 'ai-generated']),
    sourceName: z.string().optional(),
    sourceUrl: z.string().url().optional(),
  }).optional(),
})

questionRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = createQuestionSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const data = parsed.data

  // Compute content hash for deduplication
  const { createHash } = await import('crypto')
  const normalized = data.content.prompt.trim().toLowerCase() + '|' +
    data.content.options.map(o => o.text.trim().toLowerCase()).sort().join('|')
  const contentHash = createHash('sha256').update(normalized).digest('hex')

  // Check for existing duplicate
  const existing = await prisma.question.findFirst({ where: { contentHash } })
  if (existing) {
    return c.json({
      error: 'Duplicate question detected',
      existingId: existing.id,
      contentHash
    }, 409)
  }

  // Create question with content, source, and stats in transaction
  const question = await prisma.$transaction(async (tx) => {
    const q = await tx.question.create({
      data: {
        topicId: data.topicId,
        subTopicId: data.subTopicId,
        questionType: data.questionType,
        difficulty: data.difficulty,
        targetSeconds: data.targetSeconds ?? data.difficulty * 30 + 10,
        tags: data.tags,
        bloomLevel: data.bloomLevel,
        status: data.status,
        verificationStatus: 'unverified',
        contentHash,
        isCanonical: true,
        publishedAt: data.status === 'published' ? new Date() : null,
        content: {
          create: {
            prompt: data.content.prompt,
            promptBn: data.content.promptBn,
            options: data.content.options,
            correctIndex: data.content.correctIndex,
            explanation: data.content.explanation,
            explanationBn: data.content.explanationBn,
            detailedExplanation: data.content.detailedExplanation,
          },
        },
        source: data.source ? {
          create: {
            examYear: data.source.examYear,
            questionNumber: data.source.questionNumber,
            sourceType: data.source.sourceType,
            sourceName: data.source.sourceName,
            sourceUrl: data.source.sourceUrl,
            verifiedAt: data.status === 'published' ? new Date() : null,
            verifiedBy: c.get('user')?.id || 'system',
          },
        } : undefined,
        stats: {
          create: {
            attemptCount: 0,
            correctCount: 0,
            avgTimeSeconds: 0,
            difficultyRating: 0,
          },
        },
      },
      include: {
        content: true,
        source: true,
        stats: true,
        subTopic: { select: { id: true, name: true } },
      },
    })
    return q
  })

  return c.json(question, 201)
})

// PATCH /api/questions/:id — Update question (admin)
questionRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  // Check question exists
  const existing = await prisma.question.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: 'Question not found' }, 404)
  }

  // Update question metadata
  const question = await prisma.question.update({
    where: { id },
    data: {
      topicId: body.topicId,
      subTopicId: body.subTopicId,
      questionType: body.questionType,
      difficulty: body.difficulty,
      targetSeconds: body.targetSeconds,
      tags: body.tags,
      bloomLevel: body.bloomLevel,
      status: body.status,
      verificationStatus: body.verificationStatus,
      publishedAt: body.status === 'published' && !existing.publishedAt ? new Date() : undefined,
    },
    include: {
      content: true,
      source: true,
      stats: true,
    },
  })

  // Update content if provided
  if (body.content) {
    await prisma.questionContent.update({
      where: { questionId: id },
      data: {
        prompt: body.content.prompt,
        promptBn: body.content.promptBn,
        options: body.content.options,
        correctIndex: body.content.correctIndex,
        explanation: body.content.explanation,
        explanationBn: body.content.explanationBn,
        detailedExplanation: body.content.detailedExplanation,
      },
    })

    // Create version record
    await prisma.questionVersion.create({
      data: {
        questionId: id,
        version: (await prisma.questionVersion.count({ where: { questionId: id } })) + 1,
        prompt: body.content.prompt,
        promptBn: body.content.promptBn,
        options: body.content.options,
        correctIndex: body.content.correctIndex,
        explanation: body.content.explanation,
        changedBy: c.get('user')?.id || 'system',
        changeReason: body.changeReason,
      },
    })
  }

  // Update source if provided
  if (body.source) {
    await prisma.questionSource.upsert({
      where: { questionId: id },
      create: {
        questionId: id,
        examYear: body.source.examYear,
        questionNumber: body.source.questionNumber,
        sourceType: body.source.sourceType,
        sourceName: body.source.sourceName,
        sourceUrl: body.source.sourceUrl,
        verifiedAt: body.source.verifiedAt ? new Date(body.source.verifiedAt) : null,
        verifiedBy: body.source.verifiedBy,
      },
      update: {
        examYear: body.source.examYear,
        questionNumber: body.source.questionNumber,
        sourceType: body.source.sourceType,
        sourceName: body.source.sourceName,
        sourceUrl: body.source.sourceUrl,
        verifiedAt: body.source.verifiedAt ? new Date(body.source.verifiedAt) : null,
        verifiedBy: body.source.verifiedBy,
      },
    })
  }

  return c.json(question)
})