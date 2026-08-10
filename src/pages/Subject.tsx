import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Card, Progress, Skeleton, Metric, Signal } from '@/components/ui'
import { CosmicHorizon } from '@/components/horizon'

export default function Subject() {
  const { id } = useParams<{ id: string }>()
  const subject = useAsync(() => api.getSubject(id ?? ''), [id])
  const topics = useAsync(() => api.listTopics(id ?? ''), [id])

  if (subject.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }
  if (!subject.data) return <p className="text-muted">We couldn't load this subject.</p>

  const s = subject.data
  const weakest = [...(topics.data ?? [])].sort((a, b) => a.mastery - b.mastery)[0]

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
          <ArrowLeft size={15} /> Dashboard
        </Link>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{s.name}</h1>
            {s.nameBn && <p className="mt-1 lang-bn text-sm text-faint">{s.nameBn}</p>}
          </div>
          <Signal tone="cyan">{s.weight} marks</Signal>
        </motion.div>
      </div>

      {/* metric band */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Mastery" value={`${s.mastery}%`} tone="accent" />
        <Metric label="Accuracy" value={`${s.accuracy}%`} tone="cyan" />
        <Metric label="Speed" value={`${s.speed}%`} tone="violet" />
        <Metric label="Retention" value={`${s.retention}%`} tone="success" />
      </div>

      {/* universe */}
      <Card className="relative h-40 overflow-hidden">
        <CosmicHorizon variant="static" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted">Zooming into the {s.name} planetary system.</p>
        </div>
      </Card>

      {/* AI recommendation */}
      {weakest && (
        <Card className="border-accent/25 p-5">
          <Signal tone="accent">AI recommendation</Signal>
          <p className="mt-2 text-[15px] text-ink-soft">
            <span className="font-semibold text-ink">{weakest.name}</span> is currently your largest scoring opportunity at {weakest.mastery}% mastery.
          </p>
          <Link to={`/topics/${weakest.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110">
            Train {weakest.name} <ArrowRight size={15} />
          </Link>
        </Card>
      )}

      {/* topics */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-faint">Topics</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(topics.data ?? []).map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/topics/${t.id}`} className="group block rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-ink group-hover:text-accent-hi">{t.name}</span>
                  <span className="font-mono text-sm text-muted">{t.mastery}%</span>
                </div>
                <Progress value={t.mastery} className="mt-3" barClassName={t.mastery < 55 ? 'from-danger to-warning' : undefined} />
                <div className="mt-2 flex justify-between text-[11px] text-faint">
                  <span>Accuracy {t.accuracy}%</span>
                  <span>Retention {t.retention}%</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
