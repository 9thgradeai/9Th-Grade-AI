import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading, Reveal } from './Reveal'
import { Progress } from '@/components/ui'

const metrics = [
  { label: 'Score', value: 72, tone: 'text-accent-hi' },
  { label: 'Accuracy', value: 78, tone: 'text-cyan' },
  { label: 'Speed', value: 69, tone: 'text-violet' },
  { label: 'Retention', value: 81, tone: 'text-success' },
]

export function AdaptiveExamSection() {
  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Adaptive exam engine"
          title={
            <>
              Stop taking tests that <span className="text-gradient-accent font-display">don't teach you anything.</span>
            </>
          }
          sub="The system adapts difficulty, topics, and timing to your ability — then tells you exactly what to fix."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-semibold uppercase tracking-widest text-ink">Performance Diagnosis</h3>
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-muted">MOCK #12</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-5">
                {metrics.map((m, i) => (
                  <Reveal key={m.label} delay={i * 0.08} y={10}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-faint">{m.label}</span>
                      <span className={`font-mono text-xl font-semibold ${m.tone}`}>{m.value}%</span>
                    </div>
                    <Progress value={m.value} className="mt-2" />
                  </Reveal>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-warning/20 bg-warning/[0.05] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-warning">Weakness detected</div>
                <div className="mt-1 text-sm text-ink-soft">International Organizations</div>
              </div>

              <div className="mt-4 rounded-xl border border-accent/20 bg-accent/[0.06] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-accent-hi">AI recommendation</div>
                <p className="mt-1 text-sm text-muted">Review the UN system and complete 20 targeted questions.</p>
              </div>

              <Link
                to="/onboarding"
                className="mt-5 inline-flex items-center gap-2 py-2 text-sm font-medium text-accent-hi transition-colors hover:text-ink"
              >
                Start Targeted Practice <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="flex flex-col gap-4">
              <p className="text-xl font-medium leading-snug tracking-tight text-ink">
                A test is not a verdict. It's a <span className="text-accent-hi">diagnostic instrument.</span>
              </p>
              <p className="text-[15px] leading-relaxed text-muted">
                After every test you see a full performance diagnosis — not a score. You learn where you lost
                marks, why, and what to do about it before the next attempt.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Adaptive', 'next question matches you'],
                  ['Diagnostic', 'understand every loss'],
                  ['Targeted', 'practice what hurts most'],
                  ['Actionable', 'know your next step'],
                ].map(([a, b]) => (
                  <div key={a} className="rounded-xl border border-white/8 bg-space-900/50 p-4">
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
