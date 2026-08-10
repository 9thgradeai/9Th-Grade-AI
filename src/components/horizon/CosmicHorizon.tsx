/* Cosmic Horizon — the public visual system.
   Layers:
     - Atmosphere  (CSS gradients — deep space + nebula accents)
     - StellarField (one Canvas — ambient stars)
     - Horizon     (CSS luminous boundary)
   A lightweight controller maps page scroll to the active semantic phase,
   driving the horizon's position/opacity (Framer Motion) and the nebula
   accents (direct style writes, smoothed by CSS transitions).

   Variants:
     cinematic — full landing experience, scroll-driven, pulse.
     ambient   — quiet authenticated background, no scroll animation.
     static    — a single still frame for hero cards.

   Never sets React state per frame; the canvas and DOM are driven through
   refs and MotionValues. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { StellarField } from './StellarField'
import { HorizonContext, type HorizonRegistration } from './context'
import { ATMOSPHERE } from './phases'
import type {
  CosmicHorizonIntensity,
  CosmicHorizonPhase,
  CosmicHorizonVariant,
} from './phases'
import { cn } from '@/lib/cn'

const DEFAULT_CLASS: Record<CosmicHorizonVariant, string> = {
  cinematic: 'fixed inset-0 -z-10',
  ambient: 'absolute inset-0',
  static: 'absolute inset-0',
}

interface CosmicHorizonProps {
  variant?: CosmicHorizonVariant
  intensity?: CosmicHorizonIntensity
  className?: string
}

export function CosmicHorizon({
  variant = 'cinematic',
  intensity = 'default',
  className,
}: CosmicHorizonProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const spaceRef = useRef<HTMLDivElement>(null)
  const nebulaRef = useRef<HTMLDivElement>(null)
  const accentBlueRef = useRef<HTMLDivElement>(null)
  const accentVioletRef = useRef<HTMLDivElement>(null)
  const horizonStrengthRef = useRef<HTMLDivElement>(null)

  const sections = useRef<HorizonRegistration[]>([])

  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const cinematic = variant === 'cinematic' && !reduced

  const phaseRef = useRef<CosmicHorizonPhase>(cinematic ? 'hero' : 'mastery')

  /* --- Register semantic sections (children call CosmicSection). --- */
  const register = useCallback((el: HTMLElement, phase: CosmicHorizonPhase) => {
    const list = sections.current
    if (list.some((s) => s.el === el)) return () => {}
    list.push({ el, phase })
    list.sort((a, b) => a.el.offsetTop - b.el.offsetTop)
    return () => {
      sections.current = sections.current.filter((s) => s.el !== el)
    }
  }, [])

  /* --- Apply a phase to the CSS atmosphere layers. --- */
  const applyPhase = useCallback((phase: CosmicHorizonPhase) => {
    if (phaseRef.current === phase) return
    phaseRef.current = phase
    rootRef.current?.setAttribute('data-horizon-phase', phase)
    const a = ATMOSPHERE[phase]
    if (accentBlueRef.current) accentBlueRef.current.style.opacity = String(a.accentBlue)
    if (accentVioletRef.current) accentVioletRef.current.style.opacity = String(a.accentViolet)
    if (horizonStrengthRef.current) {
      horizonStrengthRef.current.style.opacity = String(0.5 + a.horizon * 0.5)
    }
  }, [])

  /* --- Detect the active phase from section positions (cinematic only). --- */
  const updatePhase = useCallback(() => {
    if (!cinematic) return
    const center = window.innerHeight / 2
    let active: CosmicHorizonPhase = sections.current[0]?.phase ?? 'hero'
    for (const s of sections.current) {
      const r = s.el.getBoundingClientRect()
      if (r.top <= center) active = s.phase
      else break
    }
    applyPhase(active)
  }, [cinematic, applyPhase])

  const updatePhaseRef = useRef(updatePhase)
  updatePhaseRef.current = updatePhase

  /* Resize / late-mount refresh so the active phase stays correct even when
     a section grows (e.g. SyllabusUniverse) without any scroll happening. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => updatePhaseRef.current())
    ro.observe(root)
    updatePhaseRef.current()
    return () => ro.disconnect()
  }, [])

  /* --- Pointer parallax (cinematic): far layers counter-shift so the star
       field reads as floating in front of the nebulas. Written to the
       `translate`/`transform` properties directly (never React state);
       blue/violet use `translate` so it composes with their CSS drift. --- */
  useEffect(() => {
    if (!cinematic) return
    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1
      ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      tx = 0
      ty = 0
    }
    const tick = () => {
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      const space = spaceRef.current
      const neb = nebulaRef.current
      const blue = accentBlueRef.current
      const violet = accentVioletRef.current
      if (space) space.style.transform = `translate3d(${(-cx * 4).toFixed(2)}px, ${(-cy * 3).toFixed(2)}px, 0)`
      if (neb) neb.style.transform = `translate3d(${(-cx * 8).toFixed(2)}px, ${(-cy * 6).toFixed(2)}px, 0)`
      if (blue) blue.style.translate = `${(-cx * 6).toFixed(2)}px ${(-cy * 4).toFixed(2)}px`
      if (violet) violet.style.translate = `${(-cx * 12).toFixed(2)}px ${(-cy * 8).toFixed(2)}px`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [cinematic])

  /* --- Macro motion (cinematic): horizon travel + nebula intensity. --- */
  const { scrollYProgress } = useScroll()
  const scrollSpring = useSpring(scrollYProgress, { stiffness: 40, damping: 20, mass: 0.5 })
  const horizonTop = useTransform(scrollSpring, [0, 1], ['64%', '12%'])
  const horizonOpacity = useTransform(scrollSpring, [0, 0.35, 0.8, 1], [0.3, 0.55, 0.75, 0.82])
  const nebulaOpacity = useTransform(scrollSpring, [0, 1], [0.18, 0.5])

  useMotionValueEvent(scrollYProgress, 'change', () => updatePhaseRef.current())

  const horizonStyle = cinematic
    ? { top: horizonTop, opacity: horizonOpacity }
    : { top: '68%', opacity: 0.42 }

  const staticPhase = cinematic ? undefined : 'mastery'

  return (
    <HorizonContext.Provider value={{ register }}>
      <div
        ref={rootRef}
        aria-hidden="true"
        data-horizon-phase={cinematic ? 'hero' : staticPhase}
        className={cn(
          'pointer-events-none overflow-hidden',
          DEFAULT_CLASS[variant],
          cinematic && 'hx-animate',
          className,
        )}
      >
        {/* Layer 1 — deep-space atmosphere */}
        <div ref={spaceRef} className="hx-space absolute" />

        {/* Layer 3 — base nebula (scroll-driven intensity) */}
        <motion.div ref={nebulaRef} className="hx-nebula" style={cinematic ? { opacity: nebulaOpacity } : { opacity: 0.14 }} />

        {/* Layer 3 — phase-tinted nebula accents */}
        <div ref={accentBlueRef} className="hx-nebula-blue" />
        <div ref={accentVioletRef} className="hx-nebula-violet" />

        {/* Layer 2 — sparse stellar field (single canvas) */}
        <StellarField
          variant={variant}
          intensity={intensity}
          phaseRef={phaseRef}
          className="absolute inset-0 h-full w-full"
        />

        {/* Layer 3 — the horizon. Outer wrapper: scroll-driven position/opacity;
            inner .hx-horizon-strength: phase-driven intensity (CSS transition). */}
        <motion.div className="hx-horizon" style={horizonStyle}>
          <div ref={horizonStrengthRef} className="hx-horizon-strength">
            <div className="hx-horizon-glow" />
            <div className="hx-horizon-field" />
            <div className="hx-horizon-core" />
            <div className="hx-horizon-focus" />
          </div>
        </motion.div>

        {/* Layer 4 — cinematic framing: vignette (focus the eye) + film grain
            (kills banding, adds texture). Pointer-events off, under content. */}
        <div className="hx-vignette" />
        <div className="hx-grain" aria-hidden="true" />
      </div>
    </HorizonContext.Provider>
  )
}
