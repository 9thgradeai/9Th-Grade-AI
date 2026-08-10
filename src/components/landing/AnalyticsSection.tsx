import { motion } from 'framer-motion'
import { SectionHeading, Reveal } from './Reveal'

function Radial({ value, label, color = '#4f7cff' }: { value: number; label: string; color?: string }) {
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <motion.circle
            cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-semibold text-ink">
          {value}%
        </div>
      </div>
      <span className="mt-2 text-[11px] uppercase tracking-widest text-faint">{label}</span>
    </div>
  )
}

const traj = [38, 42, 45, 44, 50, 54, 52, 58, 61, 60, 65, 67]

export function AnalyticsSection() {
  const w = 320
  const h = 96
  const max = 100
  const pts = traj.map((v, i) => [8 + (i * (w - 16)) / (traj.length - 1), h - 8 - (v / max) * (h - 16)])

  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Performance intelligence"
          title={
            <>
              Not just scores. <span className="text-gradient-accent font-display">A full intelligence layer.</span>
            </>
          }
          sub="Mastery, accuracy, speed, retention, consistency, readiness — combined into a single, honest picture."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Radial value={71} label="Readiness" />
              <Radial value={67} label="Mastery" color="#22d3ee" />
              <Radial value={82} label="Consistency" color="#34d399" />
              <Radial value={64} label="Retention" color="#8b5cf6" />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">Exam Readiness</h3>
                <span className="rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 font-mono text-[11px] text-success">On track</span>
              </div>

              <div className="mt-2 font-mono text-3xl font-semibold text-ink">74%</div>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-faint">
                <span>Target 90%</span>
                <span className="h-1 w-1 rounded-full bg-faint/60" />
                <span>Trajectory: rising</span>
              </div>

              {/* trajectory chart */}
              <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 h-24 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trajfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f7cff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4f7cff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((y) => (
                  <line key={y} x1="0" x2={w} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                ))}
                <path d={`M${pts.map((p) => p.join(',')).join(' L')}`} fill="none" stroke="#4f7cff" strokeWidth="2" strokeLinecap="round" />
                <motion.path
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  d={`M${pts[0].join(',')} L${pts[0].join(',')} L${pts[pts.length - 1].join(',')} L${pts[pts.length - 1][0]},${h - 8} Z`}
                  fill="url(#trajfill)"
                />
              </svg>

              <p className="mt-4 text-sm leading-relaxed text-muted">
                <span className="text-accent-hi">AI:</span> Increase Mathematics practice by 20 minutes a day to stay on trajectory.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
