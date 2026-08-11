import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Flame,
  Target,
  ArrowRight,
  Play,
  BookOpen,
  AlertTriangle,
} from 'lucide-react'
import type { Performance, DailyTask, Subject } from '@/lib/types'
import { Card, Progress, Badge } from '@/components/ui'

/* ============================================================
   Dashboard command-center primitives.
   The home page answers: what exam, how ready, what now, where weak.
   ============================================================ */

/* ---------- Exam context header ---------- */

export function ExamContextHeader({
  examName,
  daysRemaining,
  readiness,
}: {
  examName: string
  daysRemaining?: number
  readiness?: number
}) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent-hi">
          <Target size={19} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{examName}</h2>
            <Badge tone="accent">Target exam</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {daysRemaining !== undefined ? `${daysRemaining} days to the preliminary · ` : ''}
            preparation system active
          </p>
        </div>
      </div>
      <div className="flex items-center gap-5">
        {daysRemaining !== undefined && (
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-cyan" />
            <span className="font-mono text-2xl font-semibold tracking-tight text-ink">{daysRemaining}</span>
            <span className="text-[11px] uppercase tracking-wider text-faint">days left</span>
          </div>
        )}
        {readiness !== undefined && (
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-faint">
              <span className="uppercase tracking-wider">Readiness</span>
              <span className="font-mono text-success">{readiness}%</span>
            </div>
            <Progress value={readiness} className="mt-1.5" barClassName="from-success to-accent" />
          </div>
        )}
      </div>
    </Card>
  )
}

/* ---------- Core performance summary (§8: Readiness/Accuracy/Percentile/Streak) ---------- */

export function CoreSummary({ perf }: { perf: Performance }) {
  const tiles = [
    {
      label: 'Readiness',
      value: perf.examReadiness,
      tone: 'success' as const,
      sub: 'vs target 90%',
      to: '/progress',
    },
    { label: 'Accuracy', value: perf.accuracy, tone: 'accent' as const, sub: 'questions correct', to: '/progress' },
    { label: 'Percentile', value: perf.percentile, tone: 'violet' as const, sub: 'estimated cohort', to: '/rank' },
    { label: 'Streak', value: perf.streakDays, tone: 'warning' as const, sub: 'day streak', to: '/progress' },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <motion.div key={t.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <Link to={t.to} className="group block">
            <Card className="p-5 transition-colors hover:border-border group-hover:bg-surface-2/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{t.label}</span>
                <span className="font-mono text-xl font-semibold tracking-tight text-ink-soft">
                  {t.label === 'Streak' && <Flame size={15} className="mr-1 inline text-warning" />}
                  {t.value}
                  {t.label === 'Percentile' || t.label === 'Accuracy' || t.label === 'Readiness' ? '%' : ''}
                </span>
              </div>
              <Progress value={t.value} className="mt-3" />
              <span className="mt-2 block text-[11px] text-faint">{t.sub}</span>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

/* ---------- Today's Mission (§7) ---------- */

export interface MissionItem {
  n: number
  title: string
  meta: string
  durationMinutes: number
  expected?: number
  kind: DailyTask['kind']
  rationale: string
}

export function MissionCard({
  items,
  memoryDue,
}: {
  items: MissionItem[]
  memoryDue?: number
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Today's Mission</h3>
        <Badge tone="accent">{items.length} tasks</Badge>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((t, i) => (
          <motion.div
            key={t.n}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border-soft bg-surface px-3 py-2.5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.08] font-mono text-[11px] text-accent-hi">
                {t.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-sm font-medium text-ink">{t.title}</span>
                  <Badge tone="muted" className="px-2 py-0 text-[9px]">{t.meta}</Badge>
                </div>
                <div className="mt-0.5 text-[11px] text-faint">
                  {t.durationMinutes}m{t.expected ? ` · ${t.expected} questions` : ''}
                </div>
                <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-muted">
                  <span className="mt-0.5 shrink-0 text-accent-hi">·</span>
                  {t.rationale}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {memoryDue ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: items.length * 0.05 }}
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
              Review <ArrowRight size={14} />
            </Link>
          </motion.div>
        ) : null}
      </div>

      <Link
        to="/practice"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-4 py-3 text-sm font-medium text-white transition-all hover:brightness-110"
      >
        <Play size={15} /> Start Mission
      </Link>
    </Card>
  )
}

/* ---------- Strategic priority flag (§11) ---------- */

export type Priority = 'critical' | 'focus' | 'ontrack'

export function priorityFor(s: Pick<Subject, 'mastery' | 'weight'>): Priority {
  // Critical = very weak; Focus = weak; boosted when the subject carries high marks.
  if (s.mastery < 50) return 'critical'
  if (s.mastery < 62) return 'focus'
  if (s.mastery < 55 && s.weight >= 20) return 'focus'
  return 'ontrack'
}

export function PriorityFlag({ priority }: { priority: Priority }) {
  if (priority === 'ontrack') return <Badge tone="success">On track</Badge>
  if (priority === 'focus')
    return (
      <Badge tone="warning">
        <AlertTriangle size={11} /> Focus
      </Badge>
    )
  return (
    <Badge tone="danger">
      <AlertTriangle size={11} /> Critical
    </Badge>
  )
}

/* ---------- 10-subject performance list (§11) ---------- */

export function SubjectPerformanceList({ subjects, totalMarks }: { subjects: Subject[]; totalMarks: number }) {
  const rows = [...subjects].sort((a, b) => priorityRank(a) - priorityRank(b))
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Subject pulse</h3>
        <span className="font-mono text-[11px] text-faint">{totalMarks} marks</span>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((s, i) => {
          const p = priorityFor(s)
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/subjects/${s.id}`} className="group block">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-ink-soft group-hover:text-ink">{s.name}</span>
                    {s.nameBn && <span className="lang-bn truncate text-xs text-faint">{s.nameBn}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[10px] text-faint">{s.weight}m</span>
                    <PriorityFlag priority={p} />
                    <span className="font-mono text-xs text-muted">{s.mastery}%</span>
                  </span>
                </div>
                <Progress
                  value={s.mastery}
                  className="mt-1.5"
                  barClassName={
                    p === 'critical' ? 'from-danger to-warning' : p === 'focus' ? 'from-warning to-accent' : 'from-accent to-cyan'
                  }
                />
              </Link>
            </motion.div>
          )
        })}
      </div>
      <div className="mt-4 border-t border-border-soft pt-3 text-[11px] text-faint">
        <span className="mr-4"><span className="text-danger">Critical</span> — mastery below 50%</span>
        <span className="mr-4"><span className="text-warning">Focus</span> — below 62%</span>
        <span>Weak areas surface first.</span>
      </div>
    </Card>
  )
}

function priorityRank(s: Subject): number {
  return priorityFor(s) === 'critical' ? 0 : priorityFor(s) === 'focus' ? 1 : 2
}

/* ---------- Mission builder (shared with Dashboard) ---------- */

export function buildMission(
  tasks: DailyTask[],
  subjects: Subject[],
): MissionItem[] {
  return tasks.slice(0, 4).map((t, i) => {
    const s = subjectForTask(t, subjects)
    const rationale = s
      ? `Recommended because your accuracy in ${short(s.name)} is ${s.accuracy}% and it carries ${s.weight} marks.`
      : t.priority === 'high'
        ? 'High-priority item to move your score today.'
        : 'Recommended to keep your preparation balanced.'
    return {
      n: i + 1,
      title: `${t.topic}`,
      meta: t.subject,
      durationMinutes: t.durationMinutes,
      expected: t.expectedQuestions,
      kind: t.kind,
      rationale,
    }
  })
}

function subjectForTask(task: DailyTask, subjects: Subject[]): Subject | undefined {
  const q = task.subject.toLowerCase()
  return subjects.find((s) => {
    const name = s.name.toLowerCase()
    const bn = (s.nameBn ?? '').toLowerCase()
    return name.includes(q) || q.includes(name) || bn.includes(q)
  })
}

function short(name: string): string {
  // Trim long canonical names ("English Language and Literature") for inline copy.
  const parts = name.split(/\s+/)
  return parts.length > 2 ? parts.slice(0, 2).join(' ') : name
}
