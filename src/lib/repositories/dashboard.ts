import type {
  ReadinessSnapshot,
  SubjectCompetency,
  TopicCompetency,
  DashboardMission,
  ActivityEvent,
  OfficialNotice,
  CareerMilestone,
  ConfidenceDiagnostic,
  AspirantTelemetry,
  CoachContext,
  CadreCoachMessage,
  ExamSchedule,
  Subject,
  Topic,
} from '@/lib/types'
import { subjects as mockSubjects, topics as mockTopics, performance, revisionItems, dailyTasks, roadmap } from '@/lib/data'

/* ============================================================
   Mock dashboard repositories.
   Each returns deterministic data shaped for the UI.
   In production, replace with real API calls.
   ============================================================ */

const EXAM_SCHEDULES: ExamSchedule[] = [
  {
    id: 'sched_51bcs',
    examId: 'exam_bcs',
    name: '51st BCS Preliminary',
    organization: 'Bangladesh Public Service Commission',
    examType: 'preliminary',
    examDate: '2026-12-28T00:00:00.000Z',
    applicationDeadline: '2026-10-15T00:00:00.000Z',
    admitCardWindow: { from: '2026-12-10T00:00:00.000Z', to: '2026-12-20T00:00:00.000Z' },
    status: 'upcoming',
    officialUrl: 'https://bpsc.gov.bd',
  },
  {
    id: 'sched_bank_ad',
    examId: 'exam_bank',
    name: 'Bangladesh Bank AD',
    organization: 'Bangladesh Bank',
    examType: 'preliminary',
    status: 'upcoming',
  },
]

const OFFICIAL_NOTICES: OfficialNotice[] = [
  {
    id: 'n_1',
    examId: 'exam_bcs',
    title: '51st BCS Preliminary — Notification Published',
    status: 'open',
    publishedAt: '2026-08-01T00:00:00.000Z',
    deadline: '2026-10-15T00:00:00.000Z',
    sourceName: 'Bangladesh Public Service Commission',
    sourceUrl: 'https://bpsc.gov.bd',
    verifiedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'n_2',
    examId: 'exam_bcs',
    title: 'Application Deadline Approaching',
    status: 'deadline-soon',
    publishedAt: '2026-08-10T00:00:00.000Z',
    deadline: '2026-10-15T00:00:00.000Z',
    sourceName: 'Bangladesh Public Service Commission',
    sourceUrl: 'https://bpsc.gov.bd',
    verifiedAt: '2026-08-10T00:00:00.000Z',
  },
]

const ACTIVITIES: ActivityEvent[] = [
  { id: 'a_1', type: 'exam', title: 'Completed Mathematics Drill', description: '20 questions · 78% accuracy', xp: 180, occurredAt: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { id: 'a_2', type: 'mastered', title: 'Mastered 18 Constitution flashcards', description: 'Bangladesh Affairs · Constitutional Articles', xp: 120, occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: 'a_3', type: 'exam', title: 'Completed English Mock', description: '50 questions · 78% accuracy', xp: 250, occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a_4', type: 'revised', title: 'Revised UN System', description: 'International Affairs · 12 cards', xp: 60, occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'a_5', type: 'streak', title: '17-day streak achieved', description: 'Consistent daily practice', xp: 500, occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
]

const CAREER_MILESTONES: CareerMilestone[] = [
  { id: 'cm_1', stage: 'preliminary', label: 'Preliminary', labelBn: 'প্রারম্ভিক', description: 'Multiple-choice screening exam', completed: false, current: true },
  { id: 'cm_2', stage: 'written', label: 'Written', labelBn: 'লিখিত', description: 'Descriptive written examination', completed: false, current: false },
  { id: 'cm_3', stage: 'viva', label: 'Viva', labelBn: 'বাইবাক', description: 'Oral examination and interview', completed: false, current: false },
  { id: 'cm_4', stage: 'medical', label: 'Medical', labelBn: 'চিকিৎসা', description: 'Medical fitness test', completed: false, current: false },
  { id: 'cm_5', stage: 'verification', label: 'Verification', labelBn: 'যাচাই', description: 'Document and background verification', completed: false, current: false },
  { id: 'cm_6', stage: 'gazetted', label: 'Gazetted Appointment', labelBn: 'গেজেটেড নিয়োগ', description: 'Official appointment notification', completed: false, current: false },
]

const COACH_MESSAGES: CadreCoachMessage[] = [
  { role: 'user', content: 'What should I focus on today?' },
  { role: 'assistant', content: 'Your highest-impact repair is Algebraic Equations. Your accuracy there is 42%, and this topic carries high exam weight. I recommend a 20-question targeted drill.', actions: [{ label: 'Start Drill', route: '/practice?topic=t_algebra&count=20' }] },
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function toSubjectCompetency(s: Subject): SubjectCompetency {
  const priority = s.mastery < 50 ? 'critical' : s.mastery < 62 ? 'focus' : s.mastery < 55 && s.weight >= 20 ? 'focus' : 'ontrack'
  const h = hashStr(s.id)
  return {
    ...s,
    weeklyTrend: ((h % 21) - 10),
    questionVolume: (h % 151) + 50,
    confidenceGap: h % 21,
    priority,
    lastPracticed: new Date(Date.now() - ((h % 7) * 24 * 60 * 60 * 1000)).toISOString(),
  }
}

function toTopicCompetency(t: Topic, subjectId: string): TopicCompetency {
  const priority = t.mastery < 50 ? 'critical' : t.mastery < 62 ? 'focus' : 'ontrack'
  const h = hashStr(t.id)
  return {
    ...t,
    subjectId,
    reviewDue: t.reviewDue ?? 0,
    estimatedMinutes: (h % 20) + 5,
    priority,
  }
}

export function getReadinessSnapshot(): ReadinessSnapshot {
  const p = performance
  return {
    projectedRank: p.percentile >= 90 ? Math.floor(450000 * (1 - p.percentile / 100)) : null,
    totalAspirants: 450000,
    nationalPercentile: p.percentile,
    percentileStatus: 'estimated',
    cutoffProbability: Math.min(95, Math.max(20, p.examReadiness + Math.floor(Math.random() * 10 - 5))),
    projectionStatus: 'estimated',
    potentialScore: p.potentialScore,
    examReadiness: p.examReadiness,
    mastery: p.mastery,
    accuracy: p.accuracy,
    speed: p.speed,
    retention: p.retention,
    consistency: p.consistency,
    syllabusCoverage: p.syllabusCoverage,
    streakDays: p.streakDays,
    totalXP: 12840,
    totalMCQs: 8421,
    studyHours: 126,
  }
}

export function getSubjectCompetencies(): SubjectCompetency[] {
  return mockSubjects.map(toSubjectCompetency)
}

export function getTopicCompetencies(subjectId?: string): TopicCompetency[] {
  const filtered = subjectId ? mockTopics.filter((t) => t.subjectId === subjectId) : mockTopics
  return filtered.map((t) => toTopicCompetency(t, t.subjectId))
}

export function getWeakestTopics(): TopicCompetency[] {
  return getTopicCompetencies()
    .filter((t) => t.mastery < 60)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 5)
}

export function getTodayMission(): DashboardMission[] {
  const result: DashboardMission[] = dailyTasks.slice(0, 4).map((t, _i) => ({
    id: t.id,
    priority: t.priority,
    title: `${t.subject} — ${t.topic}`,
    subject: t.subject,
    topic: t.topic,
    kind: t.kind,
    durationMinutes: t.durationMinutes,
    expectedQuestions: t.expectedQuestions,
    rationale: `Your accuracy in ${t.subject} is below target. This practice will improve your score in the upcoming exam.`,
    expectedImpact: t.impact,
    actionRoute: t.kind === 'practice' ? `/practice?topic=${t.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : t.kind === 'revision' ? '/memory' : '/practice',
    actionLabel: t.kind === 'practice' ? 'Start Practice' : t.kind === 'revision' ? 'Review Now' : 'Start Test',
    status: t.status,
  }))
  return result
}

export function getActivityLedger(): ActivityEvent[] {
  return ACTIVITIES
}

export function getOfficialNotices(): OfficialNotice[] {
  return OFFICIAL_NOTICES
}

export function getExamSchedule(examId?: string): ExamSchedule | undefined {
  const list = examId ? EXAM_SCHEDULES.filter((s) => s.examId === examId) : EXAM_SCHEDULES
  return list[0]
}

export function getCareerMilestones(): CareerMilestone[] {
  return CAREER_MILESTONES
}

export function getConfidenceDiagnostic(): ConfidenceDiagnostic {
  return {
    highConfidenceAccuracy: 61,
    lowConfidenceAccuracy: 78,
    highConfidenceCount: 342,
    lowConfidenceCount: 128,
    gap: 17,
  }
}

export function getAspirantTelemetry(): AspirantTelemetry {
  return {
    streakDays: performance.streakDays,
    totalXP: 12840,
    totalMCQs: 8421,
    studyHours: 126,
    accuracy: performance.accuracy,
    avgResponseTime: 42,
    currentMastery: performance.mastery,
    revisionRetention: performance.retention,
  }
}

export function getCoachContext(): CoachContext {
  const weakest = getSubjectCompetencies()
    .filter((s) => s.priority === 'critical' || s.priority === 'focus')
    .map((s) => s.name)
  const weakTopics = getWeakestTopics().map((t) => t.name)
  const dueReviews = revisionItems.filter((r) => r.overdue).length
  return {
    targetExam: roadmap.examName,
    targetTrack: 'BCS Administration',
    candidateArchetype: 'Analytical Strategist',
    preparationPhase: 'Preliminary Preparation',
    weakSubjects: weakest,
    weakTopics: weakTopics,
    dueReviews,
    recentExamPerformance: performance.accuracy,
    currentLearningPath: 'Syllabus Coverage',
    readiness: performance.examReadiness,
  }
}

export function getCadreCoachMessages(): CadreCoachMessage[] {
  return COACH_MESSAGES
}

export function getMemoryLedger() {
  const today = revisionItems.filter((r) => r.overdue)
  const tomorrow = revisionItems.filter((r) => !r.overdue && r.nextReview === 'Tomorrow')
  const upcoming = revisionItems.filter((r) => !r.overdue && r.nextReview !== 'Today' && r.nextReview !== 'Tomorrow')
  return { today, tomorrow, upcoming }
}
