import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, BookOpen, Flag } from 'lucide-react'
import type { DashboardMission } from '@/lib/types'
import { Card, Badge, Button } from '@/components/ui'
import { cn } from '@/lib/cn'

export function TodaysMission({ mission, memoryDue }: { mission: DashboardMission[]; memoryDue: number }) {
  const impactColors: Record<string, string> = {
    high: 'border-success/30 bg-success/[0.06]',
    medium: 'border-accent/30 bg-accent/[0.06]',
    low: 'border-border bg-surface',
  }

  const kindIcons: Record<string, typeof Play> = {
    practice: Play,
    revision: BookOpen,
    test: Flag,
    review: BookOpen,
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Today's Mission</h3>
        <Badge tone="accent">{mission.length} tasks</Badge>
      </div>

      <div className="mt-4 space-y-2">
        {mission.map((t, i) => {
          const Icon = kindIcons[t.kind] ?? Play
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('rounded-xl border px-3 py-2.5', impactColors[t.expectedImpact] || impactColors.medium)}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.08] font-mono text-[11px] text-accent-hi">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-medium text-ink">{t.title}</span>
                    <Badge tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'muted'} className="px-2 py-0 text-[9px]">
                      {t.priority}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[11px] text-faint">
                    {t.durationMinutes}m{t.expectedQuestions ? ` · ${t.expectedQuestions} questions` : ''}
                  </div>
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-muted">
                    <span className="mt-0.5 shrink-0 text-accent-hi">·</span>
                    {t.rationale}
                  </p>
                </div>
                <Link to={t.actionRoute} className="shrink-0">
                  <Button size="sm" variant="ghost" icon={<Icon size={14} />} className="h-8 px-2">
                    {t.actionLabel}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )
        })}

        {memoryDue ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: mission.length * 0.05 }}
            className="flex items-center justify-between rounded-xl border border-warning/25 bg-warning/[0.06] px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={16} className="text-warning" />
              <div>
                <span className="text-sm font-medium text-ink">Memory review</span>
                <span className="ml-2 text-[11px] text-muted">{memoryDue} item{memoryDue > 1 ? 's' : ''} overdue</span>
              </div>
            </div>
            <Link to="/memory" className="inline-flex items-center gap-1 text-sm font-medium text-accent-hi hover:text-ink">
              Review
            </Link>
          </motion.div>
        ) : null}
      </div>
    </Card>
  )
}
