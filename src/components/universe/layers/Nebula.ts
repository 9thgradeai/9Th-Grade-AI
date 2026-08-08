import type { Frame } from '../universe.types'
import { rgba } from '../palette'

/* ============================================================
   Nebula atmosphere — visible from expansion onward.
   Breathing rhythm modulates opacity.
   ============================================================ */

const BLOBS = [
  { nx: 0.2, ny: 0.3, r: 0.5, hue: '79,124,255', a: 0.05, speed: 0.001 },
  { nx: 0.8, ny: 0.62, r: 0.62, hue: '139,92,246', a: 0.042, speed: 0.0008 },
  { nx: 0.5, ny: 0.85, r: 0.5, hue: '79,209,255', a: 0.036, speed: 0.0012 },
]

export function drawNebula(frame: Frame): void {
  const { ctx, w, h, time, intensity, timeline, breathAmount } = frame
  const appear = timeline.expansion + timeline.spacetime * 0.5 + timeline.stars * 0.3
  if (appear <= 0.01) return

  for (const b of BLOBS) {
    const x = (b.nx + Math.sin(time * b.speed * 60) * 0.02) * w
    const y = (b.ny + Math.cos(time * b.speed * 50) * 0.02) * h
    const rad = b.r * Math.max(w, h)
    const a = b.a * 1.8 * intensity * appear * (1 + breathAmount * 2)
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
    g.addColorStop(0, rgba(b.hue, a))
    g.addColorStop(1, rgba(b.hue, 0))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}
