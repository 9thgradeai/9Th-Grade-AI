import { ArrowDown, Radar, Target, Zap, Gauge, RefreshCw, TrendingUp } from 'lucide-react'
import { SectionHeading, Reveal } from './Reveal'

const stages = [
  { key: 'DIAGNOSE', label: 'Understand the candidate', icon: Radar, color: 'text-accent-hi' },
  { key: 'STRATEGIZE', label: 'Build a personalized plan', icon: Target, color: 'text-violet' },
  { key: 'EXECUTE', label: 'Turn strategy into daily actions', icon: Zap, color: 'text-cyan' },
  { key: 'MEASURE', label: 'Analyze every interaction', icon: Gauge, color: 'text-success' },
  { key: 'ADAPT', label: 'Change the plan intelligently', icon: RefreshCw, color: 'text-warning' },
  { key: 'IMPROVE', label: 'Repeat until exam-ready', icon: TrendingUp, color: 'text-accent-hi' },
]

export function CoreLoop() {
  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="The core loop"
          title={
            <>
              A closed loop that <span className="text-gradient-accent font-display">keeps improving you.</span>
            </>
          }
          sub="Each pass through the loop turns your effort into a more intelligent plan."
        />

        <div className="mt-16 grid gap-4 lg:grid-cols-2">
          {/* Vertical engine flow */}
          <Reveal>
            <div className="flex h-full flex-col justify-center gap-1">
              {stages.map((s, i) => (
                <Reveal key={s.key} delay={i * 0.1} y={0}>
                  <div className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] ${s.color}`}>
                      <s.icon size={17} />
                    </span>
                    <div>
                      <div className="font-mono text-sm font-semibold tracking-wider text-ink">{s.key}</div>
                      <div className="text-xs text-muted">{s.label}</div>
                    </div>
                    {i < stages.length - 1 && (
                      <ArrowDown size={14} className="ml-auto text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* Explanation panel */}
          <Reveal delay={0.15}>
            <div className="flex h-full flex-col justify-center rounded-2xl border border-white/8 bg-white/[0.03] p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-hi">The loop in plain words</p>
              <p className="mt-4 text-2xl font-medium leading-snug tracking-tight text-ink">
                The system understands you first — then it never stops learning from you.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Traditional preparation is linear. 9Th-Grade AI closes the loop: every answer, every mistake,
                every revision feeds back into a plan that is recalculated for tomorrow.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ['Diagnose', 'know where you are'],
                  ['Strategize', 'know what to do'],
                  ['Adapt', 'change as you grow'],
                ].map(([a, b]) => (
                  <div key={a} className="rounded-xl border border-white/8 bg-space-900/50 p-3">
                    <div className="text-sm font-semibold text-ink">{a}</div>
                    <div className="mt-1 text-[11px] leading-snug text-muted">{b}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
