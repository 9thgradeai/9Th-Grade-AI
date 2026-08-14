/* ============================================================
   Lightweight runtime validation for API contracts.
   Uses TypeScript types as source of truth; adds minimal
   overhead checks for critical payloads in development.
   ============================================================ */

import type {
  User,
  Exam,
  Subject,
  Topic,
  Question,
  Performance,
  Roadmap,
  RoadmapPhase,
  DailyTask,
  RevisionItem,
  AIRecommendation,
  AIBriefing,
} from '@/lib/types'

/** Validation error thrown when response doesn't match contract. */
export class ValidationError extends Error {
  readonly field?: string
  readonly expectedType: string
  readonly received: unknown

  constructor(message: string, field?: string, expectedType?: string, received?: unknown) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.expectedType = expectedType ?? ''
    this.received = received
  }
}

/** Check if value is a non-null object. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Check if value is an array. */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/** Check string type. */
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/** Check number type. */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/** Check boolean type. */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/** Validate required string field. */
function validateString(obj: Record<string, unknown>, key: string, context: string): string {
  const value = obj[key]
  if (!isString(value)) {
    throw new ValidationError(
      `${context}: field "${key}" must be a string`,
      key,
      'string',
      value
    )
  }
  return value
}

/** Validate required number field. */
function validateNumber(obj: Record<string, unknown>, key: string, context: string): number {
  const value = obj[key]
  if (!isNumber(value)) {
    throw new ValidationError(
      `${context}: field "${key}" must be a number`,
      key,
      'number',
      value
    )
  }
  return value
}

/** Validate required boolean field. */
function validateBoolean(obj: Record<string, unknown>, key: string, context: string): boolean {
  const value = obj[key]
  if (!isBoolean(value)) {
    throw new ValidationError(
      `${context}: field "${key}" must be a boolean`,
      key,
      'boolean',
      value
    )
  }
  return value
}

/** Validate array field. */
function validateArray<T>(
  obj: Record<string, unknown>,
  key: string,
  context: string,
  itemValidator: (item: unknown, index: number) => T
): T[] {
  const value = obj[key]
  if (!isArray(value)) {
    throw new ValidationError(
      `${context}: field "${key}" must be an array`,
      key,
      'array',
      value
    )
  }
  return value.map((item, index) => itemValidator(item, index))
}

/** Validate optional string field. */
function validateOptionalString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key]
  if (value === undefined || value === null) return undefined
  if (!isString(value)) {
    throw new ValidationError(
      `field "${key}" must be a string or undefined`,
      key,
      'string | undefined',
      value
    )
  }
  return value
}

/** Validate optional number field. */
function validateOptionalNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key]
  if (value === undefined || value === null) return undefined
  if (!isNumber(value)) {
    throw new ValidationError(
      `field "${key}" must be a number or undefined`,
      key,
      'number | undefined',
      value
    )
  }
  return value
}

/* ============================================================
   Type-specific validators
   ============================================================ */

export function validateUser(obj: unknown): User {
  if (!isObject(obj)) throw new ValidationError('User must be an object', undefined, 'User', obj)
  return {
    id: validateString(obj, 'id', 'User'),
    name: validateString(obj, 'name', 'User'),
    email: validateString(obj, 'email', 'User'),
    firstName: validateString(obj, 'firstName', 'User'),
    timezone: validateString(obj, 'timezone', 'User'),
    createdAt: validateString(obj, 'createdAt', 'User'),
  }
}

export function validateExam(obj: unknown): Exam {
  if (!isObject(obj)) throw new ValidationError('Exam must be an object', undefined, 'Exam', obj)
  return {
    id: validateString(obj, 'id', 'Exam'),
    slug: validateString(obj, 'slug', 'Exam'),
    name: validateString(obj, 'name', 'Exam'),
    shortName: validateString(obj, 'shortName', 'Exam'),
    tagline: validateString(obj, 'tagline', 'Exam'),
    description: validateString(obj, 'description', 'Exam'),
    color: validateString(obj, 'color', 'Exam'),
    icon: validateString(obj, 'icon', 'Exam'),
    configurableSyllabus: validateBoolean(obj, 'configurableSyllabus', 'Exam'),
  }
}

export function validateSubject(obj: unknown): Subject {
  if (!isObject(obj)) throw new ValidationError('Subject must be an object', undefined, 'Subject', obj)
  return {
    id: validateString(obj, 'id', 'Subject'),
    examId: validateString(obj, 'examId', 'Subject'),
    name: validateString(obj, 'name', 'Subject'),
    nameBn: validateOptionalString(obj, 'nameBn'),
    weight: validateNumber(obj, 'weight', 'Subject'),
    mastery: validateNumber(obj, 'mastery', 'Subject'),
    accuracy: validateNumber(obj, 'accuracy', 'Subject'),
    speed: validateNumber(obj, 'speed', 'Subject'),
    retention: validateNumber(obj, 'retention', 'Subject'),
  }
}

export function validateTopic(obj: unknown): Topic {
  if (!isObject(obj)) throw new ValidationError('Topic must be an object', undefined, 'Topic', obj)
  return {
    id: validateString(obj, 'id', 'Topic'),
    subjectId: validateString(obj, 'subjectId', 'Topic'),
    name: validateString(obj, 'name', 'Topic'),
    mastery: validateNumber(obj, 'mastery', 'Topic'),
    accuracy: validateNumber(obj, 'accuracy', 'Topic'),
    speed: validateNumber(obj, 'speed', 'Topic'),
    retention: validateNumber(obj, 'retention', 'Topic'),
    status: validateString(obj, 'status', 'Topic') as Topic['status'],
    reviewDue: validateOptionalNumber(obj, 'reviewDue'),
  }
}

export function validateQuestion(obj: unknown): Question {
  if (!isObject(obj)) throw new ValidationError('Question must be an object', undefined, 'Question', obj)
  return {
    id: validateString(obj, 'id', 'Question'),
    topicId: validateString(obj, 'topicId', 'Question'),
    prompt: validateString(obj, 'prompt', 'Question'),
    options: validateArray(obj, 'options', 'Question', (item, index) => {
      if (!isString(item)) {
        throw new ValidationError(`Question.options[${index}] must be a string`, `options[${index}]`, 'string', item)
      }
      return item
    }),
    difficulty: validateNumber(obj, 'difficulty', 'Question') as Question['difficulty'],
    targetSeconds: validateNumber(obj, 'targetSeconds', 'Question'),
  }
}

export function validatePerformance(obj: unknown): Performance {
  if (!isObject(obj)) throw new ValidationError('Performance must be an object', undefined, 'Performance', obj)
  return {
    mastery: validateNumber(obj, 'mastery', 'Performance'),
    syllabusCoverage: validateNumber(obj, 'syllabusCoverage', 'Performance'),
    consistency: validateNumber(obj, 'consistency', 'Performance'),
    accuracy: validateNumber(obj, 'accuracy', 'Performance'),
    speed: validateNumber(obj, 'speed', 'Performance'),
    retention: validateNumber(obj, 'retention', 'Performance'),
    examReadiness: validateNumber(obj, 'examReadiness', 'Performance'),
    potentialScore: validateNumber(obj, 'potentialScore', 'Performance'),
    percentile: validateNumber(obj, 'percentile', 'Performance'),
    targetPercentile: validateNumber(obj, 'targetPercentile', 'Performance'),
    projectedPercentile: validateNumber(obj, 'projectedPercentile', 'Performance'),
    trajectory: validateArray(obj, 'trajectory', 'Performance', (item, index) => {
      if (!isNumber(item)) {
        throw new ValidationError(`Performance.trajectory[${index}] must be a number`, `trajectory[${index}]`, 'number', item)
      }
      return item
    }),
    studyHistory: validateArray(obj, 'studyHistory', 'Performance', (item, index) => {
      if (!isObject(item)) {
        throw new ValidationError(`Performance.studyHistory[${index}] must be an object`, `studyHistory[${index}]`, 'object', item)
      }
      return {
        day: validateString(item, 'day', `Performance.studyHistory[${index}]`),
        minutes: validateNumber(item, 'minutes', `Performance.studyHistory[${index}]`),
      }
    }),
    streakDays: validateNumber(obj, 'streakDays', 'Performance'),
  }
}

export function validateRoadmapPhase(obj: unknown): RoadmapPhase {
  if (!isObject(obj)) throw new ValidationError('RoadmapPhase must be an object', undefined, 'RoadmapPhase', obj)
  return {
    id: validateString(obj, 'id', 'RoadmapPhase'),
    title: validateString(obj, 'title', 'RoadmapPhase'),
    week: validateNumber(obj, 'week', 'RoadmapPhase'),
    weeks: validateNumber(obj, 'weeks', 'RoadmapPhase'),
    focus: validateString(obj, 'focus', 'RoadmapPhase'),
  }
}

export function validateRoadmap(obj: unknown): Roadmap {
  if (!isObject(obj)) throw new ValidationError('Roadmap must be an object', undefined, 'Roadmap', obj)
  return {
    examId: validateString(obj, 'examId', 'Roadmap'),
    examName: validateString(obj, 'examName', 'Roadmap'),
    examDate: validateString(obj, 'examDate', 'Roadmap'),
    daysRemaining: validateNumber(obj, 'daysRemaining', 'Roadmap'),
    currentMastery: validateNumber(obj, 'currentMastery', 'Roadmap'),
    targetMastery: validateNumber(obj, 'targetMastery', 'Roadmap'),
    dailyEffortMinutes: validateNumber(obj, 'dailyEffortMinutes', 'Roadmap'),
    phases: validateArray(obj, 'phases', 'Roadmap', (item) => validateRoadmapPhase(item)),
    priorities: validateArray(obj, 'priorities', 'Roadmap', (item, index) => {
      if (!isString(item)) {
        throw new ValidationError(`Roadmap.priorities[${index}] must be a string`, `priorities[${index}]`, 'string', item)
      }
      return item
    }),
  }
}

export function validateDailyTask(obj: unknown): DailyTask {
  if (!isObject(obj)) throw new ValidationError('DailyTask must be an object', undefined, 'DailyTask', obj)
  return {
    id: validateString(obj, 'id', 'DailyTask'),
    subject: validateString(obj, 'subject', 'DailyTask'),
    topic: validateString(obj, 'topic', 'DailyTask'),
    kind: validateString(obj, 'kind', 'DailyTask') as DailyTask['kind'],
    durationMinutes: validateNumber(obj, 'durationMinutes', 'DailyTask'),
    priority: validateString(obj, 'priority', 'DailyTask') as DailyTask['priority'],
    impact: validateString(obj, 'impact', 'DailyTask') as DailyTask['impact'],
    expectedQuestions: validateOptionalNumber(obj, 'expectedQuestions'),
    status: validateString(obj, 'status', 'DailyTask') as DailyTask['status'],
  }
}

export function validateRevisionItem(obj: unknown): RevisionItem {
  if (!isObject(obj)) throw new ValidationError('RevisionItem must be an object', undefined, 'RevisionItem', obj)
  return {
    id: validateString(obj, 'id', 'RevisionItem'),
    topic: validateString(obj, 'topic', 'RevisionItem'),
    subject: validateString(obj, 'subject', 'RevisionItem'),
    memoryStrength: validateNumber(obj, 'memoryStrength', 'RevisionItem'),
    lastReviewed: validateString(obj, 'lastReviewed', 'RevisionItem'),
    nextReview: validateString(obj, 'nextReview', 'RevisionItem'),
    overdue: validateBoolean(obj, 'overdue', 'RevisionItem'),
  }
}

export function validateAIRecommendation(obj: unknown): AIRecommendation {
  if (!isObject(obj)) throw new ValidationError('AIRecommendation must be an object', undefined, 'AIRecommendation', obj)
  return {
    id: validateString(obj, 'id', 'AIRecommendation'),
    kind: validateString(obj, 'kind', 'AIRecommendation') as AIRecommendation['kind'],
    severity: validateString(obj, 'severity', 'AIRecommendation') as AIRecommendation['severity'],
    title: validateString(obj, 'title', 'AIRecommendation'),
    body: validateString(obj, 'body', 'AIRecommendation'),
    actionLabel: validateOptionalString(obj, 'actionLabel'),
    actionRoute: validateOptionalString(obj, 'actionRoute'),
  }
}

export function validateAIBriefing(obj: unknown): AIBriefing {
  if (!isObject(obj)) throw new ValidationError('AIBriefing must be an object', undefined, 'AIBriefing', obj)
  return {
    id: validateString(obj, 'id', 'AIBriefing'),
    title: validateString(obj, 'title', 'AIBriefing'),
    items: validateArray(obj, 'items', 'AIBriefing', (item, index) => {
      if (!isString(item)) {
        throw new ValidationError(`AIBriefing.items[${index}] must be a string`, `items[${index}]`, 'string', item)
      }
      return item
    }),
  }
}

/* ============================================================
   Array validators for list endpoints
   ============================================================ */

export function validateUserArray(obj: unknown): User[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of Users', undefined, 'User[]', obj)
  return obj.map((item, index) => {
    try {
      return validateUser(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`User[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateExamArray(obj: unknown): Exam[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of Exams', undefined, 'Exam[]', obj)
  return obj.map((item, index) => {
    try {
      return validateExam(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`Exam[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateSubjectArray(obj: unknown): Subject[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of Subjects', undefined, 'Subject[]', obj)
  return obj.map((item, index) => {
    try {
      return validateSubject(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`Subject[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateTopicArray(obj: unknown): Topic[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of Topics', undefined, 'Topic[]', obj)
  return obj.map((item, index) => {
    try {
      return validateTopic(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`Topic[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateQuestionArray(obj: unknown): Question[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of Questions', undefined, 'Question[]', obj)
  return obj.map((item, index) => {
    try {
      return validateQuestion(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`Question[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validatePerformanceArray(obj: unknown): Performance[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of Performance', undefined, 'Performance[]', obj)
  return obj.map((item, index) => {
    try {
      return validatePerformance(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`Performance[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateRoadmapArray(obj: unknown): Roadmap[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of Roadmaps', undefined, 'Roadmap[]', obj)
  return obj.map((item, index) => {
    try {
      return validateRoadmap(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`Roadmap[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateDailyTaskArray(obj: unknown): DailyTask[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of DailyTasks', undefined, 'DailyTask[]', obj)
  return obj.map((item, index) => {
    try {
      return validateDailyTask(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`DailyTask[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateRevisionItemArray(obj: unknown): RevisionItem[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of RevisionItems', undefined, 'RevisionItem[]', obj)
  return obj.map((item, index) => {
    try {
      return validateRevisionItem(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`RevisionItem[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

export function validateAIRecommendationArray(obj: unknown): AIRecommendation[] {
  if (!isArray(obj)) throw new ValidationError('Expected array of AIRecommendations', undefined, 'AIRecommendation[]', obj)
  return obj.map((item, index) => {
    try {
      return validateAIRecommendation(item)
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new ValidationError(`AIRecommendation[${index}]: ${e.message}`, e.field, e.expectedType, e.received)
      }
      throw e
    }
  })
}

/* ============================================================
   Wrapper functions that can be used in development only
   ============================================================ */

const isDev = import.meta.env.DEV

/** Development-only validation wrapper. In production, skips validation for performance. */
export function withValidation<T>(
  promise: Promise<unknown>,
  validator: (data: unknown) => T,
  context: string
): Promise<T> {
  if (!isDev) return promise as Promise<T>

  return promise.then((data) => {
    try {
      return validator(data)
    } catch (e) {
      if (e instanceof ValidationError) {
        console.error(`[Validation] ${context}:`, e.message, { field: e.field, received: e.received })
        // In dev, we throw to make the issue visible
        throw e
      }
      throw e
    }
  })
}
