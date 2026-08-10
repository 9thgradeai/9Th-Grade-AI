import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { LinkButton } from '@/components/ui'

export function FinalCTA() {
  return (
    <section
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-space-950 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ring-glow bg-gradient-to-br from-accent/25 to-violet/25 backdrop-blur"
        >
          <span className="text-gradient-accent text-2xl font-bold">9G</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl"
        >
          Don't prepare <span className="text-gradient-accent font-display">blindly.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg"
        >
          Build an AI-powered preparation system that knows where you are, where you need to go, and what you
          should do next.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-9 flex flex-col gap-3 sm:flex-row"
        >
          <LinkButton to="/onboarding" size="lg" iconRight={<ArrowRight size={16} />}>
            Build My Preparation System
          </LinkButton>
          <LinkButton to="/exams" size="lg" variant="outline">
            Explore the Platform
          </LinkButton>
        </motion.div>
      </div>
    </section>
  )
}
