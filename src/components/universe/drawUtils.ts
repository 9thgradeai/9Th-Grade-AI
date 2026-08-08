import { rgba } from './palette'

/* ============================================================
   Small shared canvas primitives used by several layers.
   ============================================================ */

/** Fill a soft radial glow (halo) at x,y reaching out to `radius`. */
export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  hue: string,
  alpha: number,
): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radius, 0.01))
  g.addColorStop(0, rgba(hue, alpha))
  g.addColorStop(1, rgba(hue, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, Math.max(radius, 0.01), 0, Math.PI * 2)
  ctx.fill()
}

/** A crisp point of light with an optional soft halo. */
export function light(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  hue: string,
  alpha: number,
): void {
  ctx.fillStyle = rgba(hue, alpha)
  ctx.beginPath()
  ctx.arc(x, y, Math.max(radius, 0.01), 0, Math.PI * 2)
  ctx.fill()
}

/** A faint lens flare — two thin orthogonal streaks through a bright star. */
export function lensFlare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  hue: string,
  alpha: number,
): void {
  ctx.strokeStyle = rgba(hue, alpha)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x - size, y)
  ctx.lineTo(x + size, y)
  ctx.moveTo(x, y - size)
  ctx.lineTo(x, y + size)
  ctx.stroke()
}
