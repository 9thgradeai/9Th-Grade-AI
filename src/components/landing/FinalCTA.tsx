import { ArrowRight } from 'lucide-react'
import { Reveal } from './Reveal'
import { LinkButton } from '@/components/ui'

export function FinalCTA() {
  return (
    <section
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-space-950 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
        <Reveal
          y={0}
          className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ring-glow bg-gradient-to-br from-accent/25 to-violet/25 backdrop-blur"
        >
          <span className="text-gradient-accent text-2xl font-bold">9G</span>
        </Reveal>

        <Reveal y={20}>
          <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Don't prepare <span className="text-gradient-accent font-display">blindly.</span>
          </h2>
        </Reveal>

        <Reveal y={16} delay={0.15}>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Build an AI-powered preparation system that knows where you are, where you need to go, and what you
            should do next.
          </p>
        </Reveal>

        <Reveal y={16} delay={0.3} className="mt-9 flex flex-col gap-3 sm:flex-row">
          <LinkButton to="/onboarding" size="lg" iconRight={<ArrowRight size={16} />}>
            Build My Preparation System
          </LinkButton>
          <LinkButton to="/exams" size="lg" variant="outline">
            Explore the Platform
          </LinkButton>
        </Reveal>
      </div>
    </section>
  )
}
