import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { LivingUniverse } from '@/components/universe/LivingUniverse'
import { subjectsToData } from '@/components/universe/universeData'
import { Card, Skeleton, Progress, Signal, Metric } from '@/components/ui'
import { AIBriefingCard, DailyMissionCard, NextBestAction, MetricTile } from '@/components/dashboard'
import { cn } from '@/lib/cn'

function hourGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const user = useAsync(() => api.getUser())
  const perf = useAsync(() => api.getPerformance())
  const briefing = useAsync(() => api.getAIBriefing())
  const tasks = useAsync(() => api.getDailyTasks())
  const subjects = useAsync(() => api.listSubjects())
  const recommendations = useAsync(() => api.getAIRecommendations())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {hourGreeting()}, <span className="text-gradient font-display">{user.data?.firstName ?? 'Rafi'}.</span>
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted">Your preparation system is active.</p>
        </div>
        <div className="flex items-center gap-3">
          <Signal tone="success">System online</Signal>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-ink-soft">
            {perf.data?.streakDays ?? 0}-day streak
          </span>
        </div>
      </div>

      {/* Universe overview */}
      <Card className="relative h-64 overflow-hidden">
        <LivingUniverse
          mode="dashboard"
          variant="absolute"
          interactive
          data={subjectsToData(subjects.data ?? [])}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-hi">Your Preparation Universe</p>
            <p className="mt-2 text-2xl font-semibold text-ink">Mastery</p>
            <p className="font-mono text-5xl font-bold text-gradient">{perf.data?.mastery ?? 67}%</p>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 hidden grid-cols-4 gap-3 sm:grid">
          {[
            ['Mastery', perf.data?.mastery, 'accent'],
            ['Syllabus', perf.data?.syllabusCoverage, 'cyan'],
            ['Consistency', perf.data?.consistency, 'success'],
            ['Exam Readiness', perf.data?.examReadiness, 'violet'],
          ].map(([label, value, tone]) => (
            <div key={label as string} className="flex items-center justify-between rounded-xl border border-white/8 bg-space-950/60 px-3 py-2 backdrop-blur">
              <span className="text-[11px] text-muted">{label as string}</span>
              <span className={cn('font-mono text-sm font-semibold', tone === 'cyan' ? 'text-cyan' : tone === 'success' ? 'text-success' : tone === 'violet' ? 'text-violet' : 'text-accent-hi')}>
                {value}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Next best action + AI briefing */}
      <div className="grid gap-4 lg:grid-cols-2">
        {recommendations.loading ? <Skeleton className="h-44 rounded-2xl" /> : <NextBestAction />}
        {briefing.loading ? <Skeleton className="h-44 rounded-2xl" /> : briefing.data ? <AIBriefingCard briefing={briefing.data} /> : null}
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="Accuracy" value={perf.data?.accuracy ?? 71} tone="accent" sub="+8% this week" />
        <MetricTile label="Speed" value={perf.data?.speed ?? 76} tone="cyan" sub="vs 74 target" />
        <MetricTile label="Retention" value={perf.data?.retention ?? 64} tone="violet" sub="17 reviews due" />
        <MetricTile label="Potential Score" value={perf.data?.potentialScore ?? 86} tone="success" sub="at current trajectory" />
      </div>

      {/* Daily mission + subjects */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tasks.loading ? <Skeleton className="h-72 rounded-2xl" /> : tasks.data ? <DailyMissionCard tasks={tasks.data} /> : null}
        </div>

        {/* Subject progress */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Subject pulse</h3>
            <Link to="/progress" className="text-xs text-accent-hi hover:text-ink">View all</Link>
          </div>
          <div className="mt-4 space-y-3.5">
            {(subjects.data ?? []).slice(0, 6).map((s) => (
              <Link to={`/subjects/${s.id}`} key={s.id} className="group block">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft group-hover:text-ink">
                    {s.name}
                    {s.nameBn && <span className="ml-1.5 lang-bn text-xs text-faint">{s.nameBn}</span>}
                  </span>
                  <span className="font-mono text-xs text-muted">{s.mastery}%</span>
                </div>
                <Progress value={s.mastery} className="mt-1.5" barClassName={s.mastery < 55 ? 'from-danger to-warning' : undefined} />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* AI recommendations list */}
      {recommendations.data && (
        <div className="space-y-3">
          {recommendations.data.slice(1).map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('h-1.5 w-1.5 rounded-full', r.severity === 'high' ? 'bg-danger' : r.severity === 'medium' ? 'bg-warning' : 'bg-success')} />
                  <span className="text-sm font-medium text-ink">{r.title}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{r.body}</p>
              </div>
              {r.actionRoute && (
                <Link to={r.actionRoute} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent-hi hover:text-ink">
                  {r.actionLabel} <ArrowRight size={14} />
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Quick metrics */}
      {perf.data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Percentile" value={`${perf.data.percentile}%`} tone="accent" />
          <Metric label="Accuracy" value={`${perf.data.accuracy}%`} tone="cyan" />
          <Metric label="Consistency" value={`${perf.data.consistency}%`} tone="success" />
          <Metric label="Readiness" value={`${perf.data.examReadiness}%`} tone="violet" />
        </div>
      )}
    </div>
  )
}
