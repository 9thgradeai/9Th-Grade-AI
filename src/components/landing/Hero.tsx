import { ArrowRight, PlayCircle } from 'lucide-react'
import { LinkButton } from '@/components/ui'

const credibility = ['BCS', 'Bangladesh Bank AD', '9th Grade', 'Adaptive Practice', 'AI Strategy']

/* CSS-driven brand reveal (replaces framer-motion/AnimatePresence). The point of
   light → ring → identity sequence is now pure CSS keyframes (same scale/fade
   mechanics), compressed so the hero text paints at first idle instead of after
   a 2.5s JS-driven delay. */
function BrandReveal() {
  return (
    <div className="relative flex h-40 items-center justify-center sm:h-48" aria-hidden="true">
      {/* point of light */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="g-brand-point h-3 w-3 rounded-full bg-accent-hi shadow-[0_0_30px_6px_rgba(79,124,255,0.6)]" />
      </div>

      {/* ring */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="g-brand-ring">
          <circle cx="60" cy="60" r="48" fill="none" stroke="url(#brg)" strokeWidth="1.6" />
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
        </svg>
      </div>

      {/* identity */}
      <div
        className="g-brand-identity flex items-center gap-3 font-semibold tracking-tight text-ink"
        style={{ '--enter-delay': '0.5s' } as React.CSSProperties}
      >
        <span className="text-gradient-accent text-2xl">9Th-Grade</span>
        <span className="text-2xl">AI</span>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-space-950 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-24 pt-32 text-center sm:px-6">
        <BrandReveal />

        <h1
          className="g-enter mt-8 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl"
          style={{ '--enter-delay': '0.6s' } as React.CSSProperties}
        >
          Your preparation.
          <br />
          <span className="text-gradient font-display">Engineered by intelligence.</span>
        </h1>

        <p
          className="g-enter mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          style={{ '--enter-delay': '0.75s' } as React.CSSProperties}
        >
          9Th-Grade AI is your AI-powered command center for BCS, Bangladesh Bank AD, and competitive
          government examinations in Bangladesh.
        </p>

        <div
          className="g-enter mt-9 flex flex-col gap-3 sm:flex-row"
          style={{ '--enter-delay': '0.85s' } as React.CSSProperties}
        >
          <LinkButton to="/onboarding" size="lg" iconRight={<ArrowRight size={16} />}>
            Build My Preparation System
          </LinkButton>
          <LinkButton to="/exams" size="lg" variant="outline" icon={<PlayCircle size={16} />}>
            Explore 9Th-Grade AI
          </LinkButton>
        </div>

        <div
          className="g-enter mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-faint"
          style={{ '--enter-delay': '0.95s' } as React.CSSProperties}
        >
          {credibility.map((c, i) => (
            <span key={c} className="flex items-center gap-3">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-faint/60" />}
              <span className="uppercase tracking-[0.18em]">{c}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-space-950 to-transparent" />
      <div
        aria-hidden="true"
        className="g-enter pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-faint"
        style={{ '--enter-delay': '1.1s' } as React.CSSProperties}
      >
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
          <rect className="g-scroll-hint-rect" x="1" y="1" width="14" height="20" rx="7" stroke="currentColor" strokeWidth="1.5" />
          <circle className="g-scroll-hint-dot" cx="8" cy="6" r="2" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
