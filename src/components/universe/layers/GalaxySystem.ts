import type { Frame, GalaxyKind, GalaxyPoint } from '../universe.types'
import type { RNG } from '../seeded'
import { rngRange } from '../seeded'
import { rgba } from '../palette'
import { glow } from '../drawUtils'

/* ============================================================
   Procedural galaxies — spiral / elliptical / irregular.
   Point clouds built deterministically once, then rendered with
   continuous rotation. Galaxies breathe with the universe rhythm.
   ============================================================ */

export function buildGalaxyPoints(
  kind: GalaxyKind,
  count: number,
  rng: RNG,
  arms: number,
): GalaxyPoint[] {
  const pts: GalaxyPoint[] = []
  for (let i = 0; i < count; i++) {
    let a: number
    let r: number
    let size: number
    let alpha: number

    if (kind === 'spiral') {
      const arm = Math.floor(rng() * arms)
      const armOffset = (arm / arms) * Math.PI * 2
      r = Math.pow(rng(), 0.7)
      const spread = 0.18 + r * 0.3
      a = armOffset + r * 6 + rngRange(rng, -spread, spread)
      size = 0.5 + rng() * 1.4
      alpha = 0.25 + rng() * 0.6 * (1 - r * 0.6)
    } else if (kind === 'elliptical') {
      const g = Math.abs(rng() + rng() + rng() - 1.5)
      r = Math.min(1, g / 1.8)
      a = rng() * Math.PI * 2
      size = 0.4 + rng() * 1.2
      alpha = 0.3 + rng() * 0.55 * (1 - r)
    } else {
      const clumps = 2 + Math.floor(rng() * 2)
      const centers = Array.from({ length: clumps }, () => ({
        a: rng() * Math.PI * 2,
        r: 0.2 + rng() * 0.6,
      }))
      const c = centers[Math.floor(rng() * centers.length)]
      r = Math.min(1, c.r + rngRange(rng, 0, 0.5))
      a = c.a + rngRange(rng, -0.7, 0.7)
      size = 0.4 + rng() * 1.3
      alpha = 0.25 + rng() * 0.5
    }

    pts.push({ a, r, size, alpha })
  }
  return pts
}

export function drawGalaxies(frame: Frame): void {
  const { ctx, w, h, intensity, timeline, galaxies } = frame

  for (const g of galaxies) {
    if (g.opacity <= 0.01) continue
    const px = g.x * w
    const py = g.y * h
    const rot = g.rotation
    const cos = Math.cos(rot)
    const sin = Math.sin(rot)
    const rad = g.radius * Math.min(w, h)
    const scale = g.opacity * intensity * timeline.galaxies

    for (const p of g.points) {
      const lx = Math.cos(p.a) * p.r * rad
      const ly = Math.sin(p.a) * p.r * rad * 0.62
      const sx = px + (lx * cos - ly * sin) * g.z
      const sy = py + (lx * sin + ly * cos) * g.z
      ctx.fillStyle = rgba(g.hue, p.alpha * scale)
      ctx.beginPath()
      ctx.arc(sx, sy, Math.max(0.3, p.size * g.z), 0, Math.PI * 2)
      ctx.fill()
    }

    glow(ctx, px, py, rad * 0.2, g.hue, 0.06 * intensity * timeline.galaxies)
  }
}
