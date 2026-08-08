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
    highlight: false,
  },
  {
    name: 'Strategist',
    price: '৳499/mo',
    tag: 'For serious aspirants',
    features: ['Full adaptive practice', 'Personalized daily mission', 'Memory engine & revision', 'Performance intelligence', 'Unlimited AI tutor', 'Mock simulations'],
    cta: 'Build my system',
    highlight: true,
  },
  {
    name: 'Commander',
    price: '৳899/mo',
    tag: 'Complete command center',
    features: ['Everything in Strategist', 'Rank & percentile tracking', 'Priority weak-topic targeting', '1:1 AI strategy reviews', 'Exam-readiness trajectory'],
    cta: 'Take command',
    highlight: false,
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
        <p className="mt-4 text-muted">Plans shown for illustration. Start free — upgrade when your preparation demands it.</p>
      </motion.div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
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
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-violet px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Recommended
              </span>
            )}
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
