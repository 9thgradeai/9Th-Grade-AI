/* ============================================================
   AI Engine (Phase 3) — Strategy, Adaptive Difficulty, Diagnosis,
   Daily Task planning.

   Deterministic, rule-based engine that requires no external API key
   and is fully testable. It is structured so a later phase can swap
   the heuristics for a call to an LLM (OpenAI) without changing the
   route layer — the outputs are the single source of truth.
   ============================================================ */

import { prisma } from '../app'
import { ensureRevisionItems } from './sm2'
import { realtime } from './realtime'

const DAY_MS = 24 * 60 * 60 * 1000
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/* ------------------------------------------------------------------
   Adaptive Difficulty
   Maps recent accuracy to a target difficulty (1-5). A slightly Elo-ish
   ramp: the band edges are asymmetric so a learner must keep improving
   to hold a difficulty. Works for the whole user or a single subject.
   ------------------------------------------------------------------ */

export function difficultyFromAccuracy(accuracy: number): number {
  if (accuracy >= 92) return 5
  if (accuracy >= 78) return 4
  if (accuracy >= 58) return 3
  if (accuracy >= 42) return 2
  return 1
}

export async function recommendDifficulty(userId: string, subjectId?: string): Promise<number> {
  let accuracy: number
  if (subjectId) {
    const us = await prisma.userSubject.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
    })
    accuracy = us?.accuracy ?? 50
  } else {
    const perf = await prisma.performance.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
    accuracy = perf?.accuracy ?? 50
  }
  return difficultyFromAccuracy(accuracy)
}

/* ------------------------------------------------------------------
   Strategy → Roadmap
   Computes phases + priorities from current mastery, the exam date,
   and the user's weakest subjects. Returns data ready to persist.
   ------------------------------------------------------------------ */

export interface RoadmapData {
  examId: string
  examName: string
  examDate: Date
  daysRemaining: number
  currentMastery: number
  targetMastery: number
  dailyEffortMinutes: number
  phases: RoadmapPhaseData[]
  priorities: string[]
}

export interface RoadmapPhaseData {
  id: string
  title: string
  week: number
  weeks: number
  focus: string
}

export async function buildRoadmap(opts: {
  userId: string
  examId: string
  examName: string
  examDate: Date
  targetMastery?: number
}): Promise<RoadmapData> {
  const { userId, examId, examName, examDate, targetMastery = 90 } = opts
  const perf = await prisma.performance.findUnique({
    where: { userId_examId: { userId, examId } },
  })
  const currentMastery = perf?.mastery ?? 0

  const daysRemaining = Math.max(1, Math.ceil((examDate.getTime() - Date.now()) / DAY_MS))

  // Effort scales up as the exam approaches.
  const dailyEffortMinutes = daysRemaining > 120 ? 45 : daysRemaining > 60 ? 60 : daysRemaining > 30 ? 75 : 90

  // Priorities = weakest subjects (lowest mastery/accuracy first).
  const userSubjects = await prisma.userSubject.findMany({
    where: { userId, examId },
    include: { subject: true },
    orderBy: { accuracy: 'asc' },
    take: 3,
  })
  const priorities =
    userSubjects.length > 0
      ? userSubjects.map((us) => `${us.subject.name} (${us.accuracy}% accuracy)`)
      : [`Build a consistent daily practice habit`, `Complete a diagnostic to map weaknesses`]

  // Four progressive phases whose depth depends on time remaining.
  const totalWeeks = clamp(Math.ceil(daysRemaining / 7), 4, 24)
  const week = (f: number) => Math.min(totalWeeks, Math.max(1, Math.round(totalWeeks * f)))
  const phases: RoadmapPhaseData[] = [
    {
      id: 'foundation',
      title: 'Foundation',
      week: 1,
      weeks: week(0.25),
      focus: 'Close the highest-loss gaps first — lock the fundamentals in every weak subject.',
    },
    {
      id: 'strengthen',
      title: 'Strengthen',
      week: week(0.25) + 1,
      weeks: week(0.5),
      focus: 'Raise accuracy and speed on the syllabus core; move difficulty up as mastery grows.',
    },
    {
      id: 'hardening',
      title: 'Hardening',
      week: week(0.5) + 1,
      weeks: week(0.75),
      focus: 'Full-length timed practice under pressure; attack careless and time-pressure errors.',
    },
    {
      id: 'final',
      title: 'Mock & Final',
      week: week(0.75) + 1,
      weeks: totalWeeks,
      focus: 'Replicate the real exam rhythm with mocks; review diagnosis notes and weak spots.',
    },
  ]

  return {
    examId,
    examName,
    examDate,
    daysRemaining,
    currentMastery,
    targetMastery,
    dailyEffortMinutes,
    phases,
    priorities,
  }
}

/* ------------------------------------------------------------------
   Daily Task planning
   Produces a focused plan from the user's weakest topics, balanced
   across practice / revision / test. Used by the dashboard endpoint.
   ------------------------------------------------------------------ */

export interface DailyTaskInput {
  userId: string
  subject: string
  topic: string
  kind: 'practice' | 'revision' | 'test' | 'review'
  durationMinutes: number
  priority: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  expectedQuestions: number | null
  date: Date
}

export async function planDailyTasks(userId: string, examId: string, count = 3): Promise<DailyTaskInput[]> {
  // Weakest topics the user has engaged with, else catalog defaults.
  const weak = await prisma.userTopic.findMany({
    where: { userId, topic: { subject: { examId } } },
    orderBy: { accuracy: 'asc' },
    take: count,
    include: { topic: { include: { subject: true } } },
  })

  const picks = weak.length
    ? weak.map((ut) => ({ topic: ut.topic, accuracy: ut.accuracy }))
    : await prisma.topic
        .findMany({
          where: { subject: { examId } },
          include: { subject: true },
          orderBy: { name: 'asc' },
          take: count,
        })
        .then((ts) => ts.map((t) => ({ topic: t, accuracy: 0 })))

  const templates: Array<Omit<DailyTaskInput, 'userId' | 'subject' | 'topic' | 'date'>> = [
    { kind: 'practice', durationMinutes: 20, priority: 'high', impact: 'high', expectedQuestions: 10 },
    { kind: 'revision', durationMinutes: 15, priority: 'medium', impact: 'medium', expectedQuestions: null },
    { kind: 'test', durationMinutes: 25, priority: 'high', impact: 'high', expectedQuestions: 15 },
  ]

  // Sort picks weakest-first and pair each with a template.
  return picks
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((p, i) => {
      const t = templates[Math.min(i, templates.length - 1)]
      return {
        userId,
        subject: p.topic.subject.name,
        topic: p.topic.name,
        kind: t.kind,
        durationMinutes: t.durationMinutes,
        priority: t.priority,
        impact: t.impact,
        expectedQuestions: t.expectedQuestions,
        date: new Date(),
      }
    })
}

/* ------------------------------------------------------------------
   Diagnosis
   Classifies each wrong answer into an error mode and produces a set
   of actionable AIRecommendations. Persisted per user.
   ------------------------------------------------------------------ */

export interface DiagnosisInput {
  testId: string
  userId: string
  score: number
  accuracy: number
  targetTopicId: string | null
  losses: Record<string, number>
}

interface ClassifiedError {
  mode: 'concept-gap' | 'time-pressure' | 'careless' | 'difficulty-gap'
  subject: string
  topic: string
}

export async function diagnoseTest(testId: string, userId: string): Promise<DiagnosisInput & { modes: Record<string, number> }> {
  const attempts = await prisma.questionAttempt.findMany({
    where: { testId },
    include: { question: { include: { topic: { include: { subject: true } } } } },
  })
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { result: true },
  })

  const modes: Record<string, number> = { 'concept-gap': 0, 'time-pressure': 0, careless: 0, 'difficulty-gap': 0 }
  const classified: ClassifiedError[] = []
  const errorTopicIds = new Set<string>()

  for (const a of attempts) {
    if (a.correct) continue
    const q = a.question
    errorTopicIds.add(q.topicId)
    let mode: ClassifiedError['mode']
    const overTarget = a.timeSpentSeconds > q.targetSeconds * 1.5
    const highConfidence = a.confidence >= 4
    const fast = a.timeSpentSeconds < q.targetSeconds * 0.6
    if (q.difficulty >= 4) mode = 'difficulty-gap'
    else if (overTarget) mode = 'time-pressure'
    else if (highConfidence && fast) mode = 'careless'
    else mode = 'concept-gap'
    modes[mode] += 1
    classified.push({ mode, subject: q.topic.subject.name, topic: q.topic.name })
  }

  // Phase 4: schedule the error topics into the spaced-repetition queue.
  if (errorTopicIds.size > 0) {
    await ensureRevisionItems(userId, [...errorTopicIds])
  }

  // Persist recommendations derived from the diagnosis.
  const result = test?.result
  const losses: Record<string, number> = result
    ? (JSON.parse(result.losses ?? '{}') as Record<string, number>)
    : {}
  const weakestSubject = Object.entries(losses).sort((a, b) => b[1] - a[1])[0]

  const recs: Array<{
    userId: string
    kind: 'diagnosis' | 'action' | 'strategy' | 'alert'
    severity: 'low' | 'medium' | 'high'
    title: string
    body: string
    actionLabel: string | null
    actionRoute: string | null
  }> = []

  if (modes['concept-gap'] > 0) {
    recs.push({
      userId, kind: 'diagnosis', severity: 'high',
      title: 'Concept gaps detected',
      body: `${modes['concept-gap']} wrong answers trace to fundamentals. Review the ${classified.find((c) => c.mode === 'concept-gap')?.topic ?? 'affected'} topic, then re-attempt.`,
      actionLabel: 'Review topic', actionRoute: null,
    })
  }
  if (modes['time-pressure'] > 0) {
    recs.push({
      userId, kind: 'action', severity: 'medium',
      title: 'Time pressure is costing marks',
      body: `${modes['time-pressure']} errors happened after you ran long. Practise with a per-question timer to raise your pacing.`,
      actionLabel: 'Paced practice', actionRoute: null,
    })
  }
  if (modes.careless > 0) {
    recs.push({
      userId, kind: 'alert', severity: 'medium',
      title: 'Careless mistakes',
      body: `${modes.careless} wrong answers were quick and high-confidence. Slow down on 2-mark reads and double-check.`,
      actionLabel: null, actionRoute: null,
    })
  }
  if (modes['difficulty-gap'] > 0) {
    recs.push({
      userId, kind: 'strategy', severity: 'high',
      title: 'Pushing difficulty too fast',
      body: `${modes['difficulty-gap']} errors came from 4-5 difficulty questions. Stabilise accuracy at level ${Math.max(1, difficultyFromAccuracy(result?.accuracy ?? 50) - 1)} before advancing.`,
      actionLabel: null, actionRoute: null,
    })
  }
  if (weakestSubject) {
    recs.push({
      userId, kind: 'strategy', severity: 'high',
      title: `Prioritise ${weakestSubject[0]}`,
      body: `${weakestSubject[0]} accounts for ${weakestSubject[1]} marks lost. Make it the top of tomorrow's plan.`,
      actionLabel: 'Open subject', actionRoute: null,
    })
  }
  if (recs.length === 0) {
    recs.push({
      userId, kind: 'diagnosis', severity: 'low',
      title: 'Clean session',
      body: 'No error pattern detected. Maintain the streak and raise the difficulty one step.',
      actionLabel: null, actionRoute: null,
    })
  }

  await prisma.aIRecommendation.createMany({ data: recs })

  // Phase 6: notify the user's open connections of fresh recommendations.
  realtime.publishToUser(userId, 'recommendation:new', { count: recs.length })

  return {
    testId,
    userId,
    score: result?.score ?? 0,
    accuracy: result?.accuracy ?? 0,
    targetTopicId: result?.targetTopicId ?? null,
    losses,
    modes,
  }
}
