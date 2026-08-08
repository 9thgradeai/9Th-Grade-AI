import { motion } from 'framer-motion'
import { BrandMark } from '@/components/navigation/Logo'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-32 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">About</span>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <BrandMark className="h-12 w-12" />
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            9Th-Grade <span className="text-gradient-accent">AI</span>
          </h1>
        </div>

        <p className="mt-8 text-lg leading-relaxed text-ink-soft">
          9Th-Grade AI exists for one reason: the best candidates in Bangladesh shouldn't lose to blind,
          unstructured preparation.
        </p>

        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted">
          <p>
            Competitive examinations like BCS, Bangladesh Bank AD, and first-class government recruitment are
            not tests of memorization alone — they are tests of <span className="text-ink">preparedness under pressure</span>.
            Traditional methods ask you to study more and hope. 9Th-Grade AI engineers a system that knows
            exactly what to study, when, and why.
          </p>
          <p>
            Every answer you give becomes a signal. Every mistake becomes a priority. Every day becomes part of
            an intelligent roadmap generated backward from your exam date.
          </p>
          <p>
            This is a preparation operating system built for Bangladesh — globally competitive in execution,
            distinctly Bangladeshi in purpose.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6">
          <p className="font-mono text-sm font-semibold tracking-wide text-accent-hi">The five questions we answer</p>
          <ul className="mt-4 grid gap-2 font-mono text-sm text-ink-soft">
            <li>01 — Where am I right now?</li>
            <li>02 — Where do I need to go?</li>
            <li>03 — What should I do today?</li>
            <li>04 — What is preventing my improvement?</li>
            <li>05 — Am I becoming exam-ready fast enough?</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
