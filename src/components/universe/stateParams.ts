import type { StateParams, UniverseState } from './universe.types'
import { smoothstep } from './universe.types'

/* ============================================================
   State params — both state-based (for non-landing pages) and
   progress-based (for the scroll-driven landing narrative).
   ============================================================ */

export function stateParams(state: UniverseState): StateParams {
  switch (state) {
    case 'birth':
      return { coreActive: false, orbitBias: 0, constellationVisible: false, expansion: 0, dim: 1, coreRings: 0, coreSpeed: 1 }
    case 'chaos':
      return { coreActive: false, orbitBias: 0, constellationVisible: false, expansion: 0.3, dim: 1, coreRings: 0, coreSpeed: 1 }
    case 'formation':
      return { coreActive: true, orbitBias: 0.35, constellationVisible: false, expansion: 0.4, dim: 1, coreRings: 2, coreSpeed: 1 }
    case 'organization':
      return { coreActive: true, orbitBias: 0.6, constellationVisible: false, expansion: 0.2, dim: 1, coreRings: 3, coreSpeed: 1.4 }
    case 'trajectory':
      return { coreActive: true, orbitBias: 0.7, constellationVisible: true, expansion: 0.1, dim: 1, coreRings: 3, coreSpeed: 1.2 }
    case 'constellation':
      return { coreActive: true, orbitBias: 0.8, constellationVisible: true, expansion: 0, dim: 1, coreRings: 2, coreSpeed: 1 }
    case 'data':
      return { coreActive: true, orbitBias: 0.85, constellationVisible: true, expansion: 0, dim: 1, coreRings: 2, coreSpeed: 1.3 }
    case 'convergence':
      return { coreActive: true, orbitBias: 0.9, constellationVisible: true, expansion: -0.2, dim: 1, coreRings: 4, coreSpeed: 1.5 }
    case 'focus':
      return { coreActive: false, orbitBias: 0, constellationVisible: false, expansion: 0, dim: 0.35, coreRings: 0, coreSpeed: 0.5 }
    case 'results':
      return { coreActive: true, orbitBias: 0.5, constellationVisible: true, expansion: 0.1, dim: 0.9, coreRings: 2, coreSpeed: 1.1 }
  }
}

/** Progress-based params for the scroll-driven landing narrative. */
export function progressParams(progress: number): StateParams {
  const coreActive = smoothstep(0.65, 0.75, progress) > 0.1
  const constellationVisible = smoothstep(0.75, 0.85, progress) > 0.1
  const orbitBias = smoothstep(0.45, 0.85, progress) * 0.9
  const expansion = smoothstep(0.08, 0.15, progress) * 0.4 * (1 - smoothstep(0.25, 0.40, progress))
  const dim = 1
  const coreRings = coreActive ? 2 + Math.floor(smoothstep(0.75, 0.90, progress) * 2) : 0
  const coreSpeed = 1 + smoothstep(0.65, 0.85, progress) * 0.5
  return { coreActive, orbitBias, constellationVisible, expansion, dim, coreRings, coreSpeed }
}

/** How strongly the universe renders behind content. */
export function intensityForState(state: UniverseState): number {
  switch (state) {
    case 'birth': return 1
    case 'chaos': return 0.5
    case 'formation': return 0.5
    case 'organization': return 0.5
    case 'trajectory': return 0.5
    case 'constellation': return 0.5
    case 'data': return 0.65
    case 'convergence': return 1
    case 'focus': return 0.15
    case 'results': return 0.9
  }
}

export function defaultStateForMode(mode: string): UniverseState {
  switch (mode) {
    case 'landing': return 'birth'
    case 'onboarding': return 'chaos'
    case 'dashboard': return 'data'
    case 'subject': return 'constellation'
    case 'topic': return 'trajectory'
    case 'progress': return 'formation'
    case 'results': return 'results'
    default: return 'birth'
  }
}
