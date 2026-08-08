import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Card, Skeleton, Signal, Button } from '@/components/ui'

export default function Profile() {
  const user = useAsync(() => api.getUser())

  if (!user.data) return <Skeleton className="h-64 rounded-2xl" />

  const u = user.data
  const rows = [
    ['Full name', u.name],
    ['Email', u.email],
    ['Timezone', u.timezone],
    ['Member since', new Date(u.createdAt).toLocaleDateString()],
    ['Exam focus', '50th BCS'],
    ['Daily effort', '2h 15m'],
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet text-2xl font-bold text-white">
          {u.firstName?.[0] ?? 'R'}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{u.name}</h1>
          <Signal tone="success">Preparation system active</Signal>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Profile</h2>
        <dl className="mt-4 divide-y divide-white/6">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-3">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="font-mono text-sm text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Danger zone</h3>
          <p className="text-xs text-muted">Reset your preparation or export your data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export data</Button>
          <Button variant="danger" size="sm">Reset</Button>
        </div>
      </Card>
    </div>
  )
}
