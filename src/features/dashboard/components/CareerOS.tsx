import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import type { CareerMilestone } from '@/lib/types'
import { Card, Badge, Progress } from '@/components/ui'
import { cn } from '@/lib/cn'

export function CareerOS({ milestones }: { milestones: CareerMilestone[] }) {
  const current = milestones.find((m) => m.current)
  const completed = milestones.filter((m) => m.completed).length
  const total = milestones.length
  const progressPct = Math.round((completed / total) * 100)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Career OS</h3>
      <div className="mt-4 space-y-3">
        {milestones.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5', m.current ? 'border-accent/30 bg-accent/[0.06]' : 'border-border-soft bg-surface')}
          >
            <span className="shrink-0">
              {m.completed ? <CheckCircle2 size={18} className="text-success" /> : m.current ? <Circle size={18} className="text-accent-hi" /> : <Circle size={18} className="text-faint" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{m.label}</span>
                {m.labelBn && <span className="lang-bn text-xs text-faint">{m.labelBn}</span>}
              </div>
              <p className="text-[11px] text-muted">{m.description}</p>
            </div>
            {m.current && <Badge tone="accent" className="text-[9px]">Current</Badge>}
          </motion.div>
        ))}
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-faint">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="mt-1" />
      </div>
      {current && (
        <p className="mt-3 text-xs text-muted">Next milestone: {milestones.find((m) => !m.completed && !m.current)?.label ?? 'Complete all stages'}</p>
      )}
    </Card>
  )
}
