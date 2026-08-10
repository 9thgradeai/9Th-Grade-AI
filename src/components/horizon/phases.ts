/* Cosmic Horizon — semantic phases, variants and per-phase visual config.
   The background narrates "uncertainty → clarity" across the landing page.
   Every rendering layer reads its target from these tables; the phase is
   the only thing the scroll controller writes. */

export type CosmicHorizonPhase =
  | 'hero'
  | 'ai-engine'
  | 'adaptive-practice'
  | 'analytics'
  | 'strategy'
  | 'mastery'

export type CosmicHorizonVariant = 'cinematic' | 'ambient' | 'static'

export type CosmicHorizonIntensity = 'subtle' | 'default' | 'elevated'

/* Adaptive graphics quality (brief §10–§11). The cosmic renderer scales its
   star/galaxy budgets and DPR cap to the device so it stays smooth on mobile
   while never reducing the core visual narrative. */
export type QualityTier = 'ultra' | 'high' | 'medium' | 'low' | 'minimal'

export interface DeviceQuality {
  tier: QualityTier
  /** Multiplier on the star budget. */
  starScale: number
  /** Multiplier on galaxy point counts. */
  galaxyScale: number
  /** Cap on devicePixelRatio used for the backing store. */
  dprCap: number
}

export function detectQuality(opts: {
  width: number
  height: number
  reducedMotion: boolean
}): DeviceQuality {
  const { width, height, reducedMotion } = opts
  const area = width * height
  // Best-effort capability signals (not available everywhere — fall back gracefully).
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  const memory = (nav as { deviceMemory?: number } | undefined)?.deviceMemory
  const cores = nav?.hardwareConcurrency
  const dpr = (nav as { devicePixelRatio?: number } | undefined)?.devicePixelRatio ?? 1

  // Accessibility always wins (brief §12).
  if (reducedMotion || area < 360 * 640) {
    return { tier: 'minimal', starScale: 0.5, galaxyScale: 0.35, dprCap: 1 }
  }

  const strong =
    (memory === undefined || memory >= 4) && (cores === undefined || cores >= 8) && dpr >= 2
  const weak = area < 820 * 720 || (cores !== undefined && cores <= 2) || (memory !== undefined && memory <= 1)

  if (weak) return { tier: 'low', starScale: 0.7, galaxyScale: 0.6, dprCap: 1.5 }
  if (strong && area >= 1400 * 800) return { tier: 'ultra', starScale: 1.2, galaxyScale: 1.15, dprCap: 2 }
  if (strong) return { tier: 'high', starScale: 1, galaxyScale: 1, dprCap: 2 }
  return { tier: 'medium', starScale: 0.85, galaxyScale: 0.8, dprCap: 2 }
}

/* Shared, order-preserving list (also the default narrative order). */
export const PHASE_ORDER: readonly CosmicHorizonPhase[] = [
  'hero',
  'ai-engine',
  'adaptive-practice',
  'analytics',
  'strategy',
  'mastery',
]

/* Intensity → global multiplier on how much the field announces itself. */
export const INTENSITY_SCALE: Record<CosmicHorizonIntensity, number> = {
  subtle: 0.7,
  default: 1,
  elevated: 1.3,
}

/* Star budget by viewport width, before intensity is applied. */
export function starBudget(width: number, variant: CosmicHorizonVariant): number {
  const base =
    width < 640 ? 55 : width < 1024 ? 95 : 150
  if (variant === 'ambient' || variant === 'static') {
    return Math.round(base * 0.45)
  }
  return base
}

/* Stellar field behaviour per phase. All values 0..1; the canvas lerps
   toward these so state changes are gradual rather than abrupt. */
export interface FieldVisual {
  /** Multiplier on star count drawn (density rises as knowledge forms). */
  density: number
  /** Base star opacity. */
  alpha: number
  /** How strongly constellation lines are drawn between neighbouring stars. */
  connection: number
  /** How much stars pull toward their cluster centroid (organization). */
  cluster: number
  /** Soft luminous centre near the horizon. */
  centerGlow: number
  /** How strongly the procedural galaxies announce themselves. */
  galaxy: number
}

export const FIELD: Record<CosmicHorizonPhase, FieldVisual> = {
  hero: { density: 0.6, alpha: 0.62, connection: 0, cluster: 0, centerGlow: 0.2, galaxy: 0.5 },
  'ai-engine': { density: 0.7, alpha: 0.7, connection: 0.32, cluster: 0.06, centerGlow: 0.3, galaxy: 0.7 },
  'adaptive-practice': { density: 0.8, alpha: 0.76, connection: 0.42, cluster: 0.32, centerGlow: 0.36, galaxy: 0.85 },
  analytics: { density: 0.85, alpha: 0.8, connection: 0.68, cluster: 0.5, centerGlow: 0.42, galaxy: 0.95 },
  strategy: { density: 0.9, alpha: 0.85, connection: 0.82, cluster: 0.6, centerGlow: 0.46, galaxy: 1 },
  mastery: { density: 0.85, alpha: 0.82, connection: 0.5, cluster: 0.55, centerGlow: 0.6, galaxy: 0.9 },
}

/* CSS atmosphere behaviour per phase. These are written to layer styles
   by the controller on phase change (smoothly, via CSS transitions). */
export interface AtmosphereVisual {
  /** Opacity of the blue/cyan nebula accent. */
  accentBlue: number
  /** Opacity of the violet nebula accent. */
  accentViolet: number
  /** Horizon glow intensity (independent of its scroll position). */
  horizon: number
}

export const ATMOSPHERE: Record<CosmicHorizonPhase, AtmosphereVisual> = {
  hero: { accentBlue: 0, accentViolet: 0, horizon: 0.5 },
  'ai-engine': { accentBlue: 0.5, accentViolet: 0, horizon: 0.7 },
  'adaptive-practice': { accentBlue: 0.4, accentViolet: 0.16, horizon: 0.78 },
  analytics: { accentBlue: 0.32, accentViolet: 0.38, horizon: 0.85 },
  strategy: { accentBlue: 0.3, accentViolet: 0.32, horizon: 0.9 },
  mastery: { accentBlue: 0.46, accentViolet: 0.2, horizon: 0.92 },
}

/* Which star colours dominate each phase (brand tokens). */
export const PHASE_TINTS: Record<CosmicHorizonPhase, readonly [string, string]> = {
  hero: ['#7d9dff', '#4fd1ff'],
  'ai-engine': ['#4f7cff', '#4fd1ff'],
  'adaptive-practice': ['#4f7cff', '#4fd1ff'],
  analytics: ['#4f7cff', '#8b5cf6'],
  strategy: ['#7d9dff', '#8b5cf6'],
  mastery: ['#7d9dff', '#4fd1ff'],
}
