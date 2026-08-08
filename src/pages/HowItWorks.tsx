import { motion } from 'framer-motion'
import { Radar, Target, Zap, Gauge, RefreshCw, TrendingUp } from 'lucide-react'

const steps = [
  { icon: Radar, title: 'Diagnose', body: 'A diagnostic assessment maps your baseline across every subject — not a guess, a measurement.' },
  { icon: Target, title: 'Strategize', body: 'The AI builds a personalized roadmap, working backward from your exam date.' },
  { icon: Zap, title: 'Execute', body: 'Every day begins with a clear mission: exactly what to study, practice, and revise.' },
  { icon: Gauge, title: 'Measure', body: 'Every interaction — speed, accuracy, retention — becomes a signal in your performance model.' },
  { icon: RefreshCw, title: 'Adapt', body: 'Your plan recalculates as you improve, shifting time toward your largest scoring opportunities.' },
  { icon: TrendingUp, title: 'Improve', body: 'The loop repeats until you are exam-ready. Not by chance — by system.' },
]

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">Methodology</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          How 9Th-Grade AI <span className="text-gradient-accent font-display">engineers your preparation.</span>
        </h1>
        <p className="mt-4 text-muted">
          Not another question bank. A closed preparation loop that turns every answer into a better plan.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-6"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/[0.08] text-accent-hi">
              <s.icon size={18} />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
