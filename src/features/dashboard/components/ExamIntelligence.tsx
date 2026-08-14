import { motion } from 'framer-motion'
import { Bell, ExternalLink } from 'lucide-react'
import type { OfficialNotice, ExamSchedule } from '@/lib/types'
import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/cn'

const statusStyles: Record<string, string> = {
  open: 'bg-success/12 text-success border-success/25',
  upcoming: 'bg-accent/12 text-accent-hi border-accent/25',
  'deadline-soon': 'bg-warning/12 text-warning border-warning/25',
  'admit-card': 'bg-cyan/12 text-cyan border-cyan/25',
  completed: 'bg-surface-2 text-muted border-border',
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  upcoming: 'Upcoming',
  'deadline-soon': 'Deadline Soon',
  'admit-card': 'Admit Card',
  completed: 'Completed',
}

export function ExamIntelligence({ notices, schedule }: { notices: OfficialNotice[]; schedule?: ExamSchedule }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-warning" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Exam Intelligence</h3>
        </div>
        {schedule && (
          <Badge tone={schedule.status === 'upcoming' ? 'accent' : 'warning'} className="text-[9px]">
            {schedule.examType.toUpperCase()}
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {notices.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start justify-between gap-3 rounded-xl border border-border-soft bg-surface px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-ink">{n.title}</span>
                <Badge tone={n.status === 'open' ? 'success' : n.status === 'deadline-soon' ? 'warning' : 'accent'} className={cn('text-[9px]', statusStyles[n.status] || '')}>
                  {statusLabels[n.status] || n.status}
                </Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                <span>{n.sourceName}</span>
                {n.deadline && <span>Deadline: {new Date(n.deadline).toLocaleDateString('en-GB')}</span>}
              </div>
            </div>
            {n.sourceUrl && (
              <a href={n.sourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted hover:text-ink" aria-label="Open official source">
                <ExternalLink size={14} />
              </a>
            )}
          </motion.div>
        ))}
      </div>

      {schedule?.examDate && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border-soft bg-surface px-3 py-2 text-xs text-muted">
          <span>Next exam: {schedule.name}</span>
          <span className="font-mono">{new Date(schedule.examDate).toLocaleDateString('en-GB')}</span>
        </div>
      )}
    </Card>
  )
}
