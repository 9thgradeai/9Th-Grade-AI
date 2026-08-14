import { describe, it, expect } from 'vitest'
import { validateQuestion } from '@/lib/validation'

describe('Frontend validation', () => {
  it('validates a correct question shape', () => {
    const q = validateQuestion({
      id: 'q1',
      topicId: 't1',
      prompt: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      difficulty: 2,
      targetSeconds: 30,
    })
    expect(q.id).toBe('q1')
    expect(q.options).toEqual(['3', '4', '5', '6'])
  })

  it('rejects missing required fields', () => {
    expect(() => validateQuestion({} as any)).toThrow()
  })
})
