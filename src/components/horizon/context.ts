/* Horizon context — kept separate from components so Fast Refresh is happy
   and so CosmicSection can consume it without importing the orchestrator. */

import { createContext, useContext } from 'react'
import type { CosmicHorizonPhase } from './phases'

export interface HorizonRegistration {
  el: HTMLElement
  phase: CosmicHorizonPhase
}

export interface HorizonContextValue {
  register: (el: HTMLElement, phase: CosmicHorizonPhase) => () => void
}

export const HorizonContext = createContext<HorizonContextValue | null>(null)

export function useHorizonContext(): HorizonContextValue | null {
  return useContext(HorizonContext)
}
