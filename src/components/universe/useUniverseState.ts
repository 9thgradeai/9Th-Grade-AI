import { useEffect, useRef, useState } from 'react'

/* ============================================================
   useUniverseState — computes the master scroll progress that
   drives the cosmic timeline. Returns a smoothed progress value
   with scroll velocity and content intensity.
   ============================================================ */

export interface UniverseView {
  /** 0..1 master scroll progress — the cosmic timeline */
  progress: number
  /** scroll velocity (px/ms) — for subtle effects */
  velocity: number
  /** 0..1 content-suppression intensity */
  intensity: number
}

const SMOOTH = 0.08 // low-pass filter factor (lower = more inertia)
const INTENSITY_MAP = [
  // progress range → intensity (content suppression)
  // 0.00-0.05: hero singularity — full visibility
  [0.00, 0.05, 1.0, 1.0],
  // 0.05-0.15: blast/expansion — moderate suppression
  [0.05, 0.15, 0.8, 0.5],
  // 0.15-0.45: content sections — strong suppression
  [0.15, 0.45, 0.5, 0.45],
  // 0.45-0.65: stars/galaxies — moderate
  [0.45, 0.65, 0.45, 0.6],
  // 0.65-0.85: AI/knowledge — moderate
  [0.65, 0.85, 0.6, 0.55],
  // 0.85-1.00: strategy/mastery/CTA — full visibility
  [0.85, 1.00, 0.55, 1.0],
] as const

function getIntensity(progress: number): number {
  for (const [s, e, from, to] of INTENSITY_MAP) {
    if (progress <= e) {
      const t = (progress - s) / (e - s)
      return from + (to - from) * t
    }
  }
  return 1.0
}

const INITIAL: UniverseView = { progress: 0, velocity: 0, intensity: 1 }

export function useUniverseState(): UniverseView {
  const [view, setView] = useState<UniverseView>(INITIAL)
  const smoothRef = useRef(0)
  const lastScrollRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    function compute() {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const raw = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0

      // Smooth with low-pass filter for scroll inertia
      smoothRef.current += (raw - smoothRef.current) * SMOOTH

      // Track velocity
      const now = performance.now()
      const dt = Math.max(1, now - lastTimeRef.current)
      const velocity = (window.scrollY - lastScrollRef.current) / dt
      lastScrollRef.current = window.scrollY
      lastTimeRef.current = now

      const progress = smoothRef.current
      setView({
        progress,
        velocity,
        intensity: getIntensity(progress),
      })
    }

    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [])

  return view
}
