import { Link } from 'react-router-dom'
import { Hammer, ArrowRight } from 'lucide-react'
import { Card, EmptyState, LinkButton } from '@/components/ui'

/* ============================================================
   Honest placeholder for intentionally-deferred features
   (§56 / §64). Never presents an unfinished feature as complete —
   links to the nearest real surface instead.
   ============================================================ */

const FALLBACK_ACTION = { to: '/dashboard', label: 'Return to Dashboard' }

export default function ComingSoon({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: { to: string; label: string }
}) {
  const a = action ?? FALLBACK_ACTION
  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-muted">
          <Hammer size={19} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="text-sm text-muted">In development</p>
        </div>
      </div>

      <Card className="p-6">
        <EmptyState
          title="This module is on the roadmap."
          body={description}
          action={
            <LinkButton to={a.to} iconRight={<ArrowRight size={14} />}>
              {a.label}
            </LinkButton>
          }
        />
      </Card>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link to="/dashboard" className="text-accent-hi hover:text-ink">Dashboard</Link>
        <Link to="/practice" className="text-accent-hi hover:text-ink">Practice</Link>
        <Link to="/memory" className="text-accent-hi hover:text-ink">Revision</Link>
        <Link to="/progress" className="text-accent-hi hover:text-ink">Analytics</Link>
      </div>
    </div>
  )
}
