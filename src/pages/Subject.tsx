import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Card, Progress, Skeleton, Metric, Signal, Badge } from '@/components/ui'
import { subjectById } from '@/lib/syllabus'
import type { Topic } from '@/lib/types'

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
  const syllabus = subjectById(s.id)
  const list = topics.data ?? []
  const weakest = [...list].sort((a, b) => a.mastery - b.mastery)[0]

  // Group topics under the canonical syllabus sections — each topic assigned to
  // exactly one section (first match wins) so reused placeholder ids don't duplicate.
  const grouped = syllabus
    ? syllabus.domains.map((domain) => ({
        name: domain.name.en,
        topics: list.filter((t) => domain.topics.some((st) => st.id === t.id)),
      }))
    : null
  const seen = new Set<string>()
  const uniqueGrouped = grouped?.map((g) => ({
    name: g.name,
    topics: g.topics.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true))),
  }))
  const ungrouped = uniqueGrouped ? list.filter((t) => !seen.has(t.id)) : list

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
          <Signal tone="cyan">{s.weight} / 200 marks</Signal>
        </motion.div>
      </div>

      {/* metric band */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Mastery" value={`${s.mastery}%`} tone="accent" />
        <Metric label="Accuracy" value={`${s.accuracy}%`} tone="cyan" />
        <Metric label="Speed" value={`${s.speed}%`} tone="violet" />
        <Metric label="Retention" value={`${s.retention}%`} tone="success" />
      </div>

      {/* progress note */}
      <Card className="border-accent/20 bg-accent/[0.04] p-5">
        <p className="text-sm text-muted">
          You're at <span className="font-medium text-ink">{s.mastery}% mastery</span> in {s.name}
          {s.mastery < 60 ? ' — a weak area worth prioritising.' : ' — keep the momentum.'}
        </p>
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

      {/* topics — grouped by syllabus section */}
      {uniqueGrouped ? (
        <div className="space-y-6">
          {uniqueGrouped.map((g) => (
            <TopicGroup key={g.name} name={g.name} topics={g.topics} />
          ))}
          {ungrouped.length > 0 && <TopicGroup name="Other" topics={ungrouped} />}
        </div>
      ) : (
        <TopicGroup name="Topics" topics={list} />
      )}
    </div>
  )
}

function TopicGroup({ name, topics }: { name: string; topics: Topic[] }) {
  if (topics.length === 0) return null
  const weak = topics.filter((t) => t.mastery < 55).length
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">{name}</h2>
        {weak > 0 && (
          <Badge tone="warning">
            <AlertTriangle size={11} /> {weak} weak
          </Badge>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link
              to={`/topics/${t.id}`}
              className="group block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-ink group-hover:text-accent-hi">{t.name}</span>
                <span className={`font-mono text-sm ${t.mastery < 55 ? 'text-danger' : 'text-muted'}`}>{t.mastery}%</span>
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
  )
}
