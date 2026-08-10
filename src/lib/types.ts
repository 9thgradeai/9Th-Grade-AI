/* ============================================================
   9Th-Grade AI — Domain types
   Structured for future backend integration. UI never imports
   mock data directly — it goes through services/api.ts.
   ============================================================ */

export interface User {
  id: string
  name: string
  email: string
  firstName: string
  timezone: string
  createdAt: string
}

export interface Exam {
  id: string
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  color: string
  icon: string
  // Official syllabus is intentionally configurable — never hardcoded truth.
  configurableSyllabus: boolean
}

export interface Subject {
  id: string
  examId: string
  name: string
  nameBn?: string
  weight: number
  mastery: number
  accuracy: number
  speed: number
  retention: number
}

export interface Topic {
  id: string
  subjectId: string
  name: string
  mastery: number
  accuracy: number
  speed: number
  retention: number
  status: 'locked' | 'learning' | 'practicing' | 'mastered'
  reviewDue?: number
}

export interface Question {
  id: string
  topicId: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 1 | 2 | 3 | 4 | 5
  /** seconds a strong candidate should need */
  targetSeconds: number
}

export interface QuestionAttempt {
  id: string
  questionId: string
  selectedIndex: number | null
  correct: boolean
  timeSpentSeconds: number
  confidence: 1 | 2 | 3 | 4 | 5
  answeredAt: string
}

export interface Test {
  id: string
  examId: string
  name: string
  kind: 'adaptive' | 'mock' | 'diagnostic' | 'topic'
  subjectId?: string
  topicId?: string
  questionIds: string[]
  durationMinutes: number
  startedAt: string
  completedAt?: string
}

export interface TestResult {
  id: string
  testId: string
  score: number
  accuracy: number
  speed: number
  retention: number
  percentile: number
  correct: number
  total: number
  timeSpentMinutes: number
  attempts: QuestionAttempt[]
  /* Per-subject mark losses: subjectId -> marks lost */
  losses: Record<string, number>
  diagnosis: string
  nextBestAction: string
  targetTopicId?: string
  completedAt: string
}

export interface Performance {
  mastery: number
  syllabusCoverage: number
  consistency: number
  accuracy: number
  speed: number
  retention: number
  examReadiness: number
  potentialScore: number
  percentile: number
  targetPercentile: number
  projectedPercentile: number
  trajectory: number[] // points over time
  studyHistory: { day: string; minutes: number }[]
  streakDays: number
}

export interface Roadmap {
  examId: string
  examName: string
  examDate: string
  daysRemaining: number
  currentMastery: number
  targetMastery: number
  dailyEffortMinutes: number
  phases: RoadmapPhase[]
  priorities: string[]
}

export interface RoadmapPhase {
  id: string
  title: string
  week: number
  weeks: number
  focus: string
}

export interface AIRecommendation {
  id: string
  kind: 'diagnosis' | 'action' | 'strategy' | 'memory' | 'alert'
  severity: 'low' | 'medium' | 'high'
  title: string
  body: string
  actionLabel?: string
  actionRoute?: string
}

export interface DailyTask {
  id: string
  subject: string
  topic: string
  kind: 'practice' | 'revision' | 'test' | 'review'
  durationMinutes: number
  priority: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  expectedQuestions?: number
  status: 'pending' | 'done'
}

export interface RevisionItem {
  id: string
  topic: string
  subject: string
  memoryStrength: number
  lastReviewed: string
  nextReview: string
  overdue: boolean
}

export interface StudySession {
  id: string
  date: string
  minutes: number
  tasks: string[]
}

export interface AIBriefing {
  id: string
  title: string
  items: string[]
}
