import { ArrowLeft } from 'lucide-react'
import { CosmicHorizon } from '@/components/horizon'
import { LinkButton } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <CosmicHorizon variant="ambient" />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <span className="font-mono text-7xl font-bold text-gradient-accent">404</span>
        <h1 className="mt-4 text-2xl font-semibold text-ink">This region of the universe is unexplored.</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          The page you're looking for drifted out of orbit. Let's guide you back.
        </p>
        <LinkButton to="/" size="lg" className="mt-8" icon={<ArrowLeft size={16} />}>
          Return home
        </LinkButton>
      </div>
    </div>
  )
}
