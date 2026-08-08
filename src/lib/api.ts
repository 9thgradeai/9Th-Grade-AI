import type {
  User,
  Exam,
  Subject,
  Topic,
  Question,
  Performance,
  Roadmap,
  DailyTask,
  RevisionItem,
  AIBriefing,
  AIRecommendation,
  TestResult,
  Test,
} from '@/lib/types'
import * as data from '@/lib/data'

/* ============================================================
   Service layer. UI components depend on these async functions
   only. Swap the bodies for fetch() calls to a backend without
   touching any component.
   ============================================================ */

const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))

async function withLoading<T>(value: T, ms?: number): Promise<T> {
  await delay(ms)
  return value
}

export const api = {
  getUser(): Promise<User> {
    return withLoading(data.user)
  },

  listExams(): Promise<Exam[]> {
    return withLoading(data.exams)
  },

  getExam(slug: string): Promise<Exam | undefined> {
    return withLoading(data.exams.find((e) => e.slug === slug))
  },

  listSubjects(examId?: string): Promise<Subject[]> {
    const list = examId ? data.subjects.filter((s) => s.examId === examId) : data.subjects
    return withLoading(list)
  },

  getSubject(id: string): Promise<Subject | undefined> {
    return withLoading(data.subjects.find((s) => s.id === id))
  },

  listTopics(subjectId: string): Promise<Topic[]> {
    return withLoading(data.topics.filter((t) => t.subjectId === subjectId))
  },

  getTopic(id: string): Promise<Topic | undefined> {
    return withLoading(data.topics.find((t) => t.id === id))
  },

  listQuestions(topicId: string, count = 10): Promise<Question[]> {
    const bank = data.questions.filter((q) => q.topicId === topicId)
    const pool = bank.length ? bank : data.questions
    return withLoading(pool.slice(0, count), 320)
  },

  getPerformance(): Promise<Performance> {
    return withLoading(data.performance)
  },

  getRoadmap(): Promise<Roadmap> {
    return withLoading(data.roadmap)
  },

  getDailyTasks(): Promise<DailyTask[]> {
    return withLoading(data.dailyTasks)
  },

  getRevisionItems(): Promise<RevisionItem[]> {
    return withLoading(data.revisionItems)
  },

  getAIBriefing(): Promise<AIBriefing> {
    return withLoading(data.aiBriefing)
  },

  getSampleResult(): Promise<TestResult> {
    return withLoading(data.sampleResult)
  },

  /** Generate a live AI-style recommendation from current data. */
  getAIRecommendations(): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [
      {
        id: 'ai_1',
        kind: 'action',
        severity: 'high',
        title: 'Your next best action',
        body: 'Complete 20 Percentage & Profit/Loss questions. Your accuracy there (51%) is holding back Mathematics.',
        actionLabel: 'Start now',
        actionRoute: '/practice?topic=t_profit',
      },
      {
        id: 'ai_2',
        kind: 'diagnosis',
        severity: 'medium',
        title: 'Weakness detected',
        body: 'International Affairs shows a 14-point retention gap. The UN System topic is due for review today.',
        actionLabel: 'Open topic',
        actionRoute: '/topics/t_un',
      },
      {
        id: 'ai_3',
        kind: 'strategy',
        severity: 'low',
        title: 'Plan adjusted',
        body: 'Your daily plan now allocates an extra 20 minutes to Mathematics to stay on trajectory.',
      },
    ]
    return withLoading(recommendations)
  },

  /** Build a fresh mock Test to run in the practice/mock engine. */
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
