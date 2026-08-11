import { motion } from 'framer-motion'
import { RefreshCw, Clock, Target, SlidersHorizontal } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { isFeatureLocked } from '@/lib/client'
import { Card, Progress, Skeleton, Signal, Metric, Button, Badge, UpgradeNotice } from '@/components/ui'

const week = [
  { day: 'Day 1', focus: 'Math + English', detail: 'Profit/Loss, Grammar' },
  { day: 'Day 2', focus: 'Bangladesh Affairs + Revision', detail: 'Constitution, 1h review' },
  { day: 'Day 3', focus: 'International Affairs + Mini Mock', detail: 'UN System, 10q mock' },
  { day: 'Day 4', focus: 'Mathematics Deep Work', detail: 'Algebra, Geometry' },
  { day: 'Day 5', focus: 'English + Memory Reviews', detail: 'Synonyms, overdue items' },
  { day: 'Day 6', focus: 'Full Mock Simulation', detail: '50q timed' },
  { day: 'Day 7', focus: 'Rest + Light Review', detail: 'Consolidate, plan next week' },
]

export default function Strategy() {
  const roadmap = useAsync(() => api.getRoadmap())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Your AI Strategy</h1>
        <p className="mt-2 text-sm text-muted">A living plan, generated backward from exam day and recalculated as you improve.</p>
      </div>

      {roadmap.loading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : isFeatureLocked(roadmap.errorObject) ? (
        <UpgradeNotice feature="AI Strategy" />
      ) : (
        roadmap.data && (
          <>
            <Card className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Exam" value={roadmap.data.examName} tone="accent" sub={roadmap.data.examDate.slice(0, 10)} />
                <Metric label="Days remaining" value={roadmap.data.daysRemaining} tone="cyan" sub="to exam day" />
                <Metric label="Current mastery" value={`${roadmap.data.currentMastery}%`} tone="violet" sub={`target ${roadmap.data.targetMastery}%`} />
                <Metric label="Daily effort" value={`${Math.floor(roadmap.data.dailyEffortMinutes / 60)}h ${roadmap.data.dailyEffortMinutes % 60}m`} tone="success" sub="required to stay on track" />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-faint">
                  <span>Mastery trajectory</span>
                  <span className="font-mono">{roadmap.data.currentMastery}% → {roadmap.data.targetMastery}%</span>
                </div>
                <Progress value={(roadmap.data.currentMastery / roadmap.data.targetMastery) * 100} className="mt-2" />
              </div>
            </Card>

            {/* roadmap phases */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-faint">Roadmap phases</h2>
              <div className="space-y-2">
                {roadmap.data.phases.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="flex items-center gap-4 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/[0.06] font-mono text-xs text-accent-hi">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-ink">{p.title}</span>
                          <span className="font-mono text-[11px] text-faint">Weeks {p.week}–{p.week + p.weeks - 1}</span>
                        </div>
                        <p className="text-xs text-muted">{p.focus}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )
      )}

      {/* 7-day plan */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">7-Day Strategy</h2>
          <Badge tone="accent">This week</Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {week.map((d, i) => (
            <motion.div key={d.day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="flex h-full flex-col p-4">
                <span className="font-mono text-[11px] uppercase tracking-widest text-faint">{d.day}</span>
                <span className="mt-2 text-sm font-semibold leading-tight text-ink">{d.focus}</span>
                <span className="mt-1 text-[11px] text-muted">{d.detail}</span>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* actions */}
      <Card className="flex flex-wrap items-center gap-3 p-5">
        <Signal tone="accent">Plan controls</Signal>
        <Button variant="outline" size="sm" icon={<RefreshCw size={14} />}>Regenerate plan</Button>
        <Button variant="outline" size="sm" icon={<Clock size={14} />}>Change study time</Button>
        <Button variant="outline" size="sm" icon={<Target size={14} />}>Change target</Button>
        <Button variant="outline" size="sm" icon={<SlidersHorizontal size={14} />}>Adjust intensity</Button>
      </Card>
    </div>
  )
}
