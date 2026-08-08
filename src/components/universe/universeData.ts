import type { Subject, Topic } from '@/lib/types'
import type { ConstellationNode, UniverseData } from './universe.types'
import { makeRng, rngPick, rngRange } from './seeded'
import { HUES } from './palette'

/* ============================================================
   Data → universe mapping.
   Mastery becomes light, accuracy becomes stability, retention
   becomes orbit strength, and low-mastery topics become subtle
   gravitational anomalies that weaken as mastery improves.
   Pure mock data for now — the same shape a backend would feed.
   ============================================================ */

export interface DataItem {
  id: string
  label: string
  mastery: number
  accuracy: number
  retention: number
  hue?: string
  children?: DataItem[]
}

function layout(items: DataItem[]): ConstellationNode[] {
  const rng = makeRng('data-layout')
  const n = items.length
  return items.map((it, i) => {
    const ang = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2
    const rad = 0.26 + rngRange(rng, -0.02, 0.02)
    const nx = 0.5 + Math.cos(ang) * rad
    const ny = 0.5 + Math.sin(ang) * rad * 0.7
    const hue = it.hue ?? rngPick(rng, HUES)
    const children = it.children?.map((c) => {
      const cang = rngRange(rng, 0, Math.PI * 2)
      const crad = 0.05 + rngRange(rng, 0, 0.02)
      return {
        id: c.id,
        label: c.label,
        x: nx + Math.cos(cang) * crad,
        y: ny + Math.sin(cang) * crad,
        r: 1.8 + (c.mastery / 100) * 1.6,
        mastery: c.mastery,
        accuracy: c.accuracy,
        retention: c.retention,
        hue,
      } satisfies ConstellationNode
    })
    return {
      id: it.id,
      label: it.label,
      x: nx,
      y: ny,
      r: 3.4 + (it.mastery / 100) * 2.2,
      mastery: it.mastery,
      accuracy: it.accuracy,
      retention: it.retention,
      hue,
      children,
    }
  })
}

function collectAnomalies(
  nodes: ConstellationNode[],
  out: UniverseData['anomalies'],
): void {
  for (const n of nodes) {
    if (n.mastery < 55) {
      const strength = Math.min(1, (55 - n.mastery) / 55)
      out.push({ x: n.x, y: n.y, strength, radius: 0.08 + strength * 0.06 })
    }
    if (n.children) collectAnomalies(n.children, out)
  }
}

export function buildData(
  items: DataItem[],
  opts: { readiness?: number; activity?: number } = {},
): UniverseData {
  const nodes = layout(items)
  const anomalies: UniverseData['anomalies'] = []
  collectAnomalies(nodes, anomalies)
  return {
    nodes,
    anomalies,
    readiness: opts.readiness ?? 71,
    activity: opts.activity ?? 0.6,
  }
}

/** Dashboard — a ring of subjects around the AI core. */
export function subjectsToData(subjects: Subject[]): UniverseData {
  const items: DataItem[] = subjects.map((s) => ({
    id: s.id,
    label: s.name,
    mastery: s.mastery,
    accuracy: s.accuracy,
    retention: s.retention,
  }))
  return buildData(items)
}

/** Subject page — one subject central, its topics as children. */
export function topicsToData(subject: Subject, topics: Topic[]): UniverseData {
  const items: DataItem[] = [
    {
      id: subject.id,
      label: subject.name,
      mastery: subject.mastery,
      accuracy: subject.accuracy,
      retention: subject.retention,
      children: topics.map((t) => ({
        id: t.id,
        label: t.name,
        mastery: t.mastery,
        accuracy: t.accuracy,
        retention: t.retention,
      })),
    },
  ]
  return buildData(items)
}
