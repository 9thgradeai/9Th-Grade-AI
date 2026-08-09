import type { UniverseMode } from '@/lib/types'
import type {
  BlackHole,
  Camera,
  CosmicTimeline,
  Frame,
  Galaxy,
  LayerConfig,
  UniverseData,
  UniverseState,
  Wave,
} from './universe.types'
import {
  PS_DORMANT, PS_EXPANDING, PS_DRIFTING, PS_ORBITING, PS_STAR,
} from './universe.types'
import { linterp } from './universe.types'
import { detectBaseQuality, QualityTracker } from './UniverseQuality'
import { createNoise2D } from './noise'
import { makeRng, rngPick, rngRange } from './seeded'
import { HUES, WARM, NEUTRAL } from './palette'
import { stateParams } from './stateParams'
import { playBlastSound, playWaveSound } from './sound'
import { buildGalaxyPoints, drawGalaxies } from './layers/GalaxySystem'
import { drawStarField } from './layers/StarField'
import { drawCosmicDust } from './layers/CosmicDust'
import { drawNebula } from './layers/Nebula'
import { drawBlackHoles } from './layers/BlackHole'
import { drawSingularity } from './layers/Singularity'
import { drawParticleField } from './layers/ParticleField'
import { stepGravity, drawGravitationalField } from './layers/GravitationalField'
import { stepWaves, drawCosmicWaves } from './layers/CosmicWave'
import { drawAICore } from './layers/AICore'
import { drawConstellation } from './layers/Constellation'
import { defaultStateForMode } from './stateParams'

/* ============================================================
   Per-mode tuning.
   ============================================================ */

const MODE_CONFIG: Record<UniverseMode, LayerConfig> = {
  landing:    { poolSize: 2000, galaxies: 3, blackHoles: 2, heroStarFraction: 0.008, starFraction: 0.35, dim: 1, speed: 1, expansion: 0.35, centralCore: true, connections: true },
  onboarding: { poolSize: 1000, galaxies: 1, blackHoles: 0, heroStarFraction: 0.005, starFraction: 0.3,  dim: 0.9, speed: 1, expansion: 0.2, centralCore: true, connections: true },
  dashboard:  { poolSize: 1200, galaxies: 1, blackHoles: 1, heroStarFraction: 0.006, starFraction: 0.3,  dim: 0.85, speed: 1, expansion: 0.1, centralCore: true, connections: true },
  subject:    { poolSize: 800,  galaxies: 1, blackHoles: 0, heroStarFraction: 0.005, starFraction: 0.25, dim: 0.9, speed: 1, expansion: 0.08, centralCore: true, connections: true },
  topic:      { poolSize: 500,  galaxies: 0, blackHoles: 0, heroStarFraction: 0.004, starFraction: 0.2,  dim: 1, speed: 1, expansion: 0.05, centralCore: true, connections: false },
  progress:   { poolSize: 1000, galaxies: 1, blackHoles: 0, heroStarFraction: 0.005, starFraction: 0.3,  dim: 0.8, speed: 1, expansion: 0.05, centralCore: true, connections: true },
  results:    { poolSize: 1200, galaxies: 1, blackHoles: 1, heroStarFraction: 0.006, starFraction: 0.3,  dim: 0.9, speed: 1, expansion: 0.15, centralCore: true, connections: true },
}

/* ==========================================================
   TIMELINE — all formation values derived from scroll progress.
   Each value is 0..1, continuously interpolated, reversible.
   ========================================================== */

function computeTimeline(progress: number): CosmicTimeline {
  return {
    progress,
    singularity:   1 - smoothstep(0.03, 0.10, progress), // fades as explosion begins
    explosion:     smoothstep(0.06, 0.10, progress) * (1 - smoothstep(0.10, 0.20, progress)),
    expansion:     smoothstep(0.08, 0.15, progress) * (1 - smoothstep(0.25, 0.40, progress)),
    spacetime:     smoothstep(0.20, 0.30, progress) * (1 - smoothstep(0.40, 0.55, progress)),
    matter:        smoothstep(0.30, 0.40, progress) * (1 - smoothstep(0.50, 0.65, progress)),
    stars:         smoothstep(0.40, 0.55, progress) * (1 - smoothstep(0.60, 0.75, progress)),
    galaxies:      smoothstep(0.50, 0.65, progress) * (1 - smoothstep(0.70, 0.85, progress)),
    intelligence:  smoothstep(0.65, 0.75, progress) * (1 - smoothstep(0.85, 0.95, progress)),
    knowledge:     smoothstep(0.75, 0.85, progress) * (1 - smoothstep(0.92, 1.00, progress)),
    strategy:      smoothstep(0.85, 0.92, progress) * (1 - smoothstep(0.95, 1.00, progress)),
    mastery:       smoothstep(0.90, 1.00, progress),
  }
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* ==========================================================
   CAMERA — position/zoom derived from scroll progress.
   ========================================================== */

function computeCamera(progress: number, time: number, noise: (x: number, y: number) => number): Camera {
  // Zoom evolution through the cosmic journey
  const zoom = linterp(progress, 0.00, 0.10, 1.15, 0.90)
    * linterp(progress, 0.10, 0.25, 1, 0.85)
    * linterp(progress, 0.25, 0.45, 1, 1.15)
    * linterp(progress, 0.45, 0.55, 1, 0.75)
    * linterp(progress, 0.55, 0.75, 1, 1.25)
    * linterp(progress, 0.75, 0.85, 1, 1.15)
    * linterp(progress, 0.85, 1.00, 1, 0.80)

  const driftPhase = time * 0.015
  const x = noise(driftPhase * 0.3, 0) * 20 + linterp(progress, 0, 1, -10, 10)
  const y = noise(0, driftPhase * 0.3) * 20 + linterp(progress, 0, 1, -5, 15)
  const rotation = noise(driftPhase * 0.05, 200) * 0.0002

  return { x, y, zoom, rotation, targetX: x, targetY: y, targetZoom: zoom, driftPhase: 0 }
}

/* ==========================================================
   CONTROLLER
   ========================================================== */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export interface UniverseController {
  resize(w: number, h: number): void
  setState(s: UniverseState): void
  setIntensity(v: number): void
  setProgress(p: number): void
  setData(d: UniverseData | null): void
  setCursor(x: number, y: number): void
  setVisible(visible: boolean): void
  wave(x: number, y: number, opts?: { duration?: number; radius?: number; hue?: string; strength?: number }): void
  supernova(x: number, y: number): void
  destroy(): void
  getStats(): { fps: number; frameTime: number; particleCount: number; qualityLevel: number; progress: number; time: number }
}

export function createUniverseController(opts: {
  canvas: HTMLCanvasElement
  mode: UniverseMode
}): UniverseController {
  const { canvas, mode } = opts
  const maybeCtx = canvas.getContext('2d')
  if (!maybeCtx) throw new Error('2D canvas context unavailable')
  const ctx: CanvasRenderingContext2D = maybeCtx
  const cfg = MODE_CONFIG[mode]

  let quality = detectBaseQuality()
  const tracker = new QualityTracker(quality)
  let w = 0, h = 0
  let raf = 0, running = true
  let last = performance.now()

  /* ---------- State ---------- */
  let state: UniverseState = defaultStateForMode(mode)
  let intensity = 1
  let scroll = 0
  let time = 0
  let breathPhase = 0

  /* ---------- Screen shake + flash ---------- */
  let shakeX = 0, shakeY = 0, shakeIntensity = 0
  let flashAlpha = 0
  let blastTriggered = false

  /* ---------- Cached per-size gradients (avoid rebuilding each frame) ---------- */
  let vignette: CanvasGradient | null = null

  /* ---------- Noise ---------- */
  const noise = createNoise2D(42)

  /* ---------- Camera ---------- */
  const camera: Camera = { x: 0, y: 0, zoom: 1, rotation: 0, targetX: 0, targetY: 0, targetZoom: 1, driftPhase: 0 }

  /* ---------- Particle Pool ---------- */
  let poolSize = Math.round(cfg.poolSize * (quality.isMobile ? 0.42 : 1))
  let pool = createPool(poolSize)

  function createPool(n: number) {
    return {
      count: n,
      px: new Float32Array(n), py: new Float32Array(n),
      vx: new Float32Array(n), vy: new Float32Array(n),
      size: new Float32Array(n), alpha: new Float32Array(n),
      depth: new Float32Array(n), phase: new Float32Array(n),
      freq: new Float32Array(n), hueIdx: new Uint8Array(n),
      state: new Int32Array(n), seed: new Float32Array(n),
      prevX: new Float32Array(n), prevY: new Float32Array(n),
    }
  }

  /* ---------- World objects ---------- */
  let galaxies: Galaxy[] = []
  let blackHoles: BlackHole[] = []
  const waves: Wave[] = []
  let data: UniverseData | null = null
  const core = { x: 0.5, y: 0.55 }

  /* ---------- Events ---------- */
  let nextEventTime = 40 + Math.random() * 50
  const activeEvents: { x: number; y: number; born: number; duration: number }[] = []

  /* ---------- Cursor ---------- */
  const cursor = { x: -9999, y: -9999 }

  /* ---------- Debug ---------- */
  let fps = 0, frameTime = 0, frameCount = 0, fpsAccum = 0

  /* ==========================================================
     INITIALIZATION
     ========================================================== */

  function seed() {
    const rng = makeRng(mode)
    const p = pool
    for (let i = 0; i < p.count; i++) {
      p.px[i] = rng() * w
      p.py[i] = rng() * h
      p.vx[i] = 0
      p.vy[i] = 0
      p.depth[i] = rng()
      p.phase[i] = rng() * Math.PI * 2
      p.freq[i] = 0.3 + rng() * 2.0
      p.hueIdx[i] = Math.floor(rng() * HUES.length)
      p.seed[i] = rng()
      p.prevX[i] = 0
      p.prevY[i] = 0

      const frac = i / p.count
      if (frac < cfg.heroStarFraction) {
        p.size[i] = 1.2 + rng() * 1.8
        p.alpha[i] = 0.7 + rng() * 0.3
      } else if (frac < cfg.starFraction) {
        p.size[i] = 0.4 + rng() * 1.0
        p.alpha[i] = 0.3 + rng() * 0.5
      } else if (frac < cfg.starFraction + 0.12) {
        p.size[i] = 0.3 + rng() * 0.6
        p.alpha[i] = 0.15 + rng() * 0.3
      } else {
        p.size[i] = 0.5 + rng() * 1.3
        p.alpha[i] = 0.2 + rng() * 0.5
      }
      // All start DORMANT — timeline will activate them based on progress
      p.state[i] = PS_DORMANT
    }

    // Galaxies
    const galN = Math.min(cfg.galaxies, quality.maxGalaxies)
    galaxies = Array.from({ length: galN }, (_, i) => {
      const kinds: readonly Galaxy['kind'][] = ['spiral', 'elliptical', 'irregular']
      const kind = kinds[i % kinds.length]
      const count = Math.round((kind === 'spiral' ? 900 : 600) * (quality.isMobile ? 0.42 : 1))
      const rRng = makeRng(mode + '_gal_' + i)
      return {
        x: rngRange(rRng, 0.14, 0.86),
        y: rngRange(rRng, 0.16, 0.84),
        z: 0.5 + rRng() * 0.5,
        kind,
        radius: rngRange(rRng, 0.12, 0.2),
        arms: 2 + Math.floor(rRng() * 2),
        rotation: 0,
        rotSpeed: rngRange(rRng, 0.004, 0.012) * (rRng() < 0.5 ? -1 : 1),
        phase: rRng() * Math.PI * 2,
        hue: rngPick(rRng, HUES),
        opacity: 0,
        baseOpacity: 0.5 + rRng() * 0.4,
        seed: Math.floor(rRng() * 1e9),
        points: buildGalaxyPoints(kind, count, makeRng(i + 101), 2 + Math.floor(rRng() * 2)),
      }
    })

    // Black holes
    const bhRng = makeRng(mode + '_bh')
    blackHoles = Array.from({ length: cfg.blackHoles }, () => ({
      x: bhRng() < 0.5 ? rngRange(bhRng, 0.06, 0.22) : rngRange(bhRng, 0.78, 0.94),
      y: rngRange(bhRng, 0.2, 0.8),
      radius: rngRange(bhRng, 6, 11),
      influence: Math.max(w, h) * rngRange(bhRng, 0.14, 0.2),
      strength: rngRange(bhRng, 2600, 3600),
      hue: rngPick(bhRng, HUES),
      diskRotation: 0,
      diskParticles: Array.from({ length: Math.round(40 * (quality.isMobile ? 0.42 : 1)) }, () => ({
        angle: bhRng() * Math.PI * 2,
        radius: rngRange(bhRng, 1.2, 3.4),
        alpha: 0.3 + bhRng() * 0.6,
        size: 0.5 + bhRng() * 1,
        speed: rngRange(bhRng, 0.02, 0.07),
      })),
    }))
  }

  /* ==========================================================
     TIMELINE LOOP — scroll-driven macro state.
     ========================================================== */

  let timeline: CosmicTimeline = computeTimeline(0)

  function updateTimeline(_dt: number) {
    const tl = timeline
    const p = pool
    const cx = core.x * w
    const cy = core.y * h

    // Blast trigger — fire once when explosion peaks
    if (tl.explosion > 0.8 && !blastTriggered) {
      blastTriggered = true
      shakeIntensity = 12 // strong shake
      flashAlpha = 0.7 // bright flash
      playBlastSound()
      // Activate ALL dormant particles with blast velocity
      for (let i = 0; i < p.count; i++) {
        if (p.state[i] === PS_DORMANT) {
          const dx = p.px[i] - cx
          const dy = p.py[i] - cy
          const dist = Math.hypot(dx, dy) + 1
          const angle = Math.atan2(dy, dx) + (p.seed[i] - 0.5) * 0.8
          const depthFactor = 0.3 + p.depth[i] * 0.7
          const baseSpeed = (8 + dist * 0.02) * depthFactor * (0.6 + p.seed[i] * 0.8)
          p.vx[i] = Math.cos(angle) * baseSpeed
          p.vy[i] = Math.sin(angle) * baseSpeed
          p.state[i] = PS_EXPANDING
          p.prevX[i] = p.px[i]
          p.prevY[i] = p.py[i]
        }
      }
    }
    if (tl.explosion <= 0.1) blastTriggered = false

    // Particle state transitions based on timeline (REVERSIBLE)
    for (let i = 0; i < p.count; i++) {
      const frac = i / p.count
      const seed = p.seed[i]

      // Hero stars: become PS_STAR when stars timeline > 0.3
      if (frac < cfg.heroStarFraction) {
        if (tl.stars > 0.3 && p.state[i] !== PS_STAR) {
          p.state[i] = PS_STAR
          p.vx[i] = 0; p.vy[i] = 0
        } else if (tl.stars <= 0.3 && p.state[i] === PS_STAR) {
          p.state[i] = PS_DORMANT
        }
        continue
      }

      // Regular stars: become PS_STAR when stars > 0.5
      if (frac < cfg.starFraction) {
        if (tl.stars > 0.5 && p.state[i] !== PS_STAR) {
          p.state[i] = PS_STAR
          p.vx[i] = 0; p.vy[i] = 0
        } else if (tl.stars <= 0.5 && p.state[i] === PS_STAR) {
          p.state[i] = PS_DORMANT
        }
        continue
      }

      // Dust: become DRIFTING when expansion > 0.1
      if (frac < cfg.starFraction + 0.12) {
        if (tl.expansion > 0.1 && p.state[i] === PS_DORMANT) {
          p.state[i] = PS_DRIFTING
          // Give initial outward velocity
          const dx = p.px[i] - cx
          const dy = p.py[i] - cy
          const angle = Math.atan2(dy, dx) + (seed - 0.5) * 0.5
          const speed = 2 + seed * 3
          p.vx[i] = Math.cos(angle) * speed
          p.vy[i] = Math.sin(angle) * speed
        } else if (tl.expansion <= 0.1 && p.state[i] === PS_DRIFTING) {
          p.state[i] = PS_DORMANT
          p.vx[i] = 0; p.vy[i] = 0
        }
        continue
      }

      // Field particles: activate during explosion, settle during expansion
      if (tl.explosion > 0.5 && p.state[i] === PS_DORMANT) {
        // Blast: shoot outward
        const dx = p.px[i] - cx
        const dy = p.py[i] - cy
        const dist = Math.hypot(dx, dy) + 1
        const angle = Math.atan2(dy, dx) + (seed - 0.5) * 0.8
        const depthFactor = 0.3 + p.depth[i] * 0.7
        const baseSpeed = (6 + dist * 0.015) * depthFactor * (0.6 + seed * 0.8)
        p.vx[i] = Math.cos(angle) * baseSpeed
        p.vy[i] = Math.sin(angle) * baseSpeed
        p.state[i] = PS_EXPANDING
        p.prevX[i] = p.px[i]
        p.prevY[i] = p.py[i]
      } else if (tl.expansion > 0.3 && p.state[i] === PS_EXPANDING) {
        // Settling: decelerate
        p.vx[i] *= 0.98
        p.vy[i] *= 0.98
        if (Math.hypot(p.vx[i], p.vy[i]) < 0.1) {
          p.state[i] = PS_DRIFTING
        }
      } else if (tl.expansion <= 0.1 && p.state[i] === PS_DRIFTING) {
        // Rewind: contract back
        p.state[i] = PS_EXPANDING
        const dx = cx - p.px[i]
        const dy = cy - p.py[i]
        const dist = Math.hypot(dx, dy) + 1
        p.vx[i] = (dx / dist) * 3
        p.vy[i] = (dy / dist) * 3
      } else if (tl.explosion <= 0.1 && p.state[i] === PS_EXPANDING) {
        // Fully rewound
        p.state[i] = PS_DORMANT
        p.vx[i] = 0; p.vy[i] = 0
      }
    }

    // Galaxy opacity from timeline
    for (const g of galaxies) {
      g.opacity = g.baseOpacity * tl.galaxies * intensity
    }

    // Camera from progress
    const newCam = computeCamera(tl.progress, time, noise)
    camera.targetX = newCam.x
    camera.targetY = newCam.y
    camera.targetZoom = newCam.zoom
    camera.rotation = newCam.rotation
  }

  /* ==========================================================
     SIMULATION LOOP — time-driven ambient motion.
     ========================================================== */

  function stepSimulation(dt: number) {
    const s = dt * 60
    const p = pool
    const breath = Math.sin(breathPhase) * 0.03
    const breathDrift = 1 + breath
    const nt = time * 0.08

    // Screen shake decay
    if (shakeIntensity > 0.01) {
      shakeX = (Math.random() - 0.5) * shakeIntensity
      shakeY = (Math.random() - 0.5) * shakeIntensity
      shakeIntensity *= 0.92 // exponential decay
    } else {
      shakeX = 0; shakeY = 0; shakeIntensity = 0
    }

    // Flash decay
    if (flashAlpha > 0.001) {
      flashAlpha *= 0.94
    } else {
      flashAlpha = 0
    }

    // Camera smooth interpolation
    camera.x += (camera.targetX - camera.x) * 0.04
    camera.y += (camera.targetY - camera.y) * 0.04
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.04

    // Gravity
    if (quality.gravitySim) {
      stepGravity(buildFrame())
    }

    // Particle physics — only active particles
    for (let i = 0; i < p.count; i++) {
      const st = p.state[i]
      if (st === PS_DORMANT || st === PS_ORBITING) continue

      const d = p.depth[i]
      const depthMul = 0.05 + d * 0.95

      if (st === PS_STAR) {
        // Stars drift very slowly
        p.px[i] += noise(p.px[i] * 0.002 + p.seed[i], p.py[i] * 0.002 + time * 0.01) * 0.025 * s
        p.py[i] += noise(p.px[i] * 0.002 + p.seed[i] + 50, p.py[i] * 0.002 + time * 0.01 + 50) * 0.025 * s
        wrap(p, i)
        continue
      }

      // DRIFTING / EXPANDING
      // Noise turbulence — increased for more visible motion
      const turbAmp = 0.12 * depthMul * breathDrift
      p.vx[i] += noise(p.px[i] * 0.003 + p.seed[i], p.py[i] * 0.003 + nt) * turbAmp * s
      p.vy[i] += noise(p.px[i] * 0.003 + p.seed[i] + 100, p.py[i] * 0.003 + nt + 100) * turbAmp * s

      // Cursor gravity
      if (quality.cursorSim) {
        const dx = cursor.x - p.px[i]
        const dy = cursor.y - p.py[i]
        const d2 = dx * dx + dy * dy
        if (d2 > 1 && d2 < 160 * 160) {
          const dist = Math.sqrt(d2)
          const pull = (1 - dist / 160) * 0.0004
          p.vx[i] += (dx / dist) * pull * d
          p.vy[i] += (dy / dist) * pull * d
        }
      }

      // Integrate
      p.px[i] += p.vx[i] * s
      p.py[i] += p.vy[i] * s

      // Damping for DRIFTING
      if (st === PS_DRIFTING) {
        p.vx[i] *= 0.998
        p.vy[i] *= 0.998
      }

      // Clamp
      const sp = Math.hypot(p.vx[i], p.vy[i])
      if (sp > 0.8) {
        p.vx[i] = (p.vx[i] / sp) * 0.8
        p.vy[i] = (p.vy[i] / sp) * 0.8
      }

      wrap(p, i)
    }

    // Galaxy rotation (always forward)
    for (const g of galaxies) {
      g.rotation += g.rotSpeed * s * 0.016
    }

    // Black hole disk rotation
    for (const bh of blackHoles) {
      bh.diskRotation += 0.003 * s
      for (const dp of bh.diskParticles) {
        dp.angle += dp.speed * s * (1.2 - dp.radius * 0.15)
      }
    }

    // Waves
    stepWaves(buildFrame())
    for (let i = waves.length - 1; i >= 0; i--) {
      if (time - waves[i].born > waves[i].duration) waves.splice(i, 1)
    }

    // Cosmic events
    for (let i = activeEvents.length - 1; i >= 0; i--) {
      if (time - activeEvents[i].born > activeEvents[i].duration) activeEvents.splice(i, 1)
    }
    if (timeline.progress > 0.3 && time > nextEventTime) {
      scheduleEvent()
      nextEventTime = time + 30 + Math.random() * 60
    }

    // Breathing
    breathPhase += dt * 0.025
  }

  function wrap(p: ReturnType<typeof createPool>, i: number) {
    const m = 12
    if (p.px[i] < -m) p.px[i] = w + m
    else if (p.px[i] > w + m) p.px[i] = -m
    if (p.py[i] < -m) p.py[i] = h + m
    else if (p.py[i] > h + m) p.py[i] = -m
  }

  /* ==========================================================
     EVENTS
     ========================================================== */

  function scheduleEvent() {
    const x = Math.random() * w
    const y = Math.random() * h
    activeEvents.push({ x, y, born: time, duration: 2 })
    playWaveSound()
    waves.push({
      x, y, born: time,
      duration: 2,
      maxRadius: Math.max(w, h) * 0.4,
      hue: NEUTRAL,
      strength: 0.3,
    })
  }

  /* ==========================================================
     FRAME BUILDER
     ========================================================== */

  function buildFrame(): Frame {
    const breath = Math.sin(breathPhase) * 0.03
    return {
      ctx, w, h, time,
      quality, intensity, state,
      params: stateParams(state),
      cursor, expansion: scroll,
      timeline,
      camera, pool, galaxies, blackHoles, waves,
      nodes: data ? data.nodes : [],
      anomalies: data ? data.anomalies : [],
      data, core,
      breathPhase, breathAmount: breath,
    }
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  function render() {
    ctx.clearRect(0, 0, w, h)

    // Screen shake — translate canvas
    if (shakeIntensity > 0.1) {
      ctx.save()
      ctx.translate(shakeX, shakeY)
    }

    // Depth vignette — cached, rebuilt only when the canvas size changes
    ctx.fillStyle = vignette ?? 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, w, h)

    const fr = buildFrame()
    drawNebula(fr)
    drawGalaxies(fr)
    drawStarField(fr)
    drawCosmicDust(fr)
    drawGravitationalField(fr)
    drawBlackHoles(fr)
    drawSingularity(fr)
    drawAICore(fr)
    drawConstellation(fr)
    drawParticleField(fr)
    drawCosmicWaves(fr)

    // Blast flash — bright radial glow at center
    if (flashAlpha > 0.01) {
      const fg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6)
      fg.addColorStop(0, `rgba(200,220,255,${flashAlpha * 0.8})`)
      fg.addColorStop(0.15, `rgba(120,180,255,${flashAlpha * 0.5})`)
      fg.addColorStop(0.4, `rgba(79,124,255,${flashAlpha * 0.2})`)
      fg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = fg
      ctx.fillRect(0, 0, w, h)
    }

    if (shakeIntensity > 0.1) {
      ctx.restore()
    }
  }

  /* ==========================================================
     LOOP
     ========================================================== */

  function tick(now: number) {
    if (!running) return
    const dt = clamp((now - last) / 1000, 0.001, 0.05)
    last = now
    time += dt
    frameCount++
    fpsAccum += dt
    if (fpsAccum >= 1) {
      fps = Math.round(frameCount / fpsAccum)
      frameTime = Math.round((fpsAccum / frameCount) * 1000)
      frameCount = 0
      fpsAccum = 0
    }
    tracker.measure(dt * 1000)

    if (!quality.reducedMotion) {
      updateTimeline(dt) // scroll-driven macro
      stepSimulation(dt) // time-driven micro
    }
    render()
    raf = requestAnimationFrame(tick)
  }

  function start() {
    if (quality.staticFrame) { render(); return }
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  function resize(nw: number, nh: number) {
    w = Math.max(1, nw)
    h = Math.max(1, nh)
    quality = detectBaseQuality()
    canvas.width = Math.round(w * quality.dpr)
    canvas.height = Math.round(h * quality.dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(quality.dpr, 0, 0, quality.dpr, 0, 0)
    // Rebuild the cached vignette gradient for the new size
    const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.28)')
    vignette = vg
    poolSize = Math.round(cfg.poolSize * (quality.isMobile ? 0.42 : 1))
    pool = createPool(poolSize)
    seed()
    if (quality.staticFrame) render()
  }

  function setState(s: UniverseState) { state = s }
  function setIntensity(v: number) { intensity = clamp(v, 0, 1) }
  function setProgress(p: number) { scroll = clamp(p, 0, 1); timeline = computeTimeline(scroll) }
  function setCursor(x: number, y: number) { cursor.x = x; cursor.y = y }
  function setData(d: UniverseData | null) { data = d }

  function setVisible(visible: boolean) {
    quality = { ...quality, visible }
    if (quality.staticFrame) return
    if (visible && !running) {
      running = true; last = performance.now(); raf = requestAnimationFrame(tick)
    } else if (!visible && running) {
      running = false; cancelAnimationFrame(raf)
    }
  }

  function wave(x: number, y: number, opts?: { duration?: number; radius?: number; hue?: string; strength?: number }) {
    waves.push({
      x, y, born: time,
      duration: opts?.duration ?? 1.6,
      maxRadius: opts?.radius ?? Math.max(w, h) * 0.5,
      hue: opts?.hue ?? WARM,
      strength: opts?.strength ?? 0.5,
    })
  }

  function supernova(x: number, y: number) {
    waves.push({ x, y, born: time, duration: 0.5, maxRadius: Math.max(w, h) * 0.08, hue: WARM, strength: 0.9 })
    waves.push({ x, y, born: time + 0.15, duration: 1.6, maxRadius: Math.max(w, h) * 0.5, hue: WARM, strength: 0.6 })
    waves.push({ x, y, born: time + 0.4, duration: 2.4, maxRadius: Math.max(w, h) * 0.8, hue: '79,209,255', strength: 0.4 })
  }

  function destroy() { running = false; cancelAnimationFrame(raf) }

  function getStats() {
    return { fps, frameTime, particleCount: pool.count, qualityLevel: quality.level, progress: scroll, time }
  }

  // Initial setup
  resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight)
  start()

  return { resize, setState, setIntensity, setProgress, setData, setCursor, setVisible, wave, supernova, destroy, getStats }
}
