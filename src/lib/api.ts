import type {
  User,
  Exam,
  Subject,
  Topic,
  Question,
  Performance,
  Roadmap,
  RoadmapPhase,
  DailyTask,
  RevisionItem,
  AIBriefing,
  AIRecommendation,
  Test,
} from '@/lib/types'
import * as data from '@/lib/data'
import { listMemoryItems } from '@/lib/memoryStore'
import { client, isFeatureLocked } from '@/lib/client'

/* ============================================================
   Service layer. UI components depend on these async functions
   only. Each method first tries the real API (Hono/Prisma backend)
   and falls back to the bundled mock data when the backend is
   unreachable, unauthenticated, or not configured — so the demo
   never breaks. Swap/remove the fallbacks once the backend is the
   single source of truth.

   Every method is routed through `memo`, which:
     - dedupes in-flight requests (no duplicate fetches when several
       components mount at once, or under React StrictMode)
     - optionally value-caches static catalog reads with a TTL
   Call `clearApiCache()` after logout to drop any cached values.
   ============================================================ */

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))

async function withLoading<T>(value: T, ms?: number): Promise<T> {
  await delay(ms)
  return value
}

/**
 * Try the real backend. The bundled mock `data/*` is a DEV-ONLY fallback so
 * local work isn't blocked by a missing API. In production there is exactly
 * ONE server-state source of truth: the real backend. Any failure (except a
 * paywall, which must surface as an upgrade prompt) is rethrown so the UI
 * shows a real error/empty state instead of fabricating data.
 */
async function fromBackend<T>(real: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
  try {
    return await real()
  } catch (e) {
    if (isFeatureLocked(e)) throw e
    if (import.meta.env.DEV && fallback) return fallback()
    throw e
  }
}

/* ---- Cache/dedup ---- */
const inflight = new Map<string, Promise<unknown>>()
const valueCache = new Map<string, { value: unknown; expiresAt: number }>()

/**
 * Dedup concurrent identical calls; optionally cache resolved values for
 * `ttlMs`. `ttlMs` is used only for static catalog reads. Never caches
 * rejections.
 */
function memo<T>(key: string, real: () => Promise<T>, ttlMs?: number, fallback?: () => Promise<T>): Promise<T> {
  if (ttlMs) {
    const c = valueCache.get(key)
    if (c && c.expiresAt > Date.now()) return Promise.resolve(c.value as T)
  }
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>

  const p = fromBackend(real, fallback)
    .then((v) => {
      if (ttlMs) valueCache.set(key, { value: v, expiresAt: Date.now() + ttlMs })
      return v
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

/** Drop cached values (e.g. on logout so a different session can't read stale data). */
export function clearApiCache(): void {
  valueCache.clear()
}

/* ---- Field translation (backend → frontend domain types) ---- */

interface RawExam {
  id: string
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  color: string
  icon: string
  configurableSyllabus: boolean
}
function toExam(e: RawExam): Exam {
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    shortName: e.shortName,
    tagline: e.tagline,
    description: e.description,
    color: e.color,
    icon: e.icon,
    configurableSyllabus: e.configurableSyllabus,
  }
}

interface RawSubject {
  id: string
  examId: string
  name: string
  nameBn?: string
  weight: number
  mastery?: number
  accuracy?: number
  speed?: number
  retention?: number
}
function toSubject(s: RawSubject): Subject {
  return {
    id: s.id,
    examId: s.examId,
    name: s.name,
    nameBn: s.nameBn,
    weight: s.weight,
    mastery: s.mastery ?? 0,
    accuracy: s.accuracy ?? 0,
    speed: s.speed ?? 0,
    retention: s.retention ?? 0,
  }
}

interface RawTopic {
  id: string
  subjectId: string
  name: string
  mastery?: number
  accuracy?: number
  speed?: number
  retention?: number
  status?: string
  reviewDue?: number
}
function toTopic(t: RawTopic): Topic {
  return {
    id: t.id,
    subjectId: t.subjectId,
    name: t.name,
    mastery: t.mastery ?? 0,
    accuracy: t.accuracy ?? 0,
    speed: t.speed ?? 0,
    retention: t.retention ?? 0,
    status: (t.status as Topic['status']) ?? 'locked',
    reviewDue: t.reviewDue,
  }
}

interface RawQuestion {
  id: string
  topicId: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: number
  targetSeconds: number
}
function toQuestion(q: RawQuestion): Question {
  return {
    id: q.id,
    topicId: q.topicId,
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    difficulty: q.difficulty as 1 | 2 | 3 | 4 | 5,
    targetSeconds: q.targetSeconds,
  }
}

interface RawPerformance {
  mastery: number
  syllabusCoverage: number
  consistency: number
  accuracy: number
  speed: number
  retention: number
  examReadiness: number
  potentialScore: number
  percentile: number
  streakDays: number
  trajectory: number[]
  studyHistory: { day: string; minutes: number }[]
}
function toPerformance(p: RawPerformance): Performance {
  return {
    mastery: p.mastery,
    syllabusCoverage: p.syllabusCoverage,
    consistency: p.consistency,
    accuracy: p.accuracy,
    speed: p.speed,
    retention: p.retention,
    examReadiness: p.examReadiness,
    potentialScore: p.potentialScore,
    percentile: p.percentile,
    targetPercentile: Math.max(p.percentile, 85),
    projectedPercentile: p.percentile,
    trajectory: p.trajectory ?? [],
    studyHistory: p.studyHistory ?? [],
    streakDays: p.streakDays,
  }
}

interface RawRoadmapPhase {
  id?: string
  title?: string
  week?: number
  weeks?: number
  focus?: string
  name?: string
}
function toPhase(p: RawRoadmapPhase, i: number): RoadmapPhase {
  return {
    id: p.id ?? `phase_${i}`,
    title: p.title ?? p.name ?? '',
    week: p.week ?? 0,
    weeks: p.weeks ?? 0,
    focus: p.focus ?? '',
  }
}

function toDailyTask(t: {
  id: string
  subject: string
  topic: string
  kind: string
  durationMinutes: number
  priority: string
  impact?: string
  expectedQuestions?: number
  status: string
}): DailyTask {
  return {
    id: t.id,
    subject: t.subject,
    topic: t.topic,
    kind: (t.kind as DailyTask['kind']) ?? 'practice',
    durationMinutes: t.durationMinutes,
    priority: (t.priority as DailyTask['priority']) ?? 'medium',
    impact: (t.impact as DailyTask['impact']) ?? 'medium',
    expectedQuestions: t.expectedQuestions,
    status: (t.status as DailyTask['status']) ?? 'pending',
  }
}

function toRevisionItem(i: {
  id: string
  topic: string
  subject: string
  memoryStrength: number
  lastReviewed: string
  nextReview: string
  overdue: boolean
}): RevisionItem {
  return {
    id: i.id,
    topic: i.topic,
    subject: i.subject,
    memoryStrength: i.memoryStrength,
    lastReviewed: i.lastReviewed,
    nextReview: i.nextReview,
    overdue: i.overdue,
  }
}

function toAIRecommendation(r: {
  id: string
  kind: string
  severity: string
  title: string
  body: string
  actionLabel?: string
  actionRoute?: string
}): AIRecommendation {
  return {
    id: r.id,
    kind: (r.kind as AIRecommendation['kind']) ?? 'action',
    severity: (r.severity as AIRecommendation['severity']) ?? 'medium',
    title: r.title,
    body: r.body,
    actionLabel: r.actionLabel,
    actionRoute: r.actionRoute,
  }
}

const TTL_CATALOG = 5 * 60_000 // static syllabus / exam metadata (brief §34)
const TTL_QUESTIONS = 2 * 60_000

export const api = {
  getUser(): Promise<User> {
    return memo(
      'getUser',
      () =>
        client
          .get<{ id: string; name?: string; email: string; firstName?: string; timezone?: string; createdAt?: string }>('/users/me')
          .then((u) => ({
            id: u.id,
            name: u.name ?? u.firstName ?? '',
            email: u.email,
            firstName: u.firstName ?? u.name ?? '',
            timezone: u.timezone ?? 'Asia/Dhaka',
            createdAt: u.createdAt ?? new Date().toISOString(),
          })),
      undefined,
      () => withLoading(data.user),
    )
  },

  listExams(): Promise<Exam[]> {
    return memo(
      'listExams',
      () => client.get<RawExam[]>('/exams').then((list) => list.map(toExam)),
      TTL_CATALOG,
    )
  },

  getExam(slug: string): Promise<Exam | undefined> {
    return memo(
      `getExam:${slug}`,
      () => client.get<RawExam>(`/exams/${slug}`).then(toExam),
      TTL_CATALOG,
    )
  },

  listSubjects(_examId?: string): Promise<Subject[]> {
    return memo(
      'listSubjects',
      () => client.get<RawSubject[]>('/exams/subjects').then((list) => list.map(toSubject)),
      TTL_CATALOG,
    )
  },

  getSubject(id: string): Promise<Subject | undefined> {
    return memo(
      `getSubject:${id}`,
      () => client.get<RawSubject>(`/exams/subjects/${id}`).then(toSubject),
      TTL_CATALOG,
    )
  },

  listTopics(subjectId: string): Promise<Topic[]> {
    return memo(
      `listTopics:${subjectId}`,
      () =>
        client
          .get<RawTopic[]>(`/exams/topics?subjectId=${encodeURIComponent(subjectId)}`)
          .then((list) => list.map(toTopic)),
      TTL_CATALOG,
    )
  },

  getTopic(id: string): Promise<Topic | undefined> {
    return memo(
      `getTopic:${id}`,
      () => client.get<RawTopic>(`/exams/topics/${id}`).then(toTopic),
      TTL_CATALOG,
      () => withLoading(data.topics.find((t) => t.id === id)),
    )
  },

  listQuestions(topicId: string, count = 10): Promise<Question[]> {
    return memo(
      `listQuestions:${topicId}:${count}`,
      () =>
        client
          .get<{ questions: RawQuestion[] }>(`/questions/${encodeURIComponent(topicId)}?limit=${count}`)
          .then((r) => r.questions.map(toQuestion)),
      TTL_QUESTIONS,
    )
  },

  getPerformance(): Promise<Performance> {
    return memo(
      'getPerformance',
      () =>
        client
          .get<{ performance: RawPerformance }>('/performance')
          .then((r) => toPerformance(r.performance)),
      TTL_CATALOG,
    )
  },

  getRoadmap(): Promise<Roadmap> {
    return memo(
      'getRoadmap',
      () =>
        client
          .get<{ examId: string; roadmap: { examName: string; daysRemaining: number; currentMastery: number; targetMastery: number; dailyEffortMinutes: number; phases: RawRoadmapPhase[]; priorities: string[] } }>('/strategy')
          .then((r) => ({
            examId: r.examId,
            examName: r.roadmap.examName,
            examDate: '',
            daysRemaining: r.roadmap.daysRemaining,
            currentMastery: r.roadmap.currentMastery,
            targetMastery: r.roadmap.targetMastery,
            dailyEffortMinutes: r.roadmap.dailyEffortMinutes,
            phases: r.roadmap.phases.map(toPhase),
            priorities: r.roadmap.priorities,
          })),
      TTL_CATALOG,
    )
  },

  getDailyTasks(): Promise<DailyTask[]> {
    return memo(
      'getDailyTasks',
      () => client.get<{ tasks: Parameters<typeof toDailyTask>[0][] }>('/dashboard/daily-tasks').then((r) => r.tasks.map(toDailyTask)),
      TTL_CATALOG,
    )
  },

  getRevisionItems(): Promise<RevisionItem[]> {
    const withLocal = (items: RevisionItem[]): RevisionItem[] => [...items, ...listMemoryItems()]
    return memo(
      'getRevisionItems',
      () =>
        client
          .get<{ items: { id: string; topic: string; subject: string; memoryStrength: number; lastReviewed: string; nextReview: string; overdue: boolean }[] }>('/revision/items')
          .then((r) => withLocal(r.items.map(toRevisionItem))),
      TTL_CATALOG,
    )
  },

  getAIBriefing(): Promise<AIBriefing> {
    return memo(
      'getAIBriefing',
      () =>
        client
          .get<{ id?: string; title?: string; items?: string[] }>('/ai/briefing')
          .then((r) => ({ id: r.id ?? 'briefing', title: r.title ?? '', items: r.items ?? [] })),
      TTL_CATALOG,
    )
  },

  getAIRecommendations(): Promise<AIRecommendation[]> {
    return memo(
      'getAIRecommendations',
      () =>
        client
          .get<{ recommendations: Parameters<typeof toAIRecommendation>[0][] }>('/ai/recommendations')
          .then((r) => r.recommendations.map(toAIRecommendation)),
      TTL_CATALOG,
    )
  },

  /* The exam engine stays on mock for now: the practice/mock UI grades
     client-side and relies on `correctIndex`, which the backend deliberately
     strips on delivery (§31). Server-side grading is a follow-up that reworks
     Practice/MockTest/Results together. */
  /** Save onboarding preferences to the real backend (never mocked). */
  savePreferences(prefs: { examId: string; examDate: string; dailyTime: string; level: string; diagnosticScore: number; priorities?: string[] }): Promise<{ ok: boolean; onboardingCompleted: boolean }> {
    return client.post('/users/me/preferences', prefs)
  },

  /** Check whether onboarding has been completed. */
  getOnboardingState(): Promise<{ onboardingCompleted: boolean; data: unknown }> {
    return client.get('/users/me/onboarding')
  },

  getSampleResult: () => withLoading(data.sampleResult),

  buildTest(examId: string, name: string, kind: Test['kind'], topicId?: string, count = 5): Promise<Test> {
    const bank = topicId ? data.questions.filter((q) => q.topicId === topicId) : data.questions
    const pool = bank.length ? bank : data.questions
    return withLoading(
      {
        id: `test_${Math.random().toString(36).slice(2, 8)}`,
        examId,
        name,
        kind,
        topicId,
        questionIds: pool.slice(0, count).map((q) => q.id),
        durationMinutes: count * 1.2,
        startedAt: new Date().toISOString(),
      },
      260,
    )
  },
}
