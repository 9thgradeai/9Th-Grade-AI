import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Card, Skeleton, Progress, Metric, Signal } from '@/components/ui'

export default function Rank() {
  const perf = useAsync(() => api.getPerformance())
  const subjects = useAsync(() => api.listSubjects())

  if (!perf.data) return <Skeleton className="h-96 rounded-2xl" />

  const p = perf.data
  const w = 600
  const h = 120
  const pts = p.trajectory.map((v, i) => [12 + (i * (w - 24)) / (p.trajectory.length - 1), h - 16 - (v / 100) * (h - 32)])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Competitive Position</h1>
        <p className="mt-2 text-sm text-muted">Compete against your target, not your anxiety.</p>
      </div>

      <Card className="border-accent/20 bg-accent/[0.04] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-hi">Current percentile</p>
        <p className="mt-1 font-mono text-5xl font-semibold tracking-tight text-ink">{p.percentile}%</p>
        <Progress value={p.percentile} className="mt-5 h-2" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Target percentile" value={`${p.targetPercentile}%`} tone="violet" />
        <Metric label="Projected percentile" value={`${p.projectedPercentile}%`} tone="success" />
        <Metric label="Potential score" value={`${p.potentialScore}/100`} tone="accent" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Percentile trajectory</h2>
          <Signal tone="success">Rising</Signal>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-32 w-full" preserveAspectRatio="none">
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="0" x2={w} y1={(h / 4) * i} y2={(h / 4) * i} stroke="var(--color-border-soft)" strokeWidth="1" />
          ))}
          <path d={`M${pts.map((x) => x.join(',')).join(' L')}`} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="#8b5cf6" />
        </svg>
      </Card>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-faint">Subject percentile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(subjects.data ?? []).slice(0, 6).map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">{s.name}</span>
                <span className="font-mono text-xs text-accent-hi">{Math.round(60 + s.mastery * 0.45)}%</span>
              </div>
              <Progress value={Math.round(60 + s.mastery * 0.45)} className="mt-2" barClassName="from-violet to-accent" />
            </Card>
          ))}
        </div>
      </div>

      <Card className="flex items-start gap-3 border-accent/20 p-5">
        <Signal tone="accent">Keep perspective</Signal>
        <p className="text-sm leading-relaxed text-muted">
          Percentile is a directional signal, not a verdict. The system is built to raise your target, not feed
          comparison anxiety. Focus on today's mission — the trajectory follows.
        </p>
      </Card>
    </div>
  )
}
