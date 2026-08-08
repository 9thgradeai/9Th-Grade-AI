import { Hono } from 'hono'
import { prisma } from '../app'

/* ============================================================
   Exam routes — exams, subjects, topics.
   ============================================================ */

export const examRoutes = new Hono()

// List all exams
examRoutes.get('/', async (c) => {
  const exams = await prisma.exam.findMany({
    orderBy: { name: 'asc' },
  })
  return c.json(exams)
})

// Get exam by slug
examRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const exam = await prisma.exam.findUnique({ where: { slug } })
  if (!exam) return c.json({ error: 'Exam not found' }, 404)
  return c.json(exam)
})

// List subjects for exam
examRoutes.get('/:slug/subjects', async (c) => {
  const slug = c.req.param('slug')
  const exam = await prisma.exam.findUnique({ where: { slug } })
  if (!exam) return c.json({ error: 'Exam not found' }, 404)

  const subjects = await prisma.subject.findMany({
    where: { examId: exam.id },
    orderBy: { sortOrder: 'asc' },
    include: { topics: true },
  })

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
