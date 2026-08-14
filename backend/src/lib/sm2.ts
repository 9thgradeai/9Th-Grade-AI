/* ============================================================
   SM-2 spaced-repetition engine (Phase 4 — Memory).
   Implements the classic SM-2 algorithm over the RevisionItem
   state (repetition, easinessFactor, interval), plus helpers to
   seed items and compute dynamic overdue flags.
   ============================================================ */

import { prisma } from '../app'

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_EF = 1.3
const INITIAL_EF = 2.5
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export interface Sm2State {
  repetition: number
  easinessFactor: number
  interval: number
}

export interface Sm2Result extends Sm2State {
  memoryStrength: number
  nextReview: Date
}

/**
 * One SM-2 review. `quality` is the recall rating (0-5) chosen by the
 * user after attempting a review card. A rating < 3 resets the card.
 */
export function sm2(previous: Sm2State, quality: number): Sm2Result {
  const q = clamp(Math.round(quality), 0, 5)
  let { repetition, easinessFactor, interval } = previous
  easinessFactor = easinessFactor >= MIN_EF ? easinessFactor : INITIAL_EF

  if (q < 3) {
    repetition = 0
    interval = 1
  } else {
    if (repetition === 0) interval = 1
    else if (repetition === 1) interval = 6
    else interval = Math.round(interval * easinessFactor)
    repetition += 1
  }

  // EF' = EF + (0.1 − (5−q)·(0.08 + (5−q)·0.02)), floor 1.3
  easinessFactor = Math.max(MIN_EF, easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  // Display strength (0-100): blends rating with how comfortably the card
  // has grown its interval.
  const memoryStrength = Math.round(clamp((q / 5) * 100 + (easinessFactor - MIN_EF) * 15, 5, 100))

  return {
    repetition,
    easinessFactor,
    interval,
    memoryStrength,
    nextReview: new Date(Date.now() + interval * DAY_MS),
  }
}

export function isOverdue(nextReview: Date, now = Date.now()): boolean {
  return nextReview.getTime() <= now
}

/**
 * Ensure a RevisionItem exists for each topic (upsert). Used to seed the
 * schedule from diagnosis (error topics) so weak areas surface for review.
 * `forceDue` marks items due immediately (nextReview = now).
 */
export async function ensureRevisionItems(userId: string, topicIds: string[], forceDue = true): Promise<void> {
  const now = new Date()
  await prisma.$transaction(
    topicIds.map((topicId) =>
      prisma.revisionItem.upsert({
        where: { userId_topicId: { userId, topicId } },
        update: forceDue ? { nextReview: now } : {},
        create: { userId, topicId, nextReview: now, memoryStrength: 50 },
      }),
    ),
  )
}

/** Seed a user's schedule from their weakest engaged topics if empty. */
export async function ensureInitialSchedule(userId: string, examId?: string): Promise<void> {
  const count = await prisma.revisionItem.count({ where: { userId } })
  if (count > 0) return

  const weak = await prisma.userTopic.findMany({
    where: userId ? { userId, ...(examId ? { topic: { subject: { examId } } } : {}) } : {},
    orderBy: { accuracy: 'asc' },
    take: 6,
  })
  const topicIds = weak.length
    ? weak.map((ut) => ut.topicId)
    : (await prisma.topic.findMany({ take: 6, orderBy: { name: 'asc' } })).map((t) => t.id)

  if (topicIds.length) await ensureRevisionItems(userId, topicIds, true)
}
