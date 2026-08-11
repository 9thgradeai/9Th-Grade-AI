import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { useOnline } from '@/lib/useOnline'
import { api } from '@/lib/api'
import { isFeatureLocked } from '@/lib/client'
import { Card, Signal } from '@/components/ui'
import { AsyncGate } from '@/components/ui/AsyncGate'
import { AIBriefingCard } from '@/components/dashboard'
import {
  ExamContextHeader,
  CoreSummary,
  MissionCard,
  SubjectPerformanceList,
  buildMission,
} from '@/components/dashboard/commandCenter'
import { BCS_PRELIMINARY, TOTAL_MARKS } from '@/lib/syllabus'

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

  const examName = roadmap.data?.examName ?? BCS_PRELIMINARY.name
  const memoryDue = revision.data?.filter((i) => i.overdue).length ?? 0

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

      {/* Exam context */}
      <AsyncGate loading={roadmap.loading} error={roadmap.error} data={roadmap.data} onRetry={roadmap.reload} offline={!online}>
        {(rd) => <ExamContextHeader examName={rd.examName} daysRemaining={rd.daysRemaining} readiness={perf.data?.examReadiness} />}
      </AsyncGate>

      {/* Core performance summary */}
      <AsyncGate loading={perf.loading} error={perf.error} data={perf.data} onRetry={perf.reload} offline={!online}>
        {(p) => <CoreSummary perf={p} />}
      </AsyncGate>

      {/* Mission + AI briefing */}
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
            {(tasksData) => <MissionCard items={buildMission(tasksData, subjects.data ?? [])} memoryDue={memoryDue} />}
          </AsyncGate>
        </div>

        {/* AI briefing / strategy */}
        <div className="space-y-4">
          {isFeatureLocked(briefing.errorObject) ? (
            <Card className="p-5">
              <Signal tone="accent">AI Briefing</Signal>
              <p className="mt-3 text-sm text-muted">Upgrade to unlock your daily AI briefing.</p>
            </Card>
          ) : (
            <AsyncGate loading={briefing.loading} error={briefing.error} data={briefing.data} onRetry={briefing.reload} offline={!online}>
              {(b) => <AIBriefingCard briefing={b} />}
            </AsyncGate>
          )}
        </div>
      </div>

      {/* Subjects + recommendations */}
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

        {/* AI recommendations */}
        <div className="space-y-3">
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
