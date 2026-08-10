import { useEffect, useRef } from 'react'
import { PERF } from './StellarField'

/* ============================================================
   Dev-only performance HUD (brief §9). Shows live FPS, frame time,
   particle count, quality tier, DPR and cosmic phase. Disabled in
   production unless the app is built in dev mode AND the user opts
   in via `?hud` in the URL or `grade.hud=1` in localStorage.
   Writes textContent directly — no React state/re-render per frame.
   ============================================================ */

const HUD_ENABLED: boolean =
  import.meta.env.DEV &&
  (new URLSearchParams(window.location.search).has('hud') ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('grade.hud') === '1'))

export function PerfHud() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!HUD_ENABLED || !ref.current) return
    // Throttle the text write to ~5/s so the HUD itself never steals a frame.
    let raf = 0
    let lastWrite = 0
    const loop = (now: number) => {
      if (now - lastWrite > 200) {
        lastWrite = now
        const el = ref.current
        if (el) {
          el.textContent =
            `${PERF.hz}Hz panel · ${PERF.fps.toFixed(0)} fps · ${PERF.frameMs.toFixed(1)}ms / ${PERF.targetMs.toFixed(1)}ms target · ` +
            `${PERF.particles} pts · tier ${PERF.tier} · dpr ${PERF.dpr} · ${PERF.phase}`
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!HUD_ENABLED) return null

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed bottom-3 right-3 z-[100] rounded-md border border-white/10 bg-black/70 px-3 py-1.5 font-mono text-[11px] tracking-tight text-white/80 backdrop-blur"
    />
  )
}
