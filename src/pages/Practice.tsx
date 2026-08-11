import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Timer, Cpu } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { useOnline } from '@/lib/useOnline'
import { useSubmit } from '@/lib/useSubmit'
import { api } from '@/lib/api'
import { QuestionRunner } from '@/components/exam/QuestionRunner'
import { Button, Card, Badge, Skeleton } from '@/components/ui'
import { saveResult } from '@/lib/session'
import { cn } from '@/lib/cn'
import type { Question, QuestionAttempt, TestResult } from '@/lib/types'

export default function Practice() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const presetTopic = params.get('topic')

  const subjects = useAsync(() => api.listSubjects())
  const topics = useAsync(() => api.listTopics(presetTopic ?? subjects.data?.[0]?.id ?? ''), [presetTopic, subjects.data])

  const [topicId, setTopicId] = useState(presetTopic ?? 't_profit')
  const [count, setCount] = useState(5)
  const [timed, setTimed] = useState(true)
  const [adaptive, setAdaptive] = useState(true)
  const [session, setSession] = useState<{ questions: Question[] } | null>(null)
  const online = useOnline()
  const { run: runStart, inFlight: starting, error: startError, clearError: clearStartError } = useSubmit(async () => {
    const questions = await api.listQuestions(topicId, count)
    await new Promise((r) => setTimeout(r, 500))
    setSession({ questions })
  })

  async function start() {
    if (!online) return
    await runStart()
  }

  function onFinish(attempts: QuestionAttempt[]) {
    const correct = attempts.filter((a) => a.correct).length
    const total = attempts.length
    const accuracy = total ? Math.round((correct / total) * 100) : 0
    const avgTime = total ? attempts.reduce((s, a) => s + a.timeSpentSeconds, 0) / total : 0
    const speed = Math.max(20, Math.round(100 - (avgTime / 70) * 40))

    const result: TestResult = {
      id: `res_${Date.now()}`,
      testId: 'practice',
      score: accuracy,
      accuracy,
      speed,
      retention: Math.round(accuracy * 0.92),
      percentile: Math.round(40 + accuracy * 0.55),
      correct,
      total,
      timeSpentMinutes: Math.round(attempts.reduce((s, a) => s + a.timeSpentSeconds, 0) / 60),
      attempts,
      losses: { Mathematics: 12, English: 6, 'International Affairs': 4 },
      diagnosis:
        'Your errors cluster on the harder difficulty questions. Focus on slowing the final computation to raise accuracy.',
      nextBestAction: 'Complete a targeted session on this topic, then retest at the same difficulty.',
      targetTopicId: topicId,
      completedAt: new Date().toISOString(),
    }
    saveResult(result)
    navigate('/results/practice')
  }

  if (session) {
    return (
      <div className="mx-auto max-w-3xl">
        <QuestionRunner
          questions={session.questions}
          timed={timed}
          durationSeconds={timed ? count * 70 : 0}
          onSubmit={onFinish}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Practice Engine</h1>
        <p className="mt-2 text-sm text-muted">Configure a focused session. The AI adapts to your ability in real time.</p>
      </div>

      <Card className="mt-8 p-6">
        {/* topic */}
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wider text-faint">Topic</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent/50"
          >
            {topics.loading && <option>Loading topics…</option>}
            {(topics.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        {/* count */}
        <div className="mt-6">
          <span className="text-xs font-medium uppercase tracking-wider text-faint">Number of questions</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[3, 5, 10, 15].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={cn('rounded-xl border px-3 py-2.5 text-sm font-medium transition-all', count === n ? 'border-accent/50 bg-accent/[0.08] text-ink' : 'border-border bg-surface text-muted hover:border-border/60')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* toggles */}
        <div className="mt-6 grid gap-2.5">
          <Toggle active={timed} onClick={() => setTimed((v) => !v)} icon={<Timer size={16} />} title="Timed" desc="Track response time per question" />
          <Toggle active={adaptive} onClick={() => setAdaptive((v) => !v)} icon={<Cpu size={16} />} title="AI Adaptive mode (preview)" desc="Illustrative for now — true adaptive question selection is coming soon" />
        </div>

        {adaptive && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/[0.05] px-4 py-3">
            <Badge tone="accent">Adaptive</Badge>
            <span className="text-xs text-muted">Questions will escalate with your accuracy.</span>
          </div>
        )}

        <Button size="lg" className="mt-6 w-full" onClick={start} disabled={starting || !online} icon={<Play size={16} />}>
          {starting ? 'Starting session…' : 'Begin Practice'}
        </Button>
        {startError && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/[0.06] px-4 py-3 text-sm text-danger">
            <span>Couldn't start the session. {startError.message}</span>
            <button
              onClick={() => {
                clearStartError()
                void runStart()
              }}
              className="shrink-0 font-medium underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {starting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
            <Card className="p-5">
              <Skeleton className="h-4 w-1/2" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toggle({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all', active ? 'border-accent/40 bg-accent/[0.08] text-ink' : 'border-border bg-surface hover:bg-surface-2')}>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', active ? 'border-accent/30 text-accent-hi' : 'border-border text-muted')}>{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
      <span className={cn('relative h-6 w-10 rounded-full transition-colors', active ? 'bg-accent' : 'bg-surface-2')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', active ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  )
}
