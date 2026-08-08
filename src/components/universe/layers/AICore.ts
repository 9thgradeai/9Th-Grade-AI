import type { Frame } from '../universe.types'
import { glow, light } from '../drawUtils'
import { rgba } from '../palette'

/* ============================================================
   The AI core — visible when timeline.intelligence > 0.
   Central luminous point with orbital rings and radial pulses.
   ============================================================ */

export function drawAICore(frame: Frame): void {
  const { ctx, w, h, time, intensity, timeline, params, core, breathAmount } = frame
  if (!params.coreActive || timeline.intelligence <= 0.01) return

  const appear = timeline.intelligence
  const x = core.x * w
  const y = core.y * h
  const speed = params.coreSpeed
  const pulse = 0.8 + 0.2 * Math.sin(time * speed * 1.4)
  const base = 0.7 * intensity * appear * params.dim * (1 + breathAmount)

  glow(ctx, x, y, 35, '79,124,255', base * pulse)
  glow(ctx, x, y, 18, '200,220,255', base * pulse * 0.6)
  light(ctx, x, y, 2.2, '255,255,255', base)

  const rings = params.coreRings
  for (let i = 1; i <= rings; i++) {
    const rad = 15 + i * 13
    const tilt = 0.5 + i * 0.14
    const rot = time * (0.16 + i * 0.05) + i
    ctx.strokeStyle = rgba('139,146,171', 0.13 * base)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(x, y, rad, rad * tilt, rot, 0, Math.PI * 2)
    ctx.stroke()
    const ang = time * (0.5 + i * 0.22) * speed
    light(ctx, x + Math.cos(ang) * rad, y + Math.sin(ang) * rad * tilt, 1, '79,209,255', 0.65 * base)
  }

  const pulseAge = (time * speed * 0.5) % 1
  ctx.strokeStyle = rgba('79,124,255', 0.13 * (1 - pulseAge) * base)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(x, y, 8 + pulseAge * 34, 0, Math.PI * 2)
  ctx.stroke()
}
