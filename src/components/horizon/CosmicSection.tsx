/* CosmicSection — marks a page region as a semantic phase for the
   CosmicHorizon controller. It is a thin, non-rendering wrapper: it only
   registers its DOM node + phase with the nearest CosmicHorizon parent.
   Renders nothing itself. Works standalone (outside a CosmicHorizon) as a
   plain relative container. */

import { useEffect, useRef, type ReactNode } from 'react'
import { useHorizonContext } from './context'
import type { CosmicHorizonPhase } from './phases'
import { cn } from '@/lib/cn'

interface CosmicSectionProps {
  phase: CosmicHorizonPhase
  className?: string
  children: ReactNode
}

export function CosmicSection({ phase, className, children }: CosmicSectionProps) {
  const context = useHorizonContext()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !context) return
    return context.register(el, phase)
  }, [context, phase])

  return (
    <div ref={ref} data-horizon-section={phase} className={cn('relative', className)}>
      {children}
    </div>
  )
}
