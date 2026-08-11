import { motion } from 'framer-motion'
import { RefreshCw, CalendarClock } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { isFeatureLocked } from '@/lib/client'
import { Card, Progress, Skeleton, Signal, Badge, UpgradeNotice } from '@/components/ui'

export default function Memory() {
  const { data: items, loading, errorObject } = useAsync(() => api.getRevisionItems())

  const due = items?.filter((i) => i.overdue) ?? []
  const upcoming = items?.filter((i) => !i.overdue) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Memory Engine</h1>
        <p className="mt-2 text-sm text-muted">Mastery isn't remembering once — it's remembering when it matters.</p>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : isFeatureLocked(errorObject) ? (
        <UpgradeNotice feature="Memory Engine" />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <Signal tone="danger">Due today</Signal>
              <div className="mt-4 font-mono text-4xl font-bold text-ink">{due.length}</div>
              <p className="text-xs text-muted">items need review now</p>
            </Card>
            <Card className="p-5">
              <Signal tone="accent">Coming up</Signal>
              <div className="mt-4 font-mono text-4xl font-bold text-ink">{upcoming.length}</div>
              <p className="text-xs text-muted">scheduled in the next days</p>
            </Card>
            <Card className="p-5">
              <Signal tone="success">Streak</Signal>
              <div className="mt-4 font-mono text-4xl font-bold text-ink">12</div>
              <p className="text-xs text-muted">days of consistent reviews</p>
            </Card>
          </div>

          {/* due today */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Due today</h2>
              <Badge tone="danger">{due.length} due</Badge>
            </div>
            <div className="space-y-3">
              {due.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">{item.topic}</span>
                        <span className="font-mono text-xs text-danger">{item.memoryStrength}%</span>
                      </div>
                      <span className="text-[11px] text-faint">{item.subject}</span>
                      <Progress value={item.memoryStrength} className="mt-2" barClassName="from-danger to-warning" />
                    </div>
                    <button className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-b from-accent-hi to-accent px-3 py-2 text-xs font-medium text-white transition-all hover:brightness-110">
                      <RefreshCw size={13} /> Review
                    </button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* scheduled */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Scheduled</h2>
              <Badge tone="muted">{upcoming.length} upcoming</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {upcoming.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{item.topic}</span>
                      <span className="font-mono text-xs text-cyan">{item.memoryStrength}%</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
                      <span>Last: {item.lastReviewed}</span>
                      <span className="flex items-center gap-1"><CalendarClock size={11} /> {item.nextReview}</span>
                    </div>
                    <Progress value={item.memoryStrength} className="mt-2" barClassName="from-cyan to-accent" />
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
