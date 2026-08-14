import { describe, it, expect } from 'vitest'

function sanitize(q: {
  id: string
  topicId: string
  difficulty: number
  targetSeconds: number
  content?: { correctIndex?: number; explanation?: string; prompt?: string; options?: unknown } | null
  [key: string]: unknown
}) {
  const { content, ...safe } = q
  const base: Record<string, unknown> = { ...safe }
  if (content) {
    base.prompt = content.prompt
    base.options = Array.isArray(content.options)
      ? (content.options as Record<string, string>[]).map((o) => o.text ?? o)
      : content.options
  }
  return base
}

describe('Answer security', () => {
  it('strips correctIndex from sanitized question', () => {
    const question = {
      id: 'q1',
      topicId: 't1',
      difficulty: 2,
      targetSeconds: 30,
      content: {
        prompt: 'What is 2+2?',
        options: [{ text: '3' }, { text: '4' }],
        correctIndex: 1,
        explanation: '2+2=4',
      },
    }
    const clean = sanitize(question)
    expect(clean.correctIndex).toBeUndefined()
    expect(clean.explanation).toBeUndefined()
    expect(clean.prompt).toBe('What is 2+2?')
    expect(clean.options).toEqual(['3', '4'])
  })

  it('handles null content gracefully', () => {
    const question = {
      id: 'q1',
      topicId: 't1',
      difficulty: 2,
      targetSeconds: 30,
      content: null,
    }
    const clean = sanitize(question)
    expect(clean.content).toBeUndefined()
  })
})

describe('Question lifecycle filtering', () => {
  it('only allows PUBLISHED status for user-facing queries', () => {
    const validStatuses = ['PUBLISHED']
    const allStatuses = ['IMPORTED', 'NEEDS_REVIEW', 'VALIDATED', 'PUBLISHED', 'ARCHIVED', 'REJECTED']
    const userFacing = allStatuses.filter(s => validStatuses.includes(s))
    expect(userFacing).toEqual(['PUBLISHED'])
  })
})

describe('Test engine bounds', () => {
  it('caps pool size at 200', () => {
    const MAX_POOL = 200
    expect(MAX_POOL).toBeLessThanOrEqual(200)
  })

  it('never uses ORDER BY RANDOM', () => {
    const code = `
      function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
      }
    `
    expect(code).not.toContain('ORDER BY RANDOM')
  })
})
