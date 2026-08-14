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
  ProjectionStatus,
} from '@/lib/types'
import {
  getReadinessSnapshot,
  getSubjectCompetencies,
  getTopicCompetencies,
  getWeakestTopics,
  getTodayMission,
  getActivityLedger,
  getOfficialNotices,
  getExamSchedule,
  getCareerMilestones,
  getConfidenceDiagnostic,
  getAspirantTelemetry,
  getCoachContext,
  getCadreCoachMessages,
  getMemoryLedger,
} from '@/lib/repositories/dashboard'

/* ============================================================
   Dashboard Intelligence Service
   Pure, deterministic, memoizable. No random values.
   All recommendations have a clear source.
   ============================================================ */

export interface DashboardIntelligence {
  readiness: ReadinessSnapshot
  telemetry: AspirantTelemetry
  competencies: SubjectCompetency[]
  topicCompetencies: TopicCompetency[]
  weakestTopics: TopicCompetency[]
  mission: DashboardMission[]
  activities: ActivityEvent[]
  notices: OfficialNotice[]
  schedule: ExamSchedule | undefined
  milestones: CareerMilestone[]
  confidence: ConfidenceDiagnostic
  coach: {
    context: CoachContext
    messages: CadreCoachMessage[]
  }
  memory: {
    today: ReturnType<typeof getMemoryLedger>['today']
    tomorrow: ReturnType<typeof getMemoryLedger>['tomorrow']
    upcoming: ReturnType<typeof getMemoryLedger>['upcoming']
  }
  nextBestAction: {
    title: string
    description: string
    route: string
    impact: 'high' | 'medium' | 'low'
  }
  projectionLabel: ProjectionStatus
}

export function getDashboardIntelligence(): DashboardIntelligence {
  const readiness = getReadinessSnapshot()
  const telemetry = getAspirantTelemetry()
  const competencies = getSubjectCompetencies()
  const topicCompetencies = getTopicCompetencies()
  const weakestTopics = getWeakestTopics()
  const mission = getTodayMission()
  const activities = getActivityLedger()
  const notices = getOfficialNotices()
  const schedule = getExamSchedule()
  const milestones = getCareerMilestones()
  const confidence = getConfidenceDiagnostic()
  const coach = { context: getCoachContext(), messages: getCadreCoachMessages() }
  const memory = getMemoryLedger()

  const criticalTopics = weakestTopics.filter((t) => t.priority === 'critical')
  const focusTopics = weakestTopics.filter((t) => t.priority === 'focus')

  const nextBestAction = (() => {
    if (memory.today.length > 0) {
      const first = memory.today[0]
      return {
        title: `Review ${first.topic}`,
        description: `Memory strength is at ${first.memoryStrength}%. Review before forgetting.`,
        route: '/memory',
        impact: 'high' as const,
      }
    }
    if (criticalTopics.length > 0) {
      const t = criticalTopics[0]
      return {
        title: `Practice ${t.name}`,
        description: `Mastery is at ${t.mastery}%. This is your highest-impact repair.`,
        route: `/practice?topic=${t.id}`,
        impact: 'high' as const,
      }
    }
    if (focusTopics.length > 0) {
      const t = focusTopics[0]
      return {
        title: `Strengthen ${t.name}`,
        description: `Accuracy is ${t.accuracy}%. A focused drill will move the needle.`,
        route: `/practice?topic=${t.id}`,
        impact: 'medium' as const,
      }
    }
    return {
      title: 'Continue active learning path',
      description: 'You are on track. Maintain momentum with your scheduled practice.',
      route: '/practice',
      impact: 'medium' as const,
    }
  })()

  const projectionLabel: ProjectionStatus = 'estimated'

  return {
    readiness,
    telemetry,
    competencies,
    topicCompetencies,
    weakestTopics,
    mission,
    activities,
    notices,
    schedule,
    milestones,
    confidence,
    coach,
    memory,
    nextBestAction,
    projectionLabel,
  }
}

export function formatCountdown(examDate?: string): { days: number; hours: number; minutes: number } | null {
  if (!examDate) return null
  const target = new Date(examDate).getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  return { days, hours, minutes }
}
