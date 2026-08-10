import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { LinkButton } from '@/components/ui'

const credibility = ['BCS', 'Bangladesh Bank AD', '9th Grade', 'Adaptive Practice', 'AI Strategy']

/** Signature brand reveal: point of light → ring → constellation → identity. */
function BrandReveal() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500)
    const t2 = setTimeout(() => setPhase(2), 1400)
    const t3 = setTimeout(() => setPhase(3), 2300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  return (
    <div className="relative flex h-40 items-center justify-center sm:h-48" aria-hidden="true">
      {/* phase 0: point of light */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            key="p0"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [0, 1.6, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="h-3 w-3 rounded-full bg-accent-hi shadow-[0_0_30px_6px_rgba(79,124,255,0.6)]"
          />
        )}
      </AnimatePresence>

      {/* phase 1: ring */}
      <AnimatePresence>
        {phase >= 1 && phase < 3 && (
          <motion.svg
            key="ring"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.8 }}
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="absolute"
          >
            <circle cx="60" cy="60" r="48" fill="none" stroke="url(#brg)" strokeWidth="1.6" />
            <circle cx="60" cy="60" r="48" fill="none" stroke="#4f7cff" strokeWidth="0.6" opacity="0.4" />
            <circle cx="60" cy="18" r="3" fill="#22d3ee" />
            <circle cx="22" cy="42" r="3" fill="#4f7cff" />
            <circle cx="98" cy="42" r="3" fill="#8b5cf6" />
            <circle cx="60" cy="102" r="3" fill="#22d3ee" />
            <defs>
              <radialGradient id="brg" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#4f7cff" />
                <stop offset="60%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </radialGradient>
            </defs>
          </motion.svg>
        )}
      </AnimatePresence>

      {/* phase 3: identity */}
      {phase === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center gap-3 font-semibold tracking-tight text-ink"
        >
          <span className="text-gradient-accent text-2xl">9Th-Grade</span>
          <span className="text-2xl">AI</span>
        </motion.div>
      )}
    </div>
  )
}

export function Hero() {
  return (
    <section
     
      className="relative flex min-h-screen flex-col justify-center overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-space-950 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-32 text-center sm:px-6">
        <BrandReveal />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl"
        >
          Your preparation.
          <br />
          <span className="text-gradient font-display">Engineered by intelligence.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.9, duration: 0.7 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
        >
          9Th-Grade AI is your AI-powered command center for BCS, Bangladesh Bank AD, and competitive
          government examinations in Bangladesh.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.2, duration: 0.7 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
          <LinkButton to="/onboarding" size="lg" iconRight={<ArrowRight size={16} />}>
            Build My Preparation System
          </LinkButton>
          <LinkButton to="/exams" size="lg" variant="outline" icon={<PlayCircle size={16} />}>
            Explore 9Th-Grade AI
          </LinkButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.6, duration: 0.8 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-faint"
        >
          {credibility.map((c, i) => (
            <span key={c} className="flex items-center gap-3">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-faint/60" />}
              <span className="uppercase tracking-[0.18em]">{c}</span>
            </span>
          ))}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-space-950 to-transparent" />
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4 }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-faint"
      >
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <motion.rect
            x="1" y="1" width="14" height="20" rx="7"
            stroke="currentColor" strokeWidth="1.5"
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2.4 }}
          />
          <motion.circle
            cx="8" cy="6" r="2" fill="currentColor"
            animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}
          />
        </svg>
      </motion.div>
    </section>
  )
}
