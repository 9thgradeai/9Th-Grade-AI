import { describe, it, expect } from 'vitest'
import { scoreAttempts, BPSC_RULES } from '@/lib/scoring'

describe('Frontend scoring', () => {
  it('matches backend scoring rules', () => {
    const attempts = [
      { selectedIndex: 0, correct: true },
      { selectedIndex: 1, correct: false },
      { selectedIndex: null, correct: false },
    ]
    const result = scoreAttempts(attempts)
    expect(result.correct).toBe(1)
    expect(result.incorrect).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.raw).toBe(1)
    expect(result.negative).toBe(0.5)
    expect(result.final).toBe(0.5)
  })

  it('uses BPSC marking scheme', () => {
    expect(BPSC_RULES.correct).toBe(1)
    expect(BPSC_RULES.wrong).toBe(-0.5)
    expect(BPSC_RULES.skipped).toBe(0)
  })
})
