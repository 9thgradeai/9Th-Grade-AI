import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Play, CheckCircle2, Circle } from 'lucide-react'
import type { DailyTask, AIBriefing } from '@/lib/types'
import { Card, Badge, Progress } from '@/components/ui'
import { cn } from '@/lib/cn'

/* ---------- AI Briefing ---------- */

export function AIBriefingCard({ briefing }: { briefing: AIBriefing }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.1] text-accent-hi">
          <Sparkles size={15} />
        </span>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-widest text-ink">{briefing.title}</h3>
      </div>
      <ul className="mt-4 space-y-2.5">
        {briefing.items.map((item, i) => (
          <motion.li
            key={item}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-2.5 text-sm text-ink-soft"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-hi" />
            {item}
          </motion.li>
        ))}
      </ul>
      <Link to="/strategy" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-hi transition-colors hover:text-ink">
        View Strategy <ArrowRight size={14} />
      </Link>
    </Card>
  )
}

/* ---------- Daily Mission ---------- */

export function DailyMissionCard({ tasks }: { tasks: DailyTask[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Today's Mission</h3>
        <Badge tone="accent">{tasks.length} tasks</Badge>
      </div>
      <div className="mt-4 space-y-2">
        {tasks.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/15"
          >
            <button aria-label={t.status === 'done' ? 'Mark incomplete' : 'Mark complete'}>
              {t.status === 'done' ? <CheckCircle2 size={18} className="text-success" /> : <Circle size={18} className="text-faint group-hover:text-accent-hi" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-ink">{t.topic}</span>
                <Badge tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'muted'} className="px-2 py-0 text-[9px]">
                  {t.priority}
                </Badge>
              </div>
              <span className="text-[11px] text-faint">{t.subject}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs text-ink-soft">{t.durationMinutes}m</span>
              {t.expectedQuestions && <div className="text-[10px] text-faint">{t.expectedQuestions} questions</div>}
            </div>
          </motion.div>
        ))}
      </div>
      <Link to="/practice" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-hi transition-colors hover:text-ink">
        <Play size={14} /> Start mission
      </Link>
    </Card>
  )
}

/* ---------- Next Best Action ---------- */

export function NextBestAction() {
  return (
    <Card className="relative overflow-hidden border-accent/25 p-5 ring-glow">
      <div className="pointer-events-none absolute -left-8 -bottom-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <Badge tone="accent">Next Best Action</Badge>
      <h3 className="mt-3 text-lg font-semibold text-ink">Complete 20 Percentage & Profit/Loss questions.</h3>
      <p className="mt-1.5 text-sm text-muted">
        Your accuracy there (51%) is the largest lever on your Mathematics score.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Link
          to="/practice?topic=t_profit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
        >
          <Play size={15} /> Start
        </Link>
        <span className="font-mono text-[11px] text-faint">Expected impact: High</span>
      </div>
    </Card>
  )
}

/* ---------- Metric tiles ---------- */

export function MetricTile({
  label,
  value,
  tone = 'accent',
  sub,
}: {
  label: string
  value: number | string
  tone?: 'accent' | 'cyan' | 'violet' | 'success'
  sub?: string
}) {
  const color = { accent: 'text-accent-hi', cyan: 'text-cyan', violet: 'text-violet', success: 'text-success' }[tone]
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{label}</span>
        <span className={cn('font-mono text-2xl font-semibold tracking-tight', color)}>{value}%</span>
      </div>
      <Progress value={typeof value === 'number' ? value : 0} className="mt-3" barClassName={tone === 'cyan' ? 'from-cyan to-accent' : tone === 'violet' ? 'from-violet to-accent' : tone === 'success' ? 'from-success to-accent' : undefined} />
      {sub && <span className="mt-2 block text-[11px] text-faint">{sub}</span>}
    </Card>
  )
}
