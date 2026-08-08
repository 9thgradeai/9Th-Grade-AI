import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { SectionHeading, Reveal } from './Reveal'

const signals = ['correctness', 'response time', 'difficulty', 'confidence', 'topic', 'recurring error patterns', 'knowledge gaps']

export function EveryAnswerSection() {
  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Signal engine"
          title={
            <>
              Every answer <span className="text-gradient-accent font-display">changes the system.</span>
            </>
          }
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <div className="space-y-3">
                {/* A question, answered */}
                <div className="rounded-xl border border-white/8 bg-space-900/60 p-4">
                  <p className="text-sm text-ink-soft">
                    The United Nations was founded in…
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-1 text-xs text-danger">
                      <XCircle size={13} /> 1919
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2.5 py-1 text-xs text-success">
                      <CheckCircle2 size={13} /> 1945
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-faint">
                    <span className="font-mono">12.4s</span>·<span>difficulty 2/5</span>·<span>low confidence</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-faint">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="font-mono text-[11px] uppercase tracking-widest">+ 7 signals</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {signals.map((s) => (
                    <span key={s} className="rounded-lg border border-cyan/20 bg-cyan/[0.06] px-2.5 py-1 text-[11px] font-medium text-cyan">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <p className="text-xl font-medium leading-snug tracking-tight text-ink">
                In 9Th-Grade AI, an answer isn't just right or wrong.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                The system reads your correctness, your speed, the difficulty, your confidence, and your
                recurring error patterns — then updates your entire preparation model.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-6 rounded-2xl border border-accent/20 bg-accent/[0.06] p-5"
              >
                <p className="font-mono text-sm font-semibold tracking-wide text-accent-hi">Every question becomes a signal.</p>
                <p className="mt-2 text-sm text-muted">One wrong answer — correctly read — tells your system more than a blind 10-question quiz ever could.</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
