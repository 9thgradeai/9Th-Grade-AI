import { motion } from 'framer-motion'
import { SectionHeading, Reveal } from './Reveal'

const reviews = [
  { label: 'Learn', brightness: 0.95 },
  { label: 'Review 1', brightness: 0.75 },
  { label: 'Review 2', brightness: 0.55 },
  { label: 'Review 3', brightness: 0.35 },
  { label: 'Mastery', brightness: 1 },
]

export function MemoryEngineSection() {
  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Memory engine"
          title={
            <>
              Mastery isn't remembering once.
              <br />
              <span className="text-gradient-accent font-display">It's remembering when it matters.</span>
            </>
          }
          align="center"
          sub="Your memory naturally fades. The system schedules reviews just before you'd forget — turning fading stars back into mastered constellations."
        />

        <Reveal className="mt-16">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end justify-between gap-2">
              {reviews.map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex flex-1 flex-col items-center gap-3"
                >
                  <motion.svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    style={{ opacity: r.brightness }}
                    animate={r.label === 'Mastery' ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2.4 }}
                  >
                    <path
                      fill={r.label === 'Mastery' ? '#22d3ee' : '#8b94ab'}
                      d="M12 2l2.5 6.2L21 9l-5 4.2L17.5 20 12 16.6 6.5 20 8 13.2 3 9l6.5-.8z"
                    />
                  </motion.svg>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-medium text-ink-soft">{r.label}</span>
                    <span className="text-[10px] text-faint">+ interval</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-center">
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted">
                A topic goes dim. The AI schedules Review 1, then Review 2, then Review 3 — each timed against
                your personal forgetting curve. By exam day, it stays bright <span className="text-ink">when you need it.</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
