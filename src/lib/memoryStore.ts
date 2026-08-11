import type { RevisionItem } from '@/lib/types'

/* ============================================================
   Local memory ledger — bridges a difficult practice question to
   the revision surface (Practice → Mistake → Save → Memory → Review).

   Items saved here are merged into `api.getRevisionItems()`, so they
   surface in the Memory page (Due today) and the dashboard mission.
   This is client-local until the backend revision write API is wired;
   no fabricated official data is stored.
   ============================================================ */

const KEY = 'grade.memory'

export function listMemoryItems(): RevisionItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RevisionItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Add (or refresh) a memory item for a topic. New items start weak and due. */
export function addMemoryItem(topic: string, subject = 'Saved from results'): RevisionItem {
  const item: RevisionItem = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    topic,
    subject,
    memoryStrength: 40,
    lastReviewed: 'Just now',
    nextReview: 'Today',
    overdue: true,
  }
  const existing = listMemoryItems()
  // Avoid duplicates for the same topic.
  const next = [...existing.filter((i) => i.topic !== topic), item]
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable — ignore */
  }
  return item
}

export function removeMemoryItem(topic: string): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(listMemoryItems().filter((i) => i.topic !== topic)))
  } catch {
    /* ignore */
  }
}
