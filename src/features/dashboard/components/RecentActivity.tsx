import { motion } from 'framer-motion'
import { FileText, BookOpen, Bot, NotebookPen, Award } from 'lucide-react'
import type { ActivityEvent } from '@/lib/types'
import { Card } from '@/components/ui'

const typeConfig: Record<string, { icon: typeof FileText; tone: string; label: string }> = {
  exam: { icon: FileText, tone: 'accent', label: 'Exam' },
  mastered: { icon: Award, tone: 'success', label: 'Mastered' },
  revised: { icon: BookOpen, tone: 'cyan', label: 'Revised' },
  tutor: { icon: Bot, tone: 'violet', label: 'AI Tutor' },
  written: { icon: NotebookPen, tone: 'warning', label: 'Written' },
  viva: { icon: NotebookPen, tone: 'warning', label: 'Viva' },
  milestone: { icon: Award, tone: 'success', label: 'Milestone' },
  streak: { icon: Award, tone: 'warning', label: 'Streak' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function RecentActivity({ activities }: { activities: ActivityEvent[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Recent Activity</h3>
      <div className="mt-4 space-y-2.5">
        {activities.map((a, i) => {
          const cfg = typeConfig[a.type] ?? typeConfig.exam
          const Icon = cfg.icon
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted">
                <Icon size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink">{a.title}</span>
                  {a.xp && <span className="shrink-0 font-mono text-[11px] text-success">+{a.xp} XP</span>}
                </div>
                <p className="text-[11px] text-muted">{a.description}</p>
              </div>
              <span className="shrink-0 text-[10px] text-faint">{timeAgo(a.occurredAt)}</span>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
