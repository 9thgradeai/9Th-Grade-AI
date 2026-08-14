import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { useOnline } from '@/lib/useOnline'
import { api } from '@/lib/api'
import { Card, Signal } from '@/components/ui'
import { AsyncGate } from '@/components/ui/AsyncGate'
import { AIBriefingCard } from '@/components/dashboard'
import {
  SubjectPerformanceList,
} from '@/components/dashboard/commandCenter'
import {
  AspirantCommandCenter,
  ReadinessIntelligence,
  TodaysMission,
  ActiveLearningPath,
  MemoryLedger,
  CompetencyMatrix,
  ExamIntelligence,
  RecentActivity,
  CareerOS,
  CadreCoach,
  NextBestAction,
  SubjectWeaknessMap,
  ConfidenceGap,
  TelemetryStrip,
} from '@/features/dashboard/components'
import { BCS_PRELIMINARY, TOTAL_MARKS } from '@/lib/syllabus'
import { getDashboardIntelligence } from '@/lib/dashboardIntelligence'
import type { ReadinessSnapshot, ExamSchedule } from '@/lib/types'

function hourGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const user = useAsync(() => api.getUser())
  const perf = useAsync(() => api.getPerformance())
  const roadmap = useAsync(() => api.getRoadmap())
  const briefing = useAsync(() => api.getAIBriefing())
  const tasks = useAsync(() => api.getDailyTasks())
  const subjects = useAsync(() => api.listSubjects())
  const revision = useAsync(() => api.getRevisionItems())
  const recommendations = useAsync(() => api.getAIRecommendations())
  const online = useOnline()

  const intelligence = useMemo(() => getDashboardIntelligence(), [])

  const examName = roadmap.data?.examName ?? BCS_PRELIMINARY.name
  const memoryDue = revision.data?.filter((i) => i.overdue).length ?? 0

  const schedule: ExamSchedule | undefined = roadmap.data
    ? {
        id: 'sched_current',
        examId: roadmap.data.examId,
        name: roadmap.data.examName,
        organization: 'Bangladesh Public Service Commission',
        examType: 'preliminary',
        examDate: '', // populated from intelligence if available
        status: 'upcoming',
      }
    : undefined

  const readiness: ReadinessSnapshot | undefined = perf.data
    ? {
        projectedRank: null,
        totalAspirants: 450000,
        nationalPercentile: perf.data.percentile,
        percentileStatus: 'estimated',
        cutoffProbability: Math.min(95, perf.data.examReadiness + 5),
        projectionStatus: 'estimated',
        potentialScore: perf.data.potentialScore,
        examReadiness: perf.data.examReadiness,
        mastery: perf.data.mastery,
        accuracy: perf.data.accuracy,
        speed: perf.data.speed,
        retention: perf.data.retention,
        consistency: perf.data.consistency,
        syllabusCoverage: perf.data.syllabusCoverage,
        streakDays: perf.data.streakDays,
        totalXP: 12840,
        totalMCQs: 8421,
        studyHours: 126,
      }
    : undefined

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {hourGreeting()}, <span className="text-gradient font-display">{user.data?.firstName ?? 'Rafi'}.</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Here's your command center for {examName}.</p>
        </div>
        <Signal tone="success">System online</Signal>
      </div>

      {/* Aspirant Command Center */}
      <AsyncGate loading={roadmap.loading} error={roadmap.error} data={roadmap.data} onRetry={roadmap.reload} offline={!online}>
        {(rd) => (
          <AspirantCommandCenter
            schedule={{
              id: schedule!.id,
              examId: schedule!.examId,
              name: schedule!.name,
              organization: schedule!.organization,
              examType: schedule!.examType,
              examDate: rd.examDate,
              status: schedule!.status,
            }}
            projectionLabel="estimated"
          />
        )}
      </AsyncGate>

      {/* Telemetry Strip */}
      <AsyncGate loading={perf.loading} error={perf.error} data={perf.data} onRetry={perf.reload} offline={!online}>
        {(p) => <TelemetryStrip telemetry={{ streakDays: p.streakDays, totalXP: 12840, totalMCQs: 8421, studyHours: 126, accuracy: p.accuracy, avgResponseTime: 42, currentMastery: p.mastery, revisionRetention: p.retention }} />}
      </AsyncGate>

      {/* Readiness Intelligence + Next Best Action */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AsyncGate loading={perf.loading} error={perf.error} data={perf.data} onRetry={perf.reload} offline={!online}>
            {(p) => (
              <ReadinessIntelligence
                readiness={{
                  ...readiness!,
                  examReadiness: p.examReadiness,
                  mastery: p.mastery,
                  accuracy: p.accuracy,
                  speed: p.speed,
                  retention: p.retention,
                  consistency: p.consistency,
                  syllabusCoverage: p.syllabusCoverage,
                  streakDays: p.streakDays,
                  potentialScore: p.potentialScore,
                  nationalPercentile: p.percentile,
                }}
                projectionLabel="estimated"
              />
            )}
          </AsyncGate>
        </div>
        <div>
          <NextBestAction action={intelligence.nextBestAction} />
        </div>
      </div>

      {/* Today's Mission + AI Coach */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AsyncGate
            loading={tasks.loading}
            error={tasks.error}
            data={tasks.data}
            onRetry={tasks.reload}
            offline={!online}
            isEmpty={!tasks.data?.length}
            emptyTitle="No tasks yet"
            emptyBody="Your daily plan will appear here once you set your exam date and study time."
          >
            {() => <TodaysMission mission={intelligence.mission} memoryDue={memoryDue} />}
          </AsyncGate>
        </div>
        <div>
          <CadreCoach context={intelligence.coach.context} messages={intelligence.coach.messages} />
        </div>
      </div>

      {/* Active Learning Path + Subject Competency */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActiveLearningPath competencies={intelligence.competencies} />
        </div>
        <div>
          <CompetencyMatrix competencies={intelligence.competencies} />
        </div>
      </div>

      {/* Subject Weakness Map + Exam Intelligence */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SubjectWeaknessMap weakestTopics={intelligence.weakestTopics} />
        </div>
        <div>
          <ExamIntelligence notices={intelligence.notices} schedule={schedule} />
        </div>
      </div>

      {/* Memory Ledger + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MemoryLedger memory={intelligence.memory} />
        </div>
        <div>
          <RecentActivity activities={intelligence.activities} />
        </div>
      </div>

      {/* Career OS + Confidence Gap */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CareerOS milestones={intelligence.milestones} />
        </div>
        <div>
          <ConfidenceGap diagnostic={intelligence.confidence} />
        </div>
      </div>

      {/* Existing sections preserved for backward compatibility */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AsyncGate
            loading={subjects.loading}
            error={subjects.error}
            data={subjects.data}
            onRetry={subjects.reload}
            offline={!online}
            isEmpty={!subjects.data?.length}
            emptyTitle="No subjects yet"
            emptyBody="Subject performance will appear once you've practiced."
          >
            {(subs) => <SubjectPerformanceList subjects={subs} totalMarks={TOTAL_MARKS} />}
          </AsyncGate>
        </div>
        <div className="space-y-3">
          <AsyncGate loading={briefing.loading} error={briefing.error} data={briefing.data} onRetry={briefing.reload} offline={!online}>
            {(b) => <AIBriefingCard briefing={b} />}
          </AsyncGate>
          <AsyncGate
            loading={recommendations.loading}
            error={recommendations.error}
            data={recommendations.data}
            onRetry={recommendations.reload}
            offline={!online}
            isEmpty={!recommendations.data?.length}
            emptyTitle="No recommendations yet"
            emptyBody="AI recommendations will appear once you have some practice data."
          >
            {(recs) => (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-faint">Recommended next</h2>
                {recs.slice(0, 3).map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <Card className="flex flex-col gap-2 p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              r.severity === 'high' ? 'bg-danger' : r.severity === 'medium' ? 'bg-warning' : 'bg-success'
                            }`}
                          />
                          {r.title}
                        </span>
                      </div>
                      <p className="text-sm leading-snug text-muted">{r.body}</p>
                      {r.actionRoute && (
                        <Link to={r.actionRoute} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-hi hover:text-ink">
                          {r.actionLabel ?? 'Open'} <ArrowRight size={14} />
                        </Link>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </>
            )}
          </AsyncGate>
        </div>
      </div>
    </div>
  )
}
