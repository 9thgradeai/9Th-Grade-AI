import { describe, it, expect } from 'vitest'
import { computeTestResult } from '../lib/score'

describe('Grading', () => {
  const makeQuestion = (overrides = {}) => ({
    questionId: 'q1',
    subjectId: 's1',
    subjectName: 'Math',
    topicId: 't1',
    topicName: 'Algebra',
    difficulty: 2,
    targetSeconds: 30,
    ...overrides,
  })

  it('computes correct score for all-correct', () => {
    const questions = [makeQuestion(), makeQuestion({ questionId: 'q2' })]
    const attempts = [
      { questionId: 'q1', selectedIndex: 0, correct: true, timeSpentSeconds: 20, confidence: 4 },
      { questionId: 'q2', selectedIndex: 1, correct: true, timeSpentSeconds: 25, confidence: 3 },
    ]
    const result = computeTestResult(questions, attempts, 50)
    expect(result.correct).toBe(2)
    expect(result.total).toBe(2)
    expect(result.score).toBe(100)
    expect(result.accuracy).toBe(100)
  })

  it('computes score with mixed correct/incorrect', () => {
    const questions = [makeQuestion(), makeQuestion({ questionId: 'q2' })]
    const attempts = [
      { questionId: 'q1', selectedIndex: 0, correct: true, timeSpentSeconds: 20, confidence: 4 },
      { questionId: 'q2', selectedIndex: 0, correct: false, timeSpentSeconds: 60, confidence: 2 },
    ]
    const result = computeTestResult(questions, attempts, 50)
    expect(result.correct).toBe(1)
    expect(result.total).toBe(2)
    expect(result.score).toBe(50)
  })

  it('attributes losses to subjects and topics', () => {
    const questions = [
      makeQuestion({ subjectId: 's1', topicName: 'Algebra' }),
      makeQuestion({ questionId: 'q2', subjectId: 's2', subjectName: 'English', topicName: 'Grammar' }),
    ]
    const attempts = [
      { questionId: 'q1', selectedIndex: 0, correct: false, timeSpentSeconds: 20, confidence: 3 },
      { questionId: 'q2', selectedIndex: 0, correct: false, timeSpentSeconds: 20, confidence: 3 },
    ]
    const result = computeTestResult(questions, attempts, 50)
    expect(result.losses['s1']).toBe(2)
    expect(result.losses['s2']).toBe(2)
    expect(result.targetTopicId).toBe('t1')
  })
})
