import { useCallback, useRef, useState } from 'react'

/**
 * Guard an async action against double-submission and expose explicit
 * in-flight + error state, so a submit can never silently "do nothing" nor
 * fire N requests from N rapid clicks.
 *
 *   const { run, inFlight, error, clearError } = useSubmit(async (form) => { ... })
 *   <button onClick={() => run(form)} disabled={inFlight}>
 *     {inFlight ? 'Submitting…' : 'Save'}
 *   </button>
 *   {error && <p role="alert">{error.message}</p>}
 *
 * `run()` is a no-op (returns `false`) while a call is in flight — a
 * hard re-entrancy guard backed by a ref, not just the `disabled` prop.
 * Returns `true` on success, `false` on failure.
 */
export function useSubmit<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<unknown>,
): {
  run: (...args: TArgs) => Promise<boolean>
  inFlight: boolean
  error: Error | null
  clearError: () => void
} {
  const [inFlight, setInFlight] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const busyRef = useRef(false)

  const run = useCallback(
    async (...args: TArgs): Promise<boolean> => {
      if (busyRef.current) return false // ignore re-entrant submits
      busyRef.current = true
      setInFlight(true)
      setError(null)
      try {
        await action(...args)
        return true
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Something went wrong. Please try again.'))
        return false
      } finally {
        busyRef.current = false
        setInFlight(false)
      }
    },
    [action],
  )

  const clearError = useCallback(() => setError(null), [])

  return { run, inFlight, error, clearError }
}
