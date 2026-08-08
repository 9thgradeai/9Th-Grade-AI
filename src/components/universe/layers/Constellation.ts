import type { ConstellationNode, Frame } from '../universe.types'
import { glow, light } from '../drawUtils'
import { rgba } from '../palette'

/* ============================================================
   Knowledge constellations — visible when timeline.knowledge > 0.
   Nodes and links drawn progressively based on timeline.
   ============================================================ */

function allNodes(nodes: ConstellationNode[]): ConstellationNode[] {
  const out: ConstellationNode[] = []
  for (const n of nodes) {
    out.push(n)
    if (n.children) out.push(...allNodes(n.children))
  }
  return out
}

export function drawConstellation(frame: Frame): void {
  const { ctx, w, h, time, intensity, timeline, nodes, anomalies } = frame
  const appear = timeline.knowledge
  if (appear <= 0.01) return

  // Weakness anomalies
  for (const an of anomalies) {
    const ax = an.x * w
    const ay = an.y * h
    const rad = an.radius * Math.max(w, h) * 0.5
    const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, rad)
    g.addColorStop(0, rgba('139,92,246', 0.05 * an.strength * intensity * appear))
    g.addColorStop(1, rgba('139,92,246', 0))
    ctx.fillStyle = g
    ctx.fillRect(ax - rad, ay - rad, rad * 2, rad * 2)
  }

  const flat = allNodes(nodes)

  // Links
  for (const n of nodes) {
    if (!n.children) continue
    for (const c of n.children) {
      ctx.strokeStyle = rgba(n.hue, 0.05 * intensity * appear)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(n.x * w, n.y * h)
      ctx.lineTo(c.x * w, c.y * h)
      ctx.stroke()
    }
  }

  // Nodes
  for (const n of flat) {
    const nx = n.x * w
    const ny = n.y * h
    const bright = n.mastery / 100
    const flicker = 0.8 + 0.2 * Math.sin(time * 0.5 + nx)
    const a = (0.15 + bright * 0.6) * intensity * appear * flicker
    const r = n.r * (0.7 + bright * 0.8)
    glow(ctx, nx, ny, r * 6, n.hue, a * 0.25)
    light(ctx, nx, ny, r, n.hue, a)
  }
}
