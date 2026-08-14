import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { LinkButton } from '@/components/ui'
import { cn } from '@/lib/cn'

const plans = [
  {
    name: 'Explorer',
    price: 'Free',
    tag: 'Start mapping your universe',
    features: ['Diagnostic assessment', 'Basic preparation blueprint', '20 questions / day', 'Weekly AI briefing'],
    cta: 'Start free',
    highlight: true,
  },
]

export default function Pricing() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">Pricing</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          Invest in the system, <span className="text-gradient-accent font-display">not the hours.</span>
        </h1>
        <p className="mt-4 text-muted">Start free — upgrade when your preparation demands it.</p>
      </motion.div>

      <div className="mt-14 grid gap-5 lg:grid-cols-1">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              'relative flex flex-col rounded-2xl border p-7',
              p.highlight ? 'border-accent/40 bg-accent/[0.06] ring-glow' : 'border-white/8 bg-white/[0.03]',
            )}
          >
            <h3 className="text-lg font-semibold text-ink">{p.name}</h3>
            <p className="mt-1 text-xs text-faint">{p.tag}</p>
            <div className="mt-4 font-mono text-3xl font-semibold tracking-tight text-ink">{p.price}</div>
            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check size={16} className="mt-0.5 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <LinkButton to="/onboarding" variant={p.highlight ? 'primary' : 'outline'} size="md" className="mt-7" iconRight={<ArrowRight size={15} />}>
              {p.cta}
            </LinkButton>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
