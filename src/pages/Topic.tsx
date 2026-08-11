import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, AlertTriangle } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Card, Skeleton, Metric, Badge, Signal } from '@/components/ui'

const mistakes = [
  'Mislabels discount % as profit %',
  'Computes percentage on wrong base (SP vs CP)',
  'Skips final computation under time pressure',
]

export default function Topic() {
  const { id } = useParams<{ id: string }>()
  const topic = useAsync(() => api.getTopic(id ?? ''), [id])
  const subject = useAsync(() => api.getSubject(topic.data?.subjectId ?? ''), [topic.data?.subjectId])
  const questions = useAsync(() => api.listQuestions(id ?? '', 4), [id])

  if (topic.loading) {
    return <Skeleton className="h-80 rounded-2xl" />
  }
  if (!topic.data) return <p className="text-muted">We couldn't load this topic.</p>

  const t = topic.data

  return (
    <div className="space-y-8">
      <div>
        <Link to={`/subjects/${subject.data?.id ?? ''}`} className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
          <ArrowLeft size={15} /> {subject.data?.name ?? 'Subject'}
        </Link>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{t.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={t.status === 'mastered' ? 'success' : t.status === 'practicing' ? 'cyan' : 'warning'}>{t.status}</Badge>
            {t.reviewDue && <Badge tone="danger">{t.reviewDue} review due</Badge>}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Mastery" value={`${t.mastery}%`} tone="accent" />
        <Metric label="Accuracy" value={`${t.accuracy}%`} tone="cyan" />
        <Metric label="Speed" value={`${t.speed}%`} tone="violet" />
        <Metric label="Retention" value={`${t.retention}%`} tone="success" />
      </div>

      <Card className="border-accent/20 bg-accent/[0.04] p-4">
        <Signal tone="accent">Focus area · {t.name}</Signal>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent mistakes */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-warning" />
            <h3 className="text-sm font-semibold text-ink">Common error patterns</h3>
          </div>
          <ul className="mt-4 space-y-2.5">
            {mistakes.map((m) => (
              <li key={m} className="flex items-start gap-2.5 rounded-xl border border-border-soft bg-surface px-3 py-2.5 text-sm text-ink-soft">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warning" />
                {m}
              </li>
            ))}
          </ul>
        </Card>

        {/* Revision schedule */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink">Revision schedule</h3>
          <div className="mt-4 space-y-3">
            {[
              ['Review 1', 'Today', t.reviewDue === 1],
              ['Review 2', 'In 3 days', false],
              ['Review 3', 'In 8 days', false],
            ].map(([label, when, due]) => (
              <div key={label as string} className="flex items-center justify-between rounded-xl border border-border-soft bg-surface px-3 py-2.5">
                <span className="text-sm text-ink-soft">{label as string}</span>
                <span className={`font-mono text-xs ${due ? 'text-danger' : 'text-muted'}`}>{when as string}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommended practice */}
      <Card className="border-accent/25 p-5">
        <Signal tone="accent">Recommended practice</Signal>
        <p className="mt-2 text-[15px] text-ink-soft">Complete a targeted session on {t.name} to move the mastery needle.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={`/practice?topic=${t.id}`} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110">
            <Play size={15} /> Start targeted practice
          </Link>
          <Link to="/memory" className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2">
            View memory schedule
          </Link>
        </div>
      </Card>

      {/* sample questions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-faint">Question preview</h2>
        <div className="space-y-3">
          {(questions.data ?? []).map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[15px] text-ink-soft">{q.prompt}</p>
                <Badge tone="muted">L{q.difficulty}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <span key={o} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted">{o}</span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
