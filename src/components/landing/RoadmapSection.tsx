import { motion } from 'framer-motion'
import { SectionHeading, Reveal } from './Reveal'

const phases = ['Diagnostic', 'Foundation', 'Syllabus Coverage', 'Weakness Elimination', 'Adaptive Practice', 'Mock Simulation', 'Revision', 'Exam Ready']

export function RoadmapSection() {
  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Your roadmap"
          title={
            <>
              A roadmap generated <span className="text-gradient-accent font-display">backward from exam day.</span>
            </>
          }
          sub="9Th-Grade AI doesn't just tell you what to study. It works backward from where you need to be."
        />

        <div className="relative mt-16">
          {/* spine */}
          <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-8">
            {phases.map((p, i) => {
              const isLast = i === phases.length - 1
              return (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`relative flex flex-col gap-2 rounded-2xl border p-4 ${
                    isLast
                      ? 'border-accent/30 bg-accent/[0.07] ring-glow'
                      : 'border-white/8 bg-white/[0.03]'
                  }`}
                >
                  <span className="font-mono text-[10px] text-faint">{String(i + 1).padStart(2, '0')}</span>
                  <span className={`text-sm font-semibold ${isLast ? 'text-accent-hi' : 'text-ink'}`}>{p}</span>
                </motion.div>
              )
            })}
          </div>

          <Reveal delay={0.2} className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-success" />
              <span className="font-mono text-sm text-ink">
                Destination — <span className="text-accent-hi">EXAM DAY</span>
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
