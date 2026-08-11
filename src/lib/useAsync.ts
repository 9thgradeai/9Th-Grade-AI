import { useEffect, useState, useCallback, type DependencyList } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  /** True on any failure. Kept for backward compatibility. */
  error: boolean
  /** The thrown error object — lets callers tell a paywall (FEATURE_LOCKED)
   *  from a generic failure. Null when there is no error. */
  errorObject: unknown | null
  reload: () => void
}

/** Tiny async-data hook: loading / data / error / reload. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [errorObject, setErrorObject] = useState<unknown | null>(null)
  const [tick, setTick] = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    setErrorObject(null)
    fn()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((e) => {
        if (active) {
          setError(true)
          setErrorObject(e)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, errorObject, reload }
}
