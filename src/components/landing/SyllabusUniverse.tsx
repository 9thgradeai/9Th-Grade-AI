import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { SectionHeading, Reveal } from './Reveal'

const subjects = [
  { name: 'Bangla', topics: ['Literature', 'Grammar', 'Linguistics', 'Vocabulary'] },
  { name: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Translation'] },
  { name: 'Bangladesh Affairs', topics: ['History', 'Liberation War', 'Constitution', 'Geography'] },
  { name: 'International Affairs', topics: ['UN System', 'Organizations', 'Treaties', 'Current Affairs'] },
  { name: 'General Science', topics: ['Physics', 'Chemistry', 'Biology', 'Everyday Science'] },
  { name: 'ICT', topics: ['Computer Basics', 'Internet', 'Cybersecurity', 'Software'] },
  { name: 'Mathematical Reasoning', topics: ['Arithmetic', 'Algebra', 'Geometry', 'Data'] },
  { name: 'Mental Ability', topics: ['Series', 'Coding', 'Analogy', 'Puzzles'] },
  { name: 'Ethics & Governance', topics: ['Values', 'Good Governance', 'Integrity', 'Public Ethics'] },
  { name: 'Geography', topics: ['Bangladesh', 'World', 'Physical', 'Economic'] },
]

const drill = {
  Grammar: ['Sandhi', 'Samas', 'Karok', 'Bibhakti', 'Pratyay', 'Spelling'],
}

export function SyllabusUniverse() {
  const [active, setActive] = useState<null | { name: string; topics: string[] }>(null)

  return (
    <section data-universe-state="constellation" className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Syllabus universe"
          title={
            <>
              The entire syllabus becomes <span className="text-gradient-accent font-display">navigable.</span>
            </>
          }
          sub="From a single exam, drill into subjects, then topics, then the exact nodes where you lose marks."
        />

        <Reveal className="mt-14">
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-space-900/40 p-6 sm:p-10">
            <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />

            {/* central node */}
            <div className="relative mx-auto flex w-fit flex-col items-center">
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/30 bg-accent/[0.08] font-mono text-lg font-bold tracking-wider text-accent-hi ring-glow"
                whileHover={{ scale: 1.05 }}
              >
                BCS
              </motion.div>
              <span className="mt-2 text-[11px] uppercase tracking-[0.2em] text-faint">central node</span>
            </div>

            {/* subjects orbit */}
            <div className="relative mt-10 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s, i) => (
                <motion.button
                  key={s.name}
                  onClick={() => setActive(active?.name === s.name ? null : s)}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${
                    active?.name === s.name
                      ? 'border-accent/40 bg-accent/[0.08]'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                  aria-pressed={active?.name === s.name}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{s.name}</span>
                    <span className="font-mono text-[10px] text-faint">+{s.topics.length}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* drill-down */}
            <AnimatePresence>
              {active && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35 }}
                  className="overflow-hidden"
                >
                  <div className="relative mt-6 rounded-2xl border border-white/10 bg-space-950/60 p-5">
                    <button
                      onClick={() => setActive(null)}
                      className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
                    >
                      <ArrowLeft size={13} /> back to subjects
                    </button>
                    <div className="text-sm font-semibold text-ink">{active.name} → topics</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {active.topics.map((t) => (
                        <span key={t} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-ink-soft">
                          {t}
                        </span>
                      ))}
                      {active.name === 'Bangla' && (
                        <span className="rounded-lg border border-cyan/25 bg-cyan/[0.06] px-3 py-1.5 text-xs text-cyan">
                          ▸ Grammar expanded: {drill.Grammar.join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
