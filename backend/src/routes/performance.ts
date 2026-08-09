import { Hono } from 'hono'
import { prisma } from '../app'
import type { AppEnv } from '../types/env'

/* ============================================================
   Performance routes — aggregate metrics + per-subject breakdown.
   ============================================================ */

export const performanceRoutes = new Hono<AppEnv>()

/** The user's primary exam: first with activity, else the first catalog exam. */
async function primaryExam(userId: string) {
  const withActivity = await prisma.testResult.findFirst({
    where: { userId },
    select: { test: { select: { examId: true } } },
    orderBy: { completedAt: 'desc' },
  })
  const examId = withActivity?.test.examId
  if (examId) {
    return prisma.exam.findUnique({ where: { id: examId } })
  }
  return prisma.exam.findFirst({ orderBy: { name: 'asc' } })
}

// GET /api/performance
performanceRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string
  const exam = await primaryExam(userId)
  if (!exam) return c.json({ error: 'No exam configured' }, 500)

  const perf = await prisma.performance.findUnique({
    where: { userId_examId: { userId, examId: exam.id } },
  })

  return c.json({
    exam: {
      id: exam.id,
      slug: exam.slug,
      name: exam.name,
      shortName: exam.shortName,
    },
    performance: perf
      ? {
          mastery: perf.mastery,
          syllabusCoverage: perf.syllabusCoverage,
          consistency: perf.consistency,
          accuracy: perf.accuracy,
          speed: perf.speed,
          retention: perf.retention,
          examReadiness: perf.examReadiness,
          potentialScore: perf.potentialScore,
          percentile: perf.percentile,
          streakDays: perf.streakDays,
          trajectory: perf.trajectory ? JSON.parse(perf.trajectory) : [],
          studyHistory: perf.studyHistory ? JSON.parse(perf.studyHistory) : [],
        }
      : null,
  })
})

// GET /api/performance/subjects
performanceRoutes.get('/subjects', async (c) => {
  const userId = c.get('userId') as string
  const exam = await primaryExam(userId)
  if (!exam) return c.json({ error: 'No exam configured' }, 500)

  const userSubjects = await prisma.userSubject.findMany({
    where: { userId, examId: exam.id },
    include: { subject: true },
    orderBy: { subject: { sortOrder: 'asc' } },
  })

  // Return a row for every catalog subject so the UI gets a full list
  // (rows with no progress yet report zeros).
  const subjects = await prisma.subject.findMany({
    where: { examId: exam.id },
    orderBy: { sortOrder: 'asc' },
  })

  const rows = subjects.map((s) => {
    const us = userSubjects.find((x) => x.subjectId === s.id)
    return {
      subject: {
        id: s.id,
        name: s.name,
        nameBn: s.nameBn,
        weight: s.weight,
      },
      mastery: us?.mastery ?? 0,
      accuracy: us?.accuracy ?? 0,
      speed: us?.speed ?? 0,
      retention: us?.retention ?? 0,
    }
  })

  return c.json({ examId: exam.id, subjects: rows })
})

// GET /api/performance/trajectory
performanceRoutes.get('/trajectory', async (c) => {
  const userId = c.get('userId') as string
  const exam = await primaryExam(userId)
  if (!exam) return c.json({ error: 'No exam configured' }, 500)

  const perf = await prisma.performance.findUnique({
    where: { userId_examId: { userId, examId: exam.id } },
  })

  return c.json({
    trajectory: perf?.trajectory ? JSON.parse(perf.trajectory) : [],
    studyHistory: perf?.studyHistory ? JSON.parse(perf.studyHistory) : [],
    streakDays: perf?.streakDays ?? 0,
  })
})
