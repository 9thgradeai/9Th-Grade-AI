import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { isFeatureLocked } from '@/lib/client'
import { Card, Skeleton, Signal } from '@/components/ui'
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

  const examName = roadmap.data?.examName ?? BCS_PRELIMINARY.name
  const daysRemaining = roadmap.data?.daysRemaining
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
      {roadmap.loading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : (
        <ExamContextHeader examName={examName} daysRemaining={daysRemaining} readiness={perf.data?.examReadiness} />
      )}

      {/* Core performance summary */}
      {perf.data ? <CoreSummary perf={perf.data} /> : <Skeleton className="h-32 rounded-2xl" />}

      {/* Mission + AI briefing */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tasks.loading ? (
            <Skeleton className="h-80 rounded-2xl" />
          ) : tasks.data ? (
            <MissionCard items={buildMission(tasks.data, subjects.data ?? [])} memoryDue={memoryDue} />
          ) : null}
        </div>

        {/* AI briefing / strategy */}
        <div className="space-y-4">
          {briefing.loading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : isFeatureLocked(briefing.errorObject) ? (
            <Card className="p-5">
              <Signal tone="accent">AI Briefing</Signal>
              <p className="mt-3 text-sm text-muted">Upgrade to unlock your daily AI briefing.</p>
            </Card>
          ) : briefing.data ? (
            <AIBriefingCard briefing={briefing.data} />
          ) : null}
        </div>
      </div>

      {/* Subjects + recommendations */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {subjects.loading ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : subjects.data ? (
            <SubjectPerformanceList subjects={subjects.data} totalMarks={TOTAL_MARKS} />
          ) : null}
        </div>

        {/* AI recommendations */}
        <div className="space-y-3">
          {recommendations.data ? (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-faint">Recommended next</h2>
              {recommendations.data.slice(0, 3).map((r, i) => (
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
          ) : null}
        </div>
      </div>
    </div>
  )
}
