import { motion } from 'framer-motion'
import { BrainCircuit, Target, Timer, MemoryStick, LineChart, ShieldCheck, Cpu, Rocket } from 'lucide-react'

const engines = [
  { icon: BrainCircuit, title: 'AI Diagnostic Engine', body: 'Understands where you are right now across every subject.' },
  { icon: Target, title: 'AI Planning Engine', body: 'Builds the roadmap, backward from your exam date.' },
  { icon: Cpu, title: 'Adaptive Question Engine', body: 'Selects the next best question for your ability.' },
  { icon: Rocket, title: 'AI Tutor', body: 'Explains difficult concepts in a way you actually retain.' },
  { icon: MemoryStick, title: 'Memory Engine', body: 'Schedules reviews against your forgetting curve.' },
  { icon: LineChart, title: 'Performance Engine', body: 'Analyzes every attempt into a signal, not a score.' },
  { icon: Timer, title: 'Exam Simulator', body: 'Replicates realistic examination conditions and timing.' },
  { icon: ShieldCheck, title: 'Readiness Engine', body: 'Estimates true exam preparedness — not just practice scores.' },
]

export default function AIEngine() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">AI engine</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          Ten engines. <span className="text-gradient-accent font-display">One operating system.</span>
        </h1>
        <p className="mt-4 text-muted">
          9Th-Grade AI composes specialized engines into a single system that plans, teaches, tests, and revises.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {engines.map((e, i) => (
          <motion.div
            key={e.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-colors hover:border-white/20"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet/20 bg-violet/[0.08] text-violet">
              <e.icon size={18} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-ink">{e.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{e.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
