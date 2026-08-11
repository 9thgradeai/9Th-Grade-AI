import type { QuestionAttempt } from '@/lib/types'

/* ============================================================
   Scoring rules — single source of truth, never hardcoded in UI.

   BPSC Preliminary (51st BCS): +1 per correct, −0.50 per wrong,
   0 for skipped/unanswered. Change the constants here and every
   surface (results, practice, mock) reflects it.
   ============================================================ */

export const BPSC_RULES = {
  correct: 1,
  wrong: -0.5,
  skipped: 0,
  /** Max score before negative marking is applied. */
  label: 'BPSC Preliminary',
} as const

export interface ScoreBreakdown {
  correct: number
  incorrect: number
  skipped: number
  /** Correct count (each = +1). */
  raw: number
  /** Marks deducted for wrong answers (absolute, positive). */
  negative: number
  /** Raw − negative. */
  final: number
}

/**
 * Compute the BPSC score breakdown from a list of question attempts.
 * A null `selectedIndex` counts as skipped.
 */
export function scoreAttempts(attempts: Pick<QuestionAttempt, 'selectedIndex' | 'correct'>[]): ScoreBreakdown {
  let correct = 0
  let incorrect = 0
  let skipped = 0

  for (const a of attempts) {
    if (a.selectedIndex === null) skipped++
    else if (a.correct) correct++
    else incorrect++
  }

  const raw = correct * BPSC_RULES.correct
  const negative = incorrect * Math.abs(BPSC_RULES.wrong)
  const final = raw - negative

  return { correct, incorrect, skipped, raw, negative, final }
}
