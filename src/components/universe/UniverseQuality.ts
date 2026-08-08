import type { QualityProfile } from './universe.types'
import { QL_ULTRA, QL_HIGH, QL_MEDIUM, QL_LOW } from './universe.types'

/* ============================================================
   Adaptive quality detection + dynamic adjustment with hysteresis.
   Measures real frame times and adjusts quality level to maintain
   smooth rendering. Hysteresis prevents oscillation between levels.
   ============================================================ */

const FRAME_WINDOW = 60 // frames to average
const DOWNGRADE_THRESHOLD = 18 // ms — if avg exceeds, drop a level
const UPGRADE_THRESHOLD = 12 // ms — if avg stays below, raise a level
const UPGRADE_SUSTAIN = 240 // frames below threshold before upgrading

/** Pool/render fractions per quality level. */
const LEVEL_FRACTIONS = [1.0, 0.75, 0.5, 0.3]
const LEVEL_GALAXIES = [3, 2, 1, 1]

export function detectBaseQuality(): QualityProfile {
  const hasWin = typeof window !== 'undefined'
  const reducedMotion = hasWin && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const isMobile = hasWin && window.innerWidth < 768
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const lowPower =
    typeof navigator !== 'undefined' &&
    navigator.hardwareConcurrency != null &&
    navigator.hardwareConcurrency <= 4

  let level = QL_HIGH
  if (isMobile) level = QL_MEDIUM
  if (lowPower) level = QL_LOW
  if (reducedMotion) level = QL_LOW

  return {
    level,
    isMobile,
    reducedMotion,
    dpr,
    cursorSim: !isMobile && !reducedMotion,
    gravitySim: !isMobile && !reducedMotion,
    maxGalaxies: LEVEL_GALAXIES[level],
    staticFrame: reducedMotion,
    visible: typeof document !== 'undefined' ? !document.hidden : true,
    renderFraction: LEVEL_FRACTIONS[level],
  }
}

export class QualityTracker {
  profile: QualityProfile
  private frameTimes: number[]
  private idx = 0
  private belowCount = 0

  constructor(profile: QualityProfile) {
    this.profile = profile
    this.frameTimes = new Array(FRAME_WINDOW).fill(16.67)
  }

  /** Call once per frame with the actual frame delta in ms. */
  measure(dtMs: number): void {
    this.frameTimes[this.idx % FRAME_WINDOW] = dtMs
    this.idx++

    if (this.idx < FRAME_WINDOW) return

    let sum = 0
    for (let i = 0; i < FRAME_WINDOW; i++) sum += this.frameTimes[i]
    const avg = sum / FRAME_WINDOW

    if (avg < UPGRADE_THRESHOLD) {
      this.belowCount++
      if (this.belowCount >= UPGRADE_SUSTAIN && this.profile.level > QL_ULTRA) {
        this.adjustLevel(-1)
        this.belowCount = 0
      }
    } else {
      this.belowCount = 0
      if (avg > DOWNGRADE_THRESHOLD && this.profile.level < QL_LOW) {
        this.adjustLevel(1)
      }
    }
  }

  private adjustLevel(delta: number): void {
    const newLevel = Math.max(QL_ULTRA, Math.min(QL_LOW, this.profile.level + delta))
    if (newLevel === this.profile.level) return
    this.profile.level = newLevel
    this.profile.renderFraction = LEVEL_FRACTIONS[newLevel]
    this.profile.maxGalaxies = LEVEL_GALAXIES[newLevel]
    this.profile.gravitySim = newLevel <= QL_MEDIUM && !this.profile.reducedMotion
  }
}
