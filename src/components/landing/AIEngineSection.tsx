import { motion } from 'framer-motion'
import { SectionHeading, Reveal } from './Reveal'
import { BrandMark } from '@/components/navigation/Logo'

const inputs = ['exam date', 'syllabus', 'performance', 'mistakes', 'study time', 'accuracy', 'speed', 'retention', 'consistency', 'previous tests']
const outputs = ['daily plan', 'next best action', 'revision schedule', 'targeted practice', 'topic priority', 'difficulty adjustment', 'mock recommendations']

function Chip({ label }: { label: string }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-ink-soft"
    >
      <span className="h-1 w-1 rounded-full bg-cyan" />
      {label}
    </motion.span>
  )
}

export function AIEngineSection() {
  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="AI preparation engine"
          title={
            <>
              Your preparation is a <span className="text-gradient-accent font-display">living system.</span>
            </>
          }
          align="center"
          sub="Not a fixed plan. A system that recomputes itself from everything you do."
        />

        <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          {/* Inputs */}
          <Reveal>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">The system reads</p>
              <div className="flex flex-wrap gap-2">
                {inputs.map((i, idx) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                    <Chip label={i} />
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Core */}
          <Reveal>
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
              {/* rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-full border border-accent/20"
                style={{ borderTopColor: 'rgba(79,209,255,0.6)' }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-4 rounded-full border border-violet/20"
                style={{ borderBottomColor: 'rgba(139,92,246,0.6)' }}
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              />
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl ring-glow bg-gradient-to-br from-accent/25 to-violet/25 backdrop-blur">
                <BrandMark className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-muted">
                AI core
              </div>
            </div>
          </Reveal>

          {/* Outputs */}
          <Reveal delay={0.1}>
            <div className="lg:text-right">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-faint lg:flex lg:justify-end">The system plans</p>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {outputs.map((o, idx) => (
                  <motion.div key={o} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-ink-soft"
                    >
                      <span className="h-1 w-1 rounded-full bg-accent" />
                      {o}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
