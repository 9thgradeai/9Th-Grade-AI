import type { Frame } from '../universe.types'
import { glow, light } from '../drawUtils'
import { HUES } from '../palette'

/* ============================================================
   The singularity — visible when timeline.singularity > 0.
   Fades as the cosmic blast takes over.
   ============================================================ */

export function drawSingularity(frame: Frame): void {
  const { ctx, w, h, time, intensity, timeline, core } = frame
  const strength = timeline.singularity
  if (strength <= 0.01) return

  const x = core.x * w
  const y = core.y * h

  glow(ctx, x, y, 3 + strength * 7, '79,124,255', 0.9 * strength * intensity)
  light(ctx, x, y, 1.2, '255,255,255', strength * intensity)

  // Compressed orbiting dust
  const n = 6
  for (let i = 0; i < n; i++) {
    const ang = time * 2.2 + (i / n) * Math.PI * 2
    const rad = 2.5 + (i % 3) * 2
    light(
      ctx,
      x + Math.cos(ang) * rad,
      y + Math.sin(ang) * rad * 0.7,
      0.5,
      HUES[i % HUES.length],
      0.5 * strength * intensity,
    )
  }
}
