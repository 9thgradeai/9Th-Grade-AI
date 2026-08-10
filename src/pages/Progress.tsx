import { motion } from 'framer-motion'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Card, Skeleton, Progress, Metric, Signal, Badge } from '@/components/ui'
import { CosmicHorizon } from '@/components/horizon'

export default function ProgressPage() {
  const perf = useAsync(() => api.getPerformance())
  const subjects = useAsync(() => api.listSubjects())

  if (!perf.data) return <Skeleton className="h-96 rounded-2xl" />

  const p = perf.data
  const w = 600
  const h = 160
  const max = 100
  const pts = p.trajectory.map((v, i) => [12 + (i * (w - 24)) / (p.trajectory.length - 1), h - 16 - (v / max) * (h - 32)])
  const maxStudy = Math.max(...p.studyHistory.map((s) => s.minutes))

  const bars = [
    ['Mastery', p.mastery, 'text-accent-hi'],
    ['Accuracy', p.accuracy, 'text-cyan'],
    ['Speed', p.speed, 'text-violet'],
    ['Retention', p.retention, 'text-success'],
    ['Consistency', p.consistency, 'text-warning'],
    ['Syllabus', p.syllabusCoverage, 'text-accent-hi'],
  ] as const

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Progress</h1>
        <p className="mt-2 text-sm text-muted">Every interaction, measured. Every trend, visible.</p>
      </div>

      {/* overview universe */}
      <Card className="relative h-48 overflow-hidden">
        <CosmicHorizon variant="static" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent-hi">Exam Readiness</p>
            <p className="mt-1 font-mono text-5xl font-bold text-gradient">{p.examReadiness}%</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge tone="success">On track</Badge>
              <span className="text-[11px] text-faint">Target 90%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* metric grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {bars.map(([label, value, cls], i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-faint">{label}</span>
                <span className={`font-mono text-lg font-semibold ${cls}`}>{value}%</span>
              </div>
              <Progress value={value} className="mt-2" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* trajectory + study history */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Readiness trajectory</h2>
            <span className="font-mono text-[11px] text-success">+29 pts</span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-40 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f7cff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4f7cff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="0" x2={w} y1={(h / 4) * i} y2={(h / 4) * i} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            <path d={`M${pts.map((x) => x.join(',')).join(' L')}`} fill="none" stroke="#4f7cff" strokeWidth="2" strokeLinecap="round" />
            <path d={`M${pts[0][0]},${h - 16} L${pts.map((x) => x.join(',')).join(' L')} L${pts[pts.length - 1][0]},${h - 16} Z`} fill="url(#trfill)" />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#4f7cff" />
          </svg>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Study history</h2>
            <span className="font-mono text-[11px] text-muted">last 7 days</span>
          </div>
          <div className="mt-5 flex h-40 items-end justify-between gap-2">
            {p.studyHistory.map((s, i) => (
              <motion.div key={s.day} className="flex flex-1 flex-col items-center gap-1.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(s.minutes / maxStudy) * 100}%` }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-accent/40 to-accent"
                  style={{ minHeight: 6 }}
                />
                <span className="text-[10px] text-faint">{s.day}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
            <span>0m</span>
            <span className="font-mono text-ink-soft">{maxStudy}m peak</span>
          </div>
        </Card>
      </div>

      {/* subject breakdown */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-faint">Subject breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(subjects.data ?? []).map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    {s.name}
                    {s.nameBn && <span className="ml-1.5 lang-bn text-xs text-faint">{s.nameBn}</span>}
                  </span>
                  <span className="font-mono text-xs text-muted">acc {s.accuracy}% · spd {s.speed}% · ret {s.retention}%</span>
                </div>
                <Progress value={s.mastery} className="mt-2" barClassName={s.mastery < 55 ? 'from-danger to-warning' : undefined} />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* weakness map */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Signal tone="warning">Weakness map</Signal>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Percentage & Profit/Loss', 47, 'Math'],
            ['International Organizations', 44, 'Int. Affairs'],
            ['Geometry', 51, 'Math'],
            ['Physics Formulas', 53, 'Science'],
          ].map(([name, value, sub]) => (
            <div key={name as string} className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-soft">{name as string}</span>
                <span className="font-mono text-danger">{value}%</span>
              </div>
              <div className="mt-1 text-[10px] text-faint">{sub as string}</div>
              <Progress value={value as number} className="mt-2" barClassName="from-danger to-warning" />
            </div>
          ))}
        </div>
      </Card>

      {/* competitive */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Current percentile" value={`${p.percentile}%`} tone="accent" sub="national cohort" />
        <Metric label="Target percentile" value={`${p.targetPercentile}%`} tone="violet" />
        <Metric label="Projected percentile" value={`${p.projectedPercentile}%`} tone="success" sub="at current trajectory" />
      </div>
    </div>
  )
}
