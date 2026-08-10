/* StellarField — the single Canvas that owns the ambient star field.
   One preallocated, deterministic star set. A single rAF loop (cinematic
   variant only) applies slow drift, gentle cluster pull, constellation lines
   that fade in/out with the semantic phase, plus three cinematic flourishes
   that all respect prefers-reduced-motion:
     - pointer parallax (stars shift by depth, nebulas counter-shift)
     - rare shooting stars / meteors
     - soft bokeh rising from the horizon
   Ambient/static variants render one frame and stop. No React state is
   touched per frame. */

import { useEffect, useRef } from 'react'
import { FIELD, INTENSITY_SCALE, starBudget, detectQuality } from './phases'
import type {
  CosmicHorizonIntensity,
  CosmicHorizonPhase,
  CosmicHorizonVariant,
  DeviceQuality,
  FieldVisual,
  QualityTier,
} from './phases'
import { makeRng, rand } from './seeded'

interface Star {
  x: number
  y: number
  r: number
  baseAlpha: number
  color: string
  cluster: number
  anchorX: number
  anchorY: number
  depth: number
  driftPhase: number
  driftSpeed: number
  twinkle: number
}

interface Link {
  a: number
  b: number
  alpha: number
}

/* A fast diagonal streak. Position/velocity live in normalized (0..1) space
   so a resize never breaks a live meteor. */
interface Meteor {
  x: number
  y: number
  vx: number // fraction of width per second
  vy: number // fraction of height per second
  trail: number // fraction of screen behind the head
  age: number
  maxAge: number
}

/* A soft luminous speck drifting up from the horizon (drawn as a sprite). */
interface Bokeh {
  x: number
  y: number
  r: number // radius in px (unscaled by depth)
  depth: number
  speed: number // fraction of height per second, upward
  phase: number
  twinkle: number
  baseAlpha: number
}

/* A single point of a procedural galaxy, in galaxy-local cartesian space. */
interface GalaxyPoint {
  x: number
  y: number
  s: number // point radius
  al: number // per-point alpha multiplier
}

/* A procedurally generated galaxy — a slow-rotating cloud of points with a
   soft luminous core, so it reads as a galaxy rather than a random smear. */
interface Galaxy {
  kind: 'spiral' | 'elliptical'
  x: number // normalized center
  y: number
  scale: number // normalized extent
  rot: number // current rotation (radians)
  rotSpeed: number // radians / second
  alpha: number
  squash: number // y compression for elliptical
  color: readonly [number, number, number] // rgb triplet (for rgba gradients)
  pts: GalaxyPoint[]
}

const SEED = 0x9f4a17
const METEOR_SEED = SEED ^ 0x51ab
const BOKEH_SEED = SEED ^ 0xbeef
const GALAXY_SEED = SEED ^ 0x1a2b
const MAX_STARS = 220

/* Shared perf snapshot for the dev-only HUD. Written each frame by the live
   renderer; read by <PerfHud/>. Zero overhead outside of the loop. */
export const PERF: {
  fps: number
  frameMs: number
  particles: number
  tier: QualityTier
  dpr: number
  phase: CosmicHorizonPhase
  hz: number
  targetMs: number
} = { fps: 0, frameMs: 0, particles: 0, tier: 'medium', dpr: 1, phase: 'hero', hz: 60, targetMs: 16.7 }
const STAR_COLORS = ['#e8ecf6', '#7d9dff', '#cfe9ff', '#8b5cf6', '#4fd1ff']

/* Pointer parallax — star shift in px at full depth. */
const PARALLAX_X = 16
const PARALLAX_Y = 10
/* Nebula layers counter-shift handled by the parent (CosmicHorizon). */

/* Meteor pacing — rare, irregular, never two at once for long. */
const METEOR_MAX = 2
const METEOR_TRAIL = 0.16

interface StellarFieldProps {
  variant: CosmicHorizonVariant
  intensity: CosmicHorizonIntensity
  /** Live phase, mutated by the HorizonController (never a state). */
  phaseRef: { current: CosmicHorizonPhase }
  className?: string
}

export function StellarField({ variant, intensity, phaseRef, className }: StellarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animated = variant === 'cinematic' && !reduced
    const intensityMul = INTENSITY_SCALE[intensity]
    const vw = parent.clientWidth || window.innerWidth
    const vh = parent.clientHeight || window.innerHeight
    // Adaptive quality (brief §10–§11). qualityScale is the live frame-time
    // governor output; it can only step DOWN below the device's starting tier.
    const quality: DeviceQuality = detectQuality({ width: vw, height: vh, reducedMotion: reduced })
    let qualityScale = 1
    const budget = Math.min(
      MAX_STARS,
      Math.round(starBudget(vw, variant) * intensityMul * quality.starScale),
    )

    /* --- Deterministic star + link set (generated once) --- */
    const rng = makeRng(SEED)
    const stars: Star[] = new Array(budget)
    const numClusters = Math.max(2, Math.round(budget / 9))
    const clusterTops = new Array<number>(numClusters).fill(0)
    const clusterBottoms = new Array<number>(numClusters).fill(1)
    for (let i = 0; i < budget; i++) {
      const x = rng()
      const y = rng()
      const cluster = Math.floor(rng() * numClusters)
      const color = STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)] ?? STAR_COLORS[0]
      stars[i] = {
        x,
        y,
        r: rand(rng, 0.55, 1.7),
        baseAlpha: rand(rng, 0.5, 1),
        color,
        cluster,
        anchorX: x,
        anchorY: y,
        depth: rand(rng, 0.4, 1),
        driftPhase: rand(rng, 0, Math.PI * 2),
        driftSpeed: rand(rng, 0.02, 0.07),
        twinkle: rand(rng, 0.25, 0.7),
      }
      clusterTops[cluster] += x
      clusterBottoms[cluster] += y
    }
    /* Cluster centroids from member averages — anchors stars pull toward. */
    const clusterCounts = new Array<number>(numClusters).fill(0)
    for (let i = 0; i < budget; i++) clusterCounts[stars[i].cluster]++
    for (let c = 0; c < numClusters; c++) {
      if (clusterCounts[c]) {
        clusterTops[c] /= clusterCounts[c]
        clusterBottoms[c] /= clusterCounts[c]
      } else {
        clusterTops[c] = 0.5
        clusterBottoms[c] = 0.5
      }
    }
    for (let i = 0; i < budget; i++) {
      stars[i].anchorX = clusterTops[stars[i].cluster]
      stars[i].anchorY = clusterBottoms[stars[i].cluster]
    }
    /* Link consecutive members of each cluster → faint constellation chains. */
    const order = stars.map((_, i) => i).sort((a, b) => (stars[a].cluster - stars[b].cluster) || (a - b))
    const links: Link[] = []
    for (let i = 1; i < order.length; i++) {
      const a = order[i - 1]
      const b = order[i]
      if (stars[a].cluster !== stars[b].cluster) continue
      links.push({ a, b, alpha: rand(rng, 0.25, 0.5) })
    }

    /* --- Deterministic bokeh (rising lights near the horizon). --- */
    const rngB = makeRng(BOKEH_SEED)
    const BOKEH_COUNT = 26
    const bokeh: Bokeh[] = new Array(BOKEH_COUNT)
    for (let i = 0; i < BOKEH_COUNT; i++) {
      bokeh[i] = {
        x: rngB(),
        y: rand(rngB, 0.38, 0.95),
        r: rand(rngB, 3.5, 10),
        depth: rand(rngB, 0.5, 1),
        speed: rand(rngB, 0.004, 0.011),
        phase: rand(rngB, 0, Math.PI * 2),
        twinkle: rand(rngB, 0.4, 1.2),
        baseAlpha: rand(rngB, 0.12, 0.4),
      }
    }

    /* --- Procedural galaxies (deterministic, built once). --- */
    const buildGalaxyPoints = (kind: 'spiral' | 'elliptical', count: number): GalaxyPoint[] => {
      const pts: GalaxyPoint[] = new Array(count)
      for (let i = 0; i < count; i++) {
        if (kind === 'spiral') {
          const arm = Math.floor(rngG() * 3)
          const armOffset = (arm / 3) * Math.PI * 2
          const r = Math.pow(rngG(), 0.85) // dense core, sparse arms
          const a = armOffset + r * (2.2 + r * 1.7) + rand(rngG, -0.16, 0.16)
          const s = rand(rngG, 0.5, 1.4) * (1 - r * 0.4)
          pts[i] = { x: Math.cos(a) * r, y: Math.sin(a) * r, s, al: rand(rngG, 0.5, 1) * (0.35 + (1 - r) * 0.65) }
        } else {
          const r = Math.sqrt(rngG())
          const a = rngG() * Math.PI * 2
          const s = rand(rngG, 0.6, 1.3)
          pts[i] = { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.62, s, al: rand(rngG, 0.4, 0.9) * (1 - r * 0.5) }
        }
      }
      return pts
    }
    const rngG = makeRng(GALAXY_SEED)
    /* [x, y, scale, kind, color] — spread across the sky, one anchoring the
       horizon so the field reads as a universe on first paint. */
    const GALAXY_LAYOUTS: [number, number, number, 'spiral' | 'elliptical', [number, number, number]][] = [
      [0.3, 0.14, 0.15, 'spiral', [79, 124, 255]],
      [0.75, 0.3, 0.1, 'elliptical', [139, 92, 246]],
      [0.5, 0.62, 0.2, 'spiral', [79, 209, 255]],
      [0.16, 0.5, 0.08, 'elliptical', [125, 157, 255]],
    ]
    const galaxies: Galaxy[] = GALAXY_LAYOUTS.map(([x, y, scale, kind, color], i) => ({
      kind,
      x,
      y,
      scale,
      rot: rand(rngG, 0, Math.PI * 2),
      rotSpeed: rand(rngG, -0.04, 0.04),
      alpha: rand(rngG, 0.4, 0.55),
      squash: kind === 'elliptical' ? 0.62 : 1,
      color,
      pts: buildGalaxyPoints(kind, Math.round((i === 2 ? 950 : 650) * quality.galaxyScale)),
    }))

    /* --- One shared soft bokeh sprite (cheaper than a gradient per speck). --- */
    const bokehSprite = document.createElement('canvas')
    bokehSprite.width = 64
    bokehSprite.height = 64
    const bs = bokehSprite.getContext('2d')
    if (bs) {
      const sg = bs.createRadialGradient(32, 32, 0, 32, 32, 32)
      sg.addColorStop(0, 'rgba(214,232,255,0.9)')
      sg.addColorStop(0.35, 'rgba(150,190,255,0.45)')
      sg.addColorStop(1, 'rgba(150,190,255,0)')
      bs.fillStyle = sg
      bs.fillRect(0, 0, 64, 64)
    }

    /* --- Sizing / DPR --- */
    const dpr = Math.min(window.devicePixelRatio || 1, quality.dprCap)
    /* Fall back to the viewport if the parent reports 0 — the background is a
       fixed/inset-0 layer, so a 0 box at mount just means "not laid out yet".
       Without this the canvas is painted 1×1 and stays invisible until the
       next resize makes the ResizeObserver fire with a real size. */
    const readW = () => parent.clientWidth || window.innerWidth
    const readH = () => parent.clientHeight || window.innerHeight
    /* Start from 0 so the first applySize() always sizes the canvas — if we
       seeded these with the measured size, the guard below would see no change
       and leave the backing store at the default 300×150 until the next resize. */
    let width = 0
    let height = 0
    const applySize = () => {
      const w = Math.max(1, readW())
      const h = Math.max(1, readH())
      if (w !== width || h !== height) {
        width = w
        height = h
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
      }
    }
    applySize()
    /* Resize → resize the backing store and repaint. The animated rAF loop
       repaints on its own next frame, but ambient/static draw once, so repaint
       here too. Only ever called from RO / window-resize (async, after `draw`
       and `running` are defined below — no TDZ risk). */
    const resizeAndRepaint = () => {
      const before = canvas.width
      applySize()
      if (!running && canvas.width !== before) draw(performance.now() / 1000)
    }
    const ro = new ResizeObserver(resizeAndRepaint)
    ro.observe(parent)
    const onWinResize = () => resizeAndRepaint()
    window.addEventListener('resize', onWinResize, { passive: true })

    /* --- Pointer parallax (smoothed toward the live target). --- */
    let pointer = { x: 0, y: 0 } // smoothed, normalized -1..1
    const pointerTarget = { x: 0, y: 0 }
    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onPointerLeave = () => {
      pointerTarget.x = 0
      pointerTarget.y = 0
    }
    if (animated) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerleave', onPointerLeave, { passive: true })
    }

    /* --- Per-frame state (module-local, no React) --- */
    let cur: FieldVisual = { ...FIELD[phaseRef.current] }
    let raf = 0
    let visible = true
    let running = false
    let lastT = performance.now() / 1000
    /* Frame-time governor (brief §10): EMA of real frame time; if it stays
       above ~26ms (≈38fps) for a sustained window, step quality down. It can
       only reduce the field below the device's starting tier, never raise it. */
    let frameEma = 16.7
    let slowFrames = 0
    let lastNow = performance.now()
    /* Display refresh-rate detection (brief: "max fps"). rAF is capped at the
       panel's refresh rate — 60Hz screens can never present 120fps, but 120Hz
       panels can. We estimate the refresh rate from the fastest observed rAF
       cadence after a warm-up, then tune the "slow" threshold to that panel so
       the scene stays light enough to hold the full native rate without drops. */
    let refreshHz = 60
    let warmFrames = 0
    let minDt = 1e9

    /* --- Meteor scheduling (deterministic rng for pacing, time for firing). --- */
    const rngM = makeRng(METEOR_SEED)
    let meteorAt = animated ? rand(rngM, 5, 12) : Infinity
    const meteors: Meteor[] = []
    const spawnMeteor = (t: number) => {
      if (meteors.length >= METEOR_MAX) return
      const direction = rngM() < 0.5 ? 1 : -1
      const headX = rngM() * 0.8 + 0.1
      meteors.push({
        x: headX,
        y: rand(rngM, 0.05, 0.35),
        vx: direction * rand(rngM, 0.3, 0.55),
        vy: rand(rngM, 0.5, 0.85),
        trail: METEOR_TRAIL,
        age: 0,
        maxAge: rand(rngM, 0.9, 1.6),
      })
      // Schedule the next — irregular but never overlapping the tail end.
      meteorAt = t + rand(rngM, 9, 20)
    }

    const onVisibility = () => {
      const hidden = document.hidden
      if (hidden) {
        visible = false
        if (raf) {
          cancelAnimationFrame(raf)
          raf = 0
        }
        running = false
      } else {
        visible = true
        if (animated) start()
        else draw(performance.now() / 1000)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    const start = () => {
      if (running) return
      running = true
      const tick = (now: number) => {
        raf = 0
        if (!visible) {
          running = false
          return
        }
        // Real wall-clock frame time → governor.
        const realDt = Math.min(100, now - lastNow)
        lastNow = now

        // Detect the panel refresh rate from the fastest cadence after warm-up.
        warmFrames++
        if (realDt > 0 && realDt < minDt) minDt = realDt
        if (warmFrames === 90) {
          const detected = Math.round(1000 / minDt)
          if (detected >= 100) refreshHz = 120
          else if (detected >= 70) refreshHz = 90
          else refreshHz = 60
          minDt = 1e9
        }

        frameEma = frameEma * 0.9 + realDt * 0.1
        // "Slow" is relative to the panel: 60Hz→26ms, 120Hz→~13ms. Stepping the
        // scene quality down only when we're actually missing the native rate.
        const slowThreshold = (1000 / refreshHz) * 1.6
        if (frameEma > slowThreshold) {
          slowFrames++
          if (slowFrames > 45 && qualityScale > 0.6) {
            qualityScale = Math.max(0.6, qualityScale - 0.1)
            slowFrames = 0
          }
        } else {
          slowFrames = 0
        }

        draw(now / 1000)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const draw = (t: number) => {
      const dt = Math.min(0.05, Math.max(0, t - lastT))
      lastT = t

      const target = FIELD[phaseRef.current]
      // Slow exponential interpolation toward the target phase.
      cur.density += (target.density - cur.density) * 0.03
      cur.alpha += (target.alpha - cur.alpha) * 0.03
      cur.connection += (target.connection - cur.connection) * 0.03
      cur.cluster += (target.cluster - cur.cluster) * 0.03
      cur.centerGlow += (target.centerGlow - cur.centerGlow) * 0.03
      cur.galaxy += (target.galaxy - cur.galaxy) * 0.03

      // Smooth the pointer so parallax eases rather than snaps.
      if (animated) {
        pointer.x += (pointerTarget.x - pointer.x) * 0.08
        pointer.y += (pointerTarget.y - pointer.y) * 0.08
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const active = Math.min(budget, Math.round(budget * cur.density * qualityScale))

      /* Soft luminous centre (very faint backing, not a competing glow). */
      if (cur.centerGlow > 0.01) {
        const gx = width * 0.5
        const gy = height * 0.6
        const gr = width * 0.5
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
        g.addColorStop(0, `rgba(79,124,255,${0.05 * cur.centerGlow})`)
        g.addColorStop(1, 'rgba(79,124,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, width, height)
      }

      /* Depth parallax offsets (px). Near stars shift more. */
      const spx = pointer.x * PARALLAX_X
      const spy = pointer.y * PARALLAX_Y

      /* Procedural galaxies — slow-rotating clouds with a soft core, under
         the links and stars so the field keeps its star-tone. Each galaxy's
         colour is a brand token; intensity follows the semantic phase. */
      if (cur.galaxy > 0.02) {
        const gsc = Math.max(width, height) * 0.55
        for (const g of galaxies) {
          const rot = g.rot + t * g.rotSpeed
          const ca = Math.cos(rot)
          const sa = Math.sin(rot)
          const cx = g.x * width + spx * 0.5
          const cy = g.y * height + spy * 0.4
          const sc = g.scale * gsc
          const core = sc * 0.55
          const gAlpha = g.alpha * cur.galaxy * qualityScale
          const [r, gr, b] = g.color

          /* Soft luminous core — the telltale that this is a galaxy. */
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, core)
          grad.addColorStop(0, `rgba(${r},${gr},${b},${(0.14 * gAlpha).toFixed(3)})`)
          grad.addColorStop(0.6, `rgba(${r},${gr},${b},${(0.05 * gAlpha).toFixed(3)})`)
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grad
          ctx.fillRect(cx - core, cy - core, core * 2, core * 2)

          /* Points — rotate the cloud, squash elliptical axes. Batched into one
             Path2D + a single fill per galaxy: ~650 tiny beginPath/arc/fill calls
             per frame became the bottleneck at high refresh rates. Tiny squares at
             1–2px read identically to arcs. qualityScale lets the frame-time
             governor also shed galaxy points when the panel can't keep up. */
          const path = new Path2D()
          const drawCount = Math.round(g.pts.length * qualityScale)
          for (let k = 0; k < drawCount; k++) {
            const p = g.pts[k]
            const px = cx + (p.x * ca - p.y * sa) * sc
            const py = cy + (p.x * sa + p.y * ca) * sc * g.squash
            const s = p.s
            path.moveTo(px - s, py - s)
            path.rect(px - s, py - s, s * 2, s * 2)
          }
          ctx.globalAlpha = gAlpha
          ctx.fillStyle = `rgb(${r},${gr},${b})`
          ctx.fill(path)
          ctx.globalAlpha = 1
        }
      }

      /* Resolve a star's screen position (shared by links + stars). */
      const pull = cur.cluster * 0.06
      const starPos = (s: Star): [number, number] => {
        const cx = s.x + (s.anchorX - s.x) * pull
        const cy = s.y + (s.anchorY - s.y) * pull
        const drift = t * s.driftSpeed + s.driftPhase
        const px = (cx + Math.sin(drift) * 0.35 * s.depth) * width + spx * s.depth
        const py = (cy + Math.cos(drift * 0.8) * 0.3 * s.depth) * height + spy * s.depth
        return [px, py]
      }

      /* Constellation links (under the stars). */
      if (cur.connection > 0.03) {
        ctx.lineWidth = 0.6
        ctx.lineCap = 'round'
        for (const link of links) {
          if (link.a >= active || link.b >= active) continue
          const alpha = cur.connection * link.alpha * 0.5
          if (alpha <= 0.01) continue
          const [ax, ay] = starPos(stars[link.a])
          const [bx, by] = starPos(stars[link.b])
          ctx.strokeStyle = `rgba(125,157,255,${alpha})`
          ctx.beginPath()
          ctx.moveTo(ax, ay)
          ctx.lineTo(bx, by)
          ctx.stroke()
        }
      }

      /* Stars. */
      for (let i = 0; i < active; i++) {
        const s = stars[i]
        const [px, py] = starPos(s)
        const tw = reduced ? 1 : 0.82 + 0.18 * Math.sin(t * s.twinkle + s.driftPhase)
        const alpha = s.baseAlpha * cur.alpha * tw
        ctx.fillStyle = s.color
        ctx.globalAlpha = Math.min(1, alpha)
        ctx.beginPath()
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      /* Meteors (rare shooting stars) — only animate when cinematic. */
      if (animated) {
        if (t >= meteorAt) spawnMeteor(t)
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i]
          m.x += m.vx * dt
          m.y += m.vy * dt
          m.age += dt
          const off = m.x < -0.1 || m.x > 1.1 || m.y > 1.1 || m.age > m.maxAge
          if (off) {
            meteors.splice(i, 1)
            continue
          }
          const life = 1 - m.age / m.maxAge
          const hx = m.x * width
          const hy = m.y * height
          const tx = (m.x - m.vx * m.trail) * width
          const ty = (m.y - m.vy * m.trail) * height
          const grad = ctx.createLinearGradient(hx, hy, tx, ty)
          grad.addColorStop(0, `rgba(240,246,255,${0.85 * life})`)
          grad.addColorStop(0.3, `rgba(150,190,255,${0.45 * life})`)
          grad.addColorStop(1, 'rgba(150,190,255,0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(hx, hy)
          ctx.lineTo(tx, ty)
          ctx.stroke()
        }
      }

      /* Rising bokeh near the horizon — always drawn, animated only when
         cinematic (ambient/static render one frame, so a static frame here). */
      if (bs) {
        for (let i = 0; i < BOKEH_COUNT; i++) {
          const b = bokeh[i]
          if (animated) {
            b.y -= b.speed * dt
            if (b.y < 0.3) b.y = 1.02 // recycle to the base
          }
          const r = b.r * (0.7 + 0.3 * b.depth)
          const px = b.x * width + spx * b.depth * 0.6
          const py = b.y * height + spy * b.depth * 0.4
          const pulse = animated ? 0.7 + 0.3 * Math.sin(t * b.twinkle + b.phase) : 0.85
          ctx.globalAlpha = Math.min(1, b.baseAlpha * pulse * (0.6 + 0.4 * cur.density))
          ctx.drawImage(bokehSprite, px - r, py - r, r * 2, r * 2)
        }
        ctx.globalAlpha = 1
      }

      /* Dev HUD snapshot — one object write per frame, nothing else. */
      PERF.fps = frameEma > 0 ? 1000 / frameEma : 0
      PERF.frameMs = frameEma
      PERF.particles = active
      PERF.tier = quality.tier
      PERF.dpr = dpr
      PERF.phase = phaseRef.current
      PERF.hz = refreshHz
      PERF.targetMs = 1000 / refreshHz
    }

    /* Defer the animation until the browser is idle so the hero text (LCP)
       paints before the rAF loop starts consuming main-thread time on low-end
       mobile. The CSS gradient atmosphere renders behind the canvas regardless,
       so this is visually imperceptible. Static/ambient do a single deferred
       frame. Falls back to setTimeout where requestIdleCallback is absent. */
    const kickOff = () => {
      if (animated) start()
      else draw(0)
    }
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(kickOff, { timeout: 150 })
    } else {
      setTimeout(kickOff, 0)
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (animated) {
        window.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerleave', onPointerLeave)
      }
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', onWinResize)
    }
  }, [variant, intensity, phaseRef])

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}
