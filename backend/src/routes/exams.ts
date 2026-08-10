import { Hono } from 'hono'
import { prisma } from '../app'
import { cacheGet, cacheSet, cacheKey } from '../lib/cache'

/* ============================================================
   Exam routes — exams, subjects, topics.
   ============================================================ */

export const examRoutes = new Hono()

// List all exams (catalog is static — cache it).
examRoutes.get('/', async (c) => {
  const key = cacheKey('exams', 'list')
  const cached = await cacheGet(key)
  if (cached) return c.json(cached)
  const exams = await prisma.exam.findMany({
    orderBy: { name: 'asc' },
  })
  await cacheSet(key, exams, 300)
  return c.json(exams)
})

// List all subjects (flat catalog) for the app-wide subject pickers.
// Registered before `/:slug` so the static path is matched first.
examRoutes.get('/subjects', async (c) => {
  const key = cacheKey('subjects', 'all')
  const cached = await cacheGet(key)
  if (cached) return c.json(cached)
  const subjects = await prisma.subject.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { topics: true },
  })
  await cacheSet(key, subjects, 300)
  return c.json(subjects)
})

// List topics for a subject. Registered before `/topics/:id`.
examRoutes.get('/topics', async (c) => {
  const subjectId = c.req.query('subjectId')
  if (!subjectId) return c.json({ error: 'subjectId is required' }, 400)
  const topics = await prisma.topic.findMany({
    where: { subjectId },
    orderBy: { name: 'asc' },
  })
  return c.json(topics)
})

// Get exam by slug
examRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const exam = await prisma.exam.findUnique({ where: { slug } })
  if (!exam) return c.json({ error: 'Exam not found' }, 404)
  return c.json(exam)
})

// List subjects for exam (catalog is static — cache it).
examRoutes.get('/:slug/subjects', async (c) => {
  const slug = c.req.param('slug')
  const key = cacheKey('subjects', slug)
  const cached = await cacheGet(key)
  if (cached) return c.json(cached)

  const exam = await prisma.exam.findUnique({ where: { slug } })
  if (!exam) return c.json({ error: 'Exam not found' }, 404)

  const subjects = await prisma.subject.findMany({
    where: { examId: exam.id },
    orderBy: { sortOrder: 'asc' },
    include: { topics: true },
  })

  await cacheSet(key, subjects, 300)
  return c.json(subjects)
})

// Get subject with topics
examRoutes.get('/subjects/:id', async (c) => {
  const id = c.req.param('id')
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: { topics: true },
  })
  if (!subject) return c.json({ error: 'Subject not found' }, 404)
  return c.json(subject)
})

// Get topic with questions
examRoutes.get('/topics/:id', async (c) => {
  const id = c.req.param('id')
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      subject: true,
      questions: { take: 10 },
    },
  })
  if (!topic) return c.json({ error: 'Topic not found' }, 404)
  return c.json(topic)
})
