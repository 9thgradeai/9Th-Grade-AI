import type { TestResult } from '@/lib/types'

/**
 * Tiny in-memory store bridging a completed practice/mock run to the
 * results page. Replace with a real backend call later.
 */
const store: { lastResult: TestResult | null } = { lastResult: null }

export function saveResult(result: TestResult) {
  store.lastResult = result
}

export function getSavedResult(): TestResult | null {
  return store.lastResult
}
