import { useEffect, useState } from 'react'

/**
 * Live browser connectivity. True when online (or when `navigator.onLine` is
 * unavailable). Flips the moment the browser fires `online`/`offline`.
 *
 * Enables the "Offline / connection failure" state on every screen without
 * per-screen plumbing.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}
