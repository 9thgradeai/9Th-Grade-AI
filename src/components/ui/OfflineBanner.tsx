import { useOnline } from '@/lib/useOnline'
import { WifiOff } from 'lucide-react'

/** Global fixed banner shown on every screen the moment the browser goes
 *  offline, so a connection failure is never silent. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/15 px-4 py-1.5 text-xs font-medium text-warning backdrop-blur">
      <WifiOff size={13} /> You're offline — changes won't save until you reconnect.
    </div>
  )
}
