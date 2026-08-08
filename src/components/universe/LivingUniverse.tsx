import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { UniverseMode } from '@/lib/types'
import type { UniverseData, UniverseState } from './universe.types'
import { createUniverseController, type UniverseController } from './UniverseController'
import { cn } from '@/lib/cn'

/* ============================================================
   LivingUniverse — public entry point.
   Mounts the canvas + controller and feeds it React props.
   Two variants:
     - "fixed":   full-viewport page background (landing narrative)
     - "absolute": fills its parent (dashboard cards, pages)
   Dev-only debug overlay shows FPS, timeline progress, quality.
   ============================================================ */

interface Props {
  mode: UniverseMode
  variant?: 'fixed' | 'absolute'
  interactive?: boolean
  className?: string
  style?: CSSProperties
  state?: UniverseState
  /** 0..1 scroll progress — drives the cosmic timeline */
  progress?: number
  intensity?: number
  data?: UniverseData | null
  children?: ReactNode
}

const COSMIC_PHASES = [
  [0.00, 'SINGULARITY'],
  [0.05, 'COMPRESSION'],
  [0.08, 'IGNITION'],
  [0.10, 'COSMIC BLAST'],
  [0.15, 'EXPANSION'],
  [0.25, 'SPACETIME'],
  [0.35, 'MATTER'],
  [0.45, 'STARS'],
  [0.55, 'GALAXIES'],
  [0.65, 'BLACK HOLES'],
  [0.75, 'INTELLIGENCE'],
  [0.85, 'KNOWLEDGE'],
  [0.90, 'STRATEGY'],
  [0.95, 'MASTERY'],
] as const

const QUALITY_LABELS = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW']

function getCurrentPhase(progress: number): string {
  for (let i = COSMIC_PHASES.length - 1; i >= 0; i--) {
    if (progress >= COSMIC_PHASES[i][0]) return COSMIC_PHASES[i][1]
  }
  return 'VOID'
}

function DebugOverlay({ controller }: { controller: UniverseController | null }) {
  const [stats, setStats] = useState({ fps: 0, frameTime: 0, particleCount: 0, qualityLevel: 1, progress: 0, time: 0 })

  useEffect(() => {
    const id = setInterval(() => {
      if (controller) setStats(controller.getStats())
    }, 500)
    return () => clearInterval(id)
  }, [controller])

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 rounded-lg border border-white/10 bg-space-950/80 px-3 py-2 font-mono text-[10px] leading-relaxed text-ink-soft backdrop-blur">
      <div>FPS {stats.fps}</div>
      <div>PARTICLES {stats.particleCount}</div>
      <div>QUALITY {QUALITY_LABELS[stats.qualityLevel] ?? '?'}</div>
      <div>PHASE {getCurrentPhase(stats.progress)}</div>
      <div>PROGRESS {(stats.progress * 100).toFixed(1)}%</div>
      <div>TIME {stats.time.toFixed(1)}s</div>
    </div>
  )
}

export function LivingUniverse({
  mode,
  variant = 'absolute',
  interactive = true,
  className = '',
  style,
  state,
  progress = 0,
  intensity,
  data,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controllerRef = useRef<UniverseController | null>(null)
  const interactiveRef = useRef(interactive)
  interactiveRef.current = interactive

  const [ctrl, setCtrl] = useState<UniverseController | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const controller = createUniverseController({ canvas, mode })
    controllerRef.current = controller
    setCtrl(controller)

    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      controller.resize(Math.max(1, rect.width), Math.max(1, rect.height))
    })
    ro.observe(container)

    const onMove = (e: MouseEvent) => {
      if (!interactiveRef.current) return
      const rect = container.getBoundingClientRect()
      controller.setCursor(e.clientX - rect.left, e.clientY - rect.top)
    }
    const onLeave = () => controller.setCursor(-9999, -9999)
    const onVisibility = () => controller.setVisible(!document.hidden)

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      controller.destroy()
      ro.disconnect()
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      setCtrl(null)
    }
  }, [mode])

  useEffect(() => { if (state !== undefined) controllerRef.current?.setState(state) }, [state])
  useEffect(() => { controllerRef.current?.setProgress(progress) }, [progress])
  useEffect(() => { if (intensity !== undefined) controllerRef.current?.setIntensity(intensity) }, [intensity])
  useEffect(() => { controllerRef.current?.setData(data ?? null) }, [data])

  return (
    <>
      <div
        ref={containerRef}
        aria-hidden="true"
        style={style}
        className={cn(
          'pointer-events-none overflow-hidden',
          variant === 'fixed' ? 'fixed inset-0 -z-10' : 'absolute inset-0',
          className,
        )}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
        {children && <div className="pointer-events-none absolute inset-0">{children}</div>}
      </div>
      {import.meta.env.DEV && <DebugOverlay controller={ctrl} />}
    </>
  )
}
