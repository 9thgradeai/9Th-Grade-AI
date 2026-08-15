import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { useOnline } from '@/lib/useOnline'
import { api } from '@/lib/api'
import { Card, Signal, Button } from '@/components/ui'
import { AsyncGate } from '@/components/ui/AsyncGate'
import {
  TodaysMission,
  ReadinessIntelligence,
  NextBestAction,
  RecentActivity,
  MemoryLedger,
} from '@/features/dashboard/components'
import { BCS_PRELIMINARY, TOTAL_MARKS } from '@/lib/syllabus'
import { getDashboardIntelligence } from '@/lib/dashboardIntelligence'
import type { ReadinessSnapshot } from '@/lib/types'

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
  const tasks = useAsync(() => api.getDailyTasks())
  const revision = useAsync(() => api.getRevisionItems())
  const online = useOnline()

  const intelligence = useMemo(() => getDashboardIntelligence(), [])
  const examName = roadmap.data?.examName ?? BCS_PRELIMINARY.name
  const memoryDue = revision.data?.filter((i) => i.overdue).length ?? 0

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

      {/* Exam context + Syllabus link */}
      <Card className="border-accent/15 bg-accent/[0.03] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">আপনার BCS প্রস্তুতি</h2>
            <p className="mt-1 text-sm text-muted">
              {TOTAL_MARKS} নম্বর · ১০টি বিষয়
            </p>
          </div>
          <Link to="/exams/bcs">
            <Button variant="outline" iconRight={<ArrowRight size={16} />}>BCS সিলেবাস দেখুন →</Button>
          </Link>
        </div>
      </Card>

      {/* Readiness Intelligence */}
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

      {/* Today's Mission + Next Best Action */}
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
          <NextBestAction action={intelligence.nextBestAction} />
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
    </div>
  )
}
