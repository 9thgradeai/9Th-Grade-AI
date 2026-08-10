import { motion } from 'framer-motion'
import { Reveal } from './Reveal'

const questions = [
  'What should I study today?',
  'Which topics are actually important?',
  'Why do I keep making the same mistakes?',
  'How much of the syllabus do I truly know?',
  'Can I finish before the exam?',
  'Am I improving fast enough?',
]

export function ProblemSection() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-[2.6rem]">
            Studying more isn't the same as
            <br />
            <span className="text-gradient-accent font-display">preparing better.</span>
          </h2>
          <p className="mt-4 text-muted">
            Every aspirant carries the same unanswered questions into the exam hall.
          </p>
        </Reveal>

        {/* Scattered questions, then organised */}
        <div className="relative mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {questions.map((q, i) => (
            <motion.div
              key={q}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-5"
            >
              <span className="font-mono text-[11px] text-faint">0{i + 1}</span>
              <p className="mt-2 text-[15px] leading-snug text-ink-soft">{q}</p>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.1} className="mx-auto mt-16 max-w-xl text-center">
          <p className="text-lg font-medium text-ink sm:text-xl">
            Preparing well isn't about asking these questions.
            <br />
            It's about <span className="text-accent-hi">having a system that answers them.</span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
