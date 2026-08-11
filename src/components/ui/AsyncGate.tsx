import type { ReactNode } from 'react'
import { ErrorState, EmptyState, Skeleton } from './index'
import { WifiOff } from 'lucide-react'

/* ---------- Inline offline notice (used inside a gate) ---------- */

export function OfflineNotice({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-warning/40 px-6 py-12 text-center">
      <WifiOff size={22} className="text-warning" />
      <h3 className="text-lg font-semibold text-ink">You're offline</h3>
      <p className="max-w-sm text-sm text-muted">This section couldn't load. Reconnect and try again.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
        >
          Try again
        </button>
      )}
    </div>
  )
}

/* ---------- AsyncGate -----------------------------------------------------
   Standardizes the Loading / Empty / Error / Retry / Offline states for any
   `useAsync`-backed region, so no data screen can silently collapse to nothing.

   Priority: offline(no data) → loading → error → empty → success(children). */
interface AsyncGateProps<T> {
  loading: boolean
  error: boolean
  data: T | null
  onRetry?: () => void
  offline?: boolean
  skeleton?: ReactNode
  /** True when data is present but conceptually empty (e.g. []). */
  isEmpty?: boolean
  emptyTitle?: string
  emptyBody?: string
  emptyAction?: ReactNode
  children: (data: T) => ReactNode
}

export function AsyncGate<T>({
  loading,
  error,
  data,
  onRetry,
  offline,
  skeleton,
  isEmpty,
  emptyTitle,
  emptyBody,
  emptyAction,
  children,
}: AsyncGateProps<T>) {
  if (offline && data == null) return <OfflineNotice onRetry={onRetry} />
  if (loading) return <>{skeleton ?? <Skeleton className="h-32 w-full rounded-2xl" />}</>
  if (error) return <ErrorState onRetry={onRetry} />
  if (data == null || isEmpty) {
    return (
      <EmptyState
        title={emptyTitle ?? 'Nothing here yet'}
        body={emptyBody ?? 'There is nothing to show right now.'}
        action={emptyAction}
      />
    )
  }
  return <>{children(data)}</>
}
