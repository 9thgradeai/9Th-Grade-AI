import { Hono } from 'hono'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'
import { cacheGet, cacheSet, cacheDel, cacheKey } from '../lib/cache'
import { z } from 'zod'
import { requireAdmin } from '../middleware/admin'

/* ============================================================
   Question routes — study/practice question bank.
   Enhanced with QuestionContent, SubTopic, QuestionSource, QuestionStats

   Mutation routes require admin authentication.
   ============================================================ */

export const questionRoutes = new Hono<AppEnv>()

// GET /api/questions/:topicId?difficulty=2&limit=20&offset=0&subTopicId=&status=published
questionRoutes.get('/:topicId', async (c) => {
  const topicId = c.req.param('topicId')
  const q = c.req.query()

  const difficulty = q.difficulty ? Number(q.difficulty) : undefined
  const subTopicId = q.subTopicId || undefined
  const status = q.status || 'PUBLISHED'
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

  // Sanitize: flatten content fields and remove sensitive answer data
  const sanitizedQuestions = questions.map((q) => {
    const { content, ...rest } = q
    const base: Record<string, unknown> = { ...rest }
    if (content) {
      base.prompt = content.prompt
      base.promptBn = content.promptBn
      base.options = Array.isArray(content.options)
        ? content.options.map((o) => (typeof o === 'object' && o && 'text' in o ? (o as Record<string, string>).text : String(o)))
        : content.options
    }
    return base
  })

  const body = { total, offset, limit, questions: sanitizedQuestions }
  await cacheSet(key, body, 300)
  return c.json(body)
})

// GET /api/questions/:id/full — Get question metadata (sanitized).
// Full content (correctIndex, explanation) is only available server-side
// during grading. This endpoint returns the same sanitized shape as the
// list endpoint to prevent IDOR and answer leakage.
questionRoutes.get('/:id/full', async (c) => {
  const id = c.req.param('id')

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      content: {
        select: {
          prompt: true,
          promptBn: true,
          options: true,
          explanation: true,
          explanationBn: true,
          detailedExplanation: true,
        },
      },
      source: true,
      stats: true,
      subTopic: { select: { id: true, name: true, nameBn: true } },
      topic: { select: { id: true, name: true, subjectId: true } },
    },
  })

  if (!question || question.status !== 'PUBLISHED') {
    return c.json({ error: 'Question not found' }, 404)
  }

  // Sanitize: strip answer data (correctIndex, explanation) from response.
  const { content, ...rest } = question
  const base: Record<string, unknown> = { ...rest }
  if (content) {
    base.prompt = content.prompt
    base.promptBn = content.promptBn
    base.options = Array.isArray(content.options)
      ? content.options.map((o) => (typeof o === 'object' && o && 'text' in o ? (o as Record<string, string>).text : String(o)))
      : content.options
  }
  return c.json(base)
})

// GET /api/questions/random — Random question selection for adaptive practice
questionRoutes.get('/random', async (c) => {
  const q = c.req.query()

  const topicId = q.topicId
  const subTopicId = q.subTopicId || undefined
  const difficulty = q.difficulty ? Number(q.difficulty) : undefined
  const count = Math.min(Number(q.count ?? 5) || 5, 20)
  const status = q.status || 'PUBLISHED'
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

  // Efficient random sampling without ORDER BY RANDOM().
  // Fetch a small buffer (up to 3x requested count) and pick randomly in JS.
  // This uses indexed WHERE filters and avoids a full-table sort.
  const bufferSize = Math.min(count * 3, total)
  const buffer = await prisma.question.findMany({
    where,
    include: {
      content: {
        select: {
          prompt: true,
          promptBn: true,
          options: true,
          correctIndex: true,
          explanation: true,
          explanationBn: true,
          detailedExplanation: true,
        },
      },
    },
    take: bufferSize,
  })

  // Fisher-Yates partial shuffle to pick `count` random items
  const selected: typeof buffer = []
  const pool = [...buffer]
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const j = Math.floor(Math.random() * (pool.length - i)) + i
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
    selected.push(pool[i])
  }

  // Sanitize for practice mode (no correct answer)
  const sanitized = selected.map((q) => ({
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
    content: q.content ? {
      prompt: q.content.prompt,
      promptBn: q.content.promptBn,
      options: q.content.options,
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
  status: z.enum(['IMPORTED', 'NEEDS_REVIEW', 'VALIDATED', 'PUBLISHED', 'ARCHIVED', 'REJECTED']).default('IMPORTED'),
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
    verifiedAt: z.string().datetime().optional(),
    verifiedBy: z.string().optional(),
  }).optional(),
})

questionRoutes.post('/', requireAdmin, async (c) => {
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
  try {
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
          publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
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
              verifiedAt: data.status === 'PUBLISHED' ? new Date() : null,
              verifiedBy: c.get('userId') || 'system',
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
    await cacheDel(cacheKey('questions', question.topicId, question.subTopicId ?? 'any', 'any', 'PUBLISHED'))
    await cacheDel(cacheKey('question-stats', question.topicId, question.subTopicId ?? 'all'))
    return c.json(question, 201)
  } catch (e) {
    if (e instanceof Error && e.message.includes('Unique constraint failed on the fields: (`contentHash`)')) {
      return c.json({ error: 'Duplicate question detected', contentHash }, 409)
    }
    throw e
  }
})

// PATCH /api/questions/:id — Update question (admin)
const updateQuestionSchema = z.object({
  topicId: z.string().optional(),
  subTopicId: z.string().optional(),
  questionType: z.enum(['mcq-single', 'mcq-multiple', 'fill-blank']).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  targetSeconds: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze']).optional(),
  status: z.enum(['IMPORTED', 'NEEDS_REVIEW', 'VALIDATED', 'PUBLISHED', 'ARCHIVED', 'REJECTED']).optional(),
  content: z.object({
    prompt: z.string().min(1).optional(),
    promptBn: z.string().optional(),
    options: z.array(z.object({
      text: z.string(),
      textBn: z.string().optional(),
    })).min(2).optional(),
    correctIndex: z.number().int().min(0).optional(),
    explanation: z.string().min(1).optional(),
    explanationBn: z.string().optional(),
    detailedExplanation: z.string().optional(),
  }).optional(),
  source: z.object({
    examYear: z.number().int().optional(),
    questionNumber: z.number().int().optional(),
    sourceType: z.enum(['bcs-official', 'bcs-unofficial', 'curated', 'ai-generated']).optional(),
    sourceName: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    verifiedAt: z.string().datetime().optional(),
    verifiedBy: z.string().optional(),
  }).optional(),
})

questionRoutes.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = updateQuestionSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const data = parsed.data

  // Check question exists
  const existing = await prisma.question.findUnique({
    where: { id },
    include: { content: true },
  })
  if (!existing) {
    return c.json({ error: 'Question not found' }, 404)
  }

  // Update question metadata
  const questionData: Record<string, unknown> = {}
  if (data.topicId !== undefined) questionData.topicId = data.topicId
  if (data.subTopicId !== undefined) questionData.subTopicId = data.subTopicId
  if (data.questionType !== undefined) questionData.questionType = data.questionType
  if (data.difficulty !== undefined) questionData.difficulty = data.difficulty
  if (data.targetSeconds !== undefined) questionData.targetSeconds = data.targetSeconds
  if (data.tags !== undefined) questionData.tags = data.tags
  if (data.bloomLevel !== undefined) questionData.bloomLevel = data.bloomLevel
  if (data.status !== undefined) {
    questionData.status = data.status
    if (data.status === 'PUBLISHED' && !existing.publishedAt) {
      questionData.publishedAt = new Date()
    }
  }

  const question = await prisma.question.update({
    where: { id },
    data: questionData,
    include: {
      content: true,
      source: true,
      stats: true,
    },
  })

  // Update content if provided
  if (data.content) {
    const contentData: Record<string, unknown> = {}
    if (data.content.prompt !== undefined) contentData.prompt = data.content.prompt
    if (data.content.promptBn !== undefined) contentData.promptBn = data.content.promptBn
    if (data.content.options !== undefined) contentData.options = data.content.options
    if (data.content.correctIndex !== undefined) contentData.correctIndex = data.content.correctIndex
    if (data.content.explanation !== undefined) contentData.explanation = data.content.explanation
    if (data.content.explanationBn !== undefined) contentData.explanationBn = data.content.explanationBn
    if (data.content.detailedExplanation !== undefined) contentData.detailedExplanation = data.content.detailedExplanation

    await prisma.questionContent.update({
      where: { questionId: id },
      data: contentData,
    })

    // Create version record
    await prisma.questionVersion.create({
      data: {
        questionId: id as string,
        version: (await prisma.questionVersion.count({ where: { questionId: id as string } })) + 1,
        prompt: (data.content.prompt ?? existing.content?.prompt) as string,
        promptBn: data.content.promptBn ?? existing.content?.promptBn ?? null,
        options: JSON.parse(JSON.stringify(data.content.options ?? existing.content?.options ?? [])),
        correctIndex: (data.content.correctIndex ?? existing.content?.correctIndex) as number,
        explanation: (data.content.explanation ?? existing.content?.explanation) as string,
        changedBy: c.get('userId') || 'system',
        changeReason: data.content.detailedExplanation ? 'Updated with detailed explanation' : 'Updated',
      },
    })
  }

  // Update source if provided
  if (data.source) {
    const sourceData: Record<string, unknown> = {}
    if (data.source.examYear !== undefined) sourceData.examYear = data.source.examYear
    if (data.source.questionNumber !== undefined) sourceData.questionNumber = data.source.questionNumber
    if (data.source.sourceType !== undefined) sourceData.sourceType = data.source.sourceType
    if (data.source.sourceName !== undefined) sourceData.sourceName = data.source.sourceName
    if (data.source.sourceUrl !== undefined) sourceData.sourceUrl = data.source.sourceUrl
    if (data.source.verifiedAt !== undefined) {
      sourceData.verifiedAt = data.source.verifiedAt ? new Date(data.source.verifiedAt) : null
    }
    sourceData.verifiedBy = c.get('userId') || 'system'

    await prisma.questionSource.upsert({
      where: { questionId: id as string },
      create: {
        questionId: id as string,
        ...sourceData,
      } as Parameters<typeof prisma.questionSource.upsert>[0]['create'],
      update: sourceData as Parameters<typeof prisma.questionSource.upsert>[0]['update'],
    })
  }

  await cacheDel(cacheKey('questions', question.topicId, question.subTopicId ?? 'any', 'any', 'PUBLISHED'))
  await cacheDel(cacheKey('question-stats', question.topicId, question.subTopicId ?? 'all'))
  return c.json(question)
})