/* ============================================================
   API Validation Utilities
   Validates frontend API requests before sending to backend
   to ensure proper data structure and prevent invalid requests
   ============================================================ */

import { z } from 'zod'
import type { Test, TestResult } from '@/lib/types'

/* ============================================================
   Validation Schemas
   ============================================================ */

/**
 * Validate question listing parameters
 * Ensures topicId is provided and other params are within valid ranges
 */
export const questionListParamsSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
  difficulty: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(5).optional()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100).optional()),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0).optional()),
  subTopicId: z.string().optional(),
  status: z
    .enum(['draft', 'review', 'approved', 'published', 'archived'])
    .optional()
})

/**
 * Validate test building payload
 * Ensures proper scoping (only one of examId/subjectId/topicId provided)
 */
export const testBuildPayloadSchema = z
  .object({
    examId: z.string().optional(),
    subjectId: z.string().optional(),
    topicId: z.string().optional(),
    count: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().int().min(1).max(50).optional()),
    name: z.string().optional(),
    kind: z.enum(['topic', 'diagnostic', 'mock']).optional(),
    adaptive: z
      .string()
      .optional()
      .transform((val) => val ? val === 'true' || val === '1' : false)
      .pipe(z.boolean().optional())
  )
  .refine(
    (data) => {
      const provided = [data.examId, data.subjectId, data.topicId].filter(
        Boolean
      ).length
      return provided <= 1 // Only zero or one scope specifier allowed
    },
    {
      message:
        'Only one scope specifier allowed: examId, subjectId, or topicId',
    }
  )

/**
 * Validate test submission payload
 * Ensures valid attempts structure and no duplicate questions
 */
export const testSubmitPayloadSchema = z.object({
  attempts: z.array(
    z.object({
      questionId: z.string().min(1, 'Question ID is required'),
      selectedIndex: z
        .number()
        .int()
        .min(-1)
        .optional(), // -1 for skipped/unanswered
      timeSpentSeconds: z.number().int().min(0).optional(),
      confidence: z.number().int().min(1).max(5).optional(),
    })
  )
}).refine(
  (data) => {
    const questionIds = data.attempts.map((a) => a.questionId)
    const uniqueIds = new Set(questionIds)
    return questionIds.length === uniqueIds.size
  },
  { message: 'Duplicate question IDs not allowed in submission' }
)

/* ============================================================
   Validation Functions
   ============================================================ */

/**
 * Validate question list parameters
 * Throws ValidationError if validation fails
 */
export function validateQuestionListParams(
  params: Record<string, string>
): {
  topicId: string
  difficulty?: number
  limit?: number
  offset?: number
  subTopicId?: string
  status?: 'draft' | 'review' | 'approved' | 'published' | 'archived'
} {
  try {
    return questionListParamsSchema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => (
        {
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }
      ))
      throw new ValidationError('Invalid question list parameters', formattedErrors)
    }
    throw error
  }
}

/**
 * Validate test building parameters
 * Throws ValidationError if validation fails
 */
export function validateTestBuildPayload(
  body: unknown
): {
  examId?: string
  subjectId?: string
  topicId?: string
  count?: number
  name?: string
  kind?: Test['kind']
  adaptive?: boolean
} {
  try {
    return testBuildPayloadSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => (
        {
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }
      ))
      throw new ValidationError('Invalid test build parameters', formattedErrors)
    }
    throw error
  }
}

/**
 * Validate test submission parameters
 * Throws ValidationError if validation fails
 */
export function validateTestSubmitPayload(
  body: unknown
): {
  attempts: Array<{
    questionId: string
    selectedIndex: number | null
    timeSpentSeconds?: number
    confidence?: number
  }>}
} {
  try {
    return testSubmitPayloadSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => (
        {
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }
      ))
      throw new ValidationError('Invalid test submission parameters', formattedErrors)
    }
    throw error
  }
}

/* ============================================================
   Integration Helpers
   ============================================================ */

/**
 * Wrapper for API client methods that adds automatic validation
 */
export function createValidatedClient(baseClient: any) {
  return {
    ...baseClient,
    async get<T>(path: string, options: any = {}) {
      // Validate query parameters for question endpoints
      if (path.startsWith('/api/questions/')) {
        try {
          const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : '')
          const params = Object.fromEntries(url.searchParams.entries())
          validateQuestionListParams(params)
        } catch (error) {
          if (error instanceof ValidationError) throw error
          // If URL parsing fails, let the request fail naturally
        }
      }

      return baseClient.get<T>(path, options)
    },

    async post<T>(path: string, body?: unknown, opts?: RequestOptions) {
      // Validate request body for test endpoints
      if (path.startsWith('/api/tests/')) {
        if (path.includes('/submit')) {
          validateTestSubmitPayload(body)
        } else {
          validateTestBuildPayload(body)
        }
      }

      return baseClient.post<T>(path, body, opts)
    },

    async put<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return baseClient.put<T>(path, body, opts)
    },

    async patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
      return baseClient.patch<T>(path, body, opts)
    },

    async delete<T>(path: string, opts?: RequestOptions) {
      return baseClient.delete<T>(path, opts)
    }
  }
}

/* ============================================================
   Error Classes
   ============================================================ */

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message)
    this.name = 'ValidationError'
  }
}