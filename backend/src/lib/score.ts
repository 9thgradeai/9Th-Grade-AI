/* ============================================================
   Grading & performance math for Phase 2 (Core Data).
   Pure computation + the post-test aggregation that refreshes a
   user's Performance snapshot. Rule-based diagnosis here — the full
   AI engine arrives in Phase 3.
   ============================================================ */

import { prisma } from '../app'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round = (n: number) => Math.round(n)

/** A question enriched with its topic/subject for grading. */
export interface GradedQuestion {
  questionId: string
  subjectId: string
  subjectName: string
  topicId: string
  topicName: string
  difficulty: number
  targetSeconds: number
}

/** An attempt for a question in the test. */
export interface GradedAttempt {
  questionId: string
  selectedIndex: number | null
  correct: boolean
  timeSpentSeconds: number
  confidence: number
}

export interface GradedResult {
  score: number
  accuracy: number
  speed: number
  retention: number
  percentile: number
  correct: number
  total: number
  timeSpentMinutes: number
  losses: Record<string, number> // subjectId -> marks lost
  diagnosis: string
  nextBestAction: string
  targetTopicId: string | null
}

/**
 * Grade a completed test. Unanswered questions count as incorrect.
 * Losses are attributed by difficulty so heavier questions weigh more.
 */
export function computeTestResult(
  questions: GradedQuestion[],
  attempts: GradedAttempt[],
  percentile: number,
): GradedResult {
  const byId = new Map(attempts.map((a) => [a.questionId, a]))
  const total = questions.length || 1

  let correctCount = 0
  let weightedScore = 0
  let weightTotal = 0
  let timeSum = 0
  let confidenceSum = 0
  let answeredCount = 0
  let targetSum = 0

  const losses: Record<string, number> = {} // subjectId -> marks lost
  const nameLosses = new Map<string, number>()
  const topicErrors = new Map<string, number>()
  let worstSubjectName = ''
  let worstSubjectLoss = 0
  let worstTopic = ''

  for (const q of questions) {
    const a = byId.get(q.questionId)
    const correct = a?.correct === true
    const difficulty = Math.max(1, q.difficulty)
    weightTotal += difficulty
    targetSum += q.targetSeconds

    if (correct) {
      correctCount += 1
      weightedScore += difficulty
    } else {
      // Attribute the loss to this question's subject & topic
      losses[q.subjectId] = (losses[q.subjectId] ?? 0) + difficulty
      const nameLoss = (nameLosses.get(q.subjectName) ?? 0) + difficulty
      nameLosses.set(q.subjectName, nameLoss)
      const tErr = (topicErrors.get(q.topicName) ?? 0) + 1
      topicErrors.set(q.topicName, tErr)
      if (nameLoss > worstSubjectLoss) {
        worstSubjectName = q.subjectName
        worstSubjectLoss = nameLoss
      }
      if (!worstTopic || (topicErrors.get(worstTopic) ?? 0) < tErr) {
        worstTopic = q.topicName
      }
    }

    const spent = a?.timeSpentSeconds ?? 0
    timeSum += spent
    if (a?.selectedIndex != null) {
      answeredCount += 1
      confidenceSum += a?.confidence ?? 3
    }
  }

  const accuracy = round((correctCount / total) * 100)
  const score = round((weightedScore / weightTotal) * 100)
  const avgTime = timeSum / total
  const avgTarget = targetSum / total
  const speed = round(clamp(100 - ((avgTime - avgTarget) / Math.max(avgTarget, 1)) * 100, 0, 100))
  const avgConfidence = answeredCount ? confidenceSum / answeredCount : 3
  const retention = round(clamp(accuracy * 0.6 + (avgConfidence / 5) * 100 * 0.4, 0, 100))

  const timeSpentMinutes = round(timeSum / 60)
  const targetTopicId = questions.find((q) => q.topicName === worstTopic)?.topicId ?? null

  let diagnosis = 'No clear error pattern detected — keep practising across subjects.'
  let nextBestAction = 'Continue with your daily practice plan.'
  if (worstSubjectName) {
    const lost = nameLosses.get(worstSubjectName) ?? 0
    diagnosis = `${worstSubjectName} accounts for the largest share of your errors (${lost} marks lost). ` +
      `Concentrate on ${worstTopic} — these are your highest-leverage quick wins.`
    nextBestAction = `Complete a targeted ${worstSubjectName} session focusing on ${worstTopic}.`
  }

  return {
    score,
    accuracy,
    speed,
    retention,
    percentile,
    correct: correctCount,
    total: questions.length,
    timeSpentMinutes,
    losses,
    diagnosis,
    nextBestAction,
    targetTopicId,
  }
}

/** Overall percentile of `score` among the exam's existing results. */
export async function computePercentile(examId: string, score: number): Promise<number> {
  const all = await prisma.testResult.findMany({
    where: { test: { examId } },
    select: { score: true },
  })
  if (all.length === 0) return 85
  const lower = all.filter((r) => r.score < score).length
  return Math.round((lower / all.length) * 100)
}

/**
 * Recompute a user's Performance row for an exam from their results.
 * Also records a StudySession so daily/weekly history stays accurate.
 */
export async function refreshPerformance(
  userId: string,
  examId: string,
  minutes: number,
): Promise<void> {
  const results = await prisma.testResult.findMany({
    where: { userId, test: { examId } },
    orderBy: { completedAt: 'asc' },
    select: { accuracy: true, speed: true, retention: true, percentile: true, completedAt: true },
  })

  const n = Math.max(results.length, 1)
  const avg = (pick: (r: (typeof results)[number]) => number) =>
    Math.round(results.reduce((s, r) => s + pick(r), 0) / n)
  const accuracy = avg((r) => r.accuracy)
  const speed = avg((r) => r.speed)
  const retention = avg((r) => r.retention)
  const percentile = Math.round(avg((r) => r.percentile))
  const mastery = round(clamp(accuracy * 0.4 + speed * 0.3 + retention * 0.3, 0, 100))
  const potentialScore = round(clamp(percentile + 5, 0, 100))

  const trajectory = results.map((r) => r.accuracy).slice(-12)

  // Aggregate study minutes by day for the trailing week.
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  const sessions = await prisma.studySession.findMany({
    where: { userId, date: { gte: since } },
    select: { date: true, minutes: true },
  })
  const dayMinutes = new Map<string, number>()
  for (const s of sessions) {
    const day = s.date.toISOString().slice(0, 10)
    dayMinutes.set(day, (dayMinutes.get(day) ?? 0) + s.minutes)
  }
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const studyHistory = days.map((day, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    return { day, minutes: dayMinutes.get(d) ?? 0 }
  })

  // Streak: count contiguous days (ending today or yesterday) with any session.
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    if (dayMinutes.has(d) || i === 0) streak += 1
    else break
  }

  await prisma.performance.upsert({
    where: { userId_examId: { userId, examId } },
    update: {
      mastery,
      accuracy,
      speed,
      retention,
      examReadiness: mastery,
      percentile,
      potentialScore,
      trajectory: JSON.stringify(trajectory),
      studyHistory: JSON.stringify(studyHistory),
      streakDays: streak,
    },
    create: {
      userId,
      examId,
      mastery,
      syllabusCoverage: 0,
      consistency: speed,
      accuracy,
      speed,
      retention,
      examReadiness: mastery,
      potentialScore,
      percentile,
      trajectory: JSON.stringify(trajectory),
      studyHistory: JSON.stringify(studyHistory),
      streakDays: streak,
    },
  })

  // Record the study session for this completed test.
  await prisma.studySession.create({
    data: { userId, minutes: Math.max(1, minutes), tasks: JSON.stringify(['completed a test']) },
  })
}
