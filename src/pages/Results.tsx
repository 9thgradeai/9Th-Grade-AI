import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingDown, CheckCircle2, BookmarkPlus, Check } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Card, Progress, Signal, Badge } from '@/components/ui'
import { getSavedResult } from '@/lib/session'
import { scoreAttempts, BPSC_RULES } from '@/lib/scoring'
import { addMemoryItem } from '@/lib/memoryStore'
import { cn } from '@/lib/cn'

export default function Results() {
  const saved = getSavedResult()
  const sample = useAsync(() => api.getSampleResult())
  const r = saved ?? sample.data
  const [savedToMemory, setSavedToMemory] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function saveToMemory() {
    if (!r || saving) return
    setSaving(true)
    let label = 'Difficult topic'
    try {
      const topic = await api.getTopic(r.targetTopicId ?? '')
      if (topic?.name) label = topic.name
    } catch {
      /* keep fallback label */
    }
    addMemoryItem(label, 'Saved from results')
    setSavedToMemory(label)
    setSaving(false)
  }

  if (!r) {
    return (
      <div className="mx-auto max-w-md pt-16 text-center">
        <p className="text-muted">No result to show yet.</p>
        <Link to="/practice" className="mt-4 inline-block text-sm text-accent-hi">Take a practice session</Link>
      </div>
    )
  }

  const metrics = [
    ['Score', r.score],
    ['Accuracy', r.accuracy],
    ['Speed', r.speed],
    ['Retention', r.retention],
  ]

  const breakdown =
    r.attempts.length > 0
      ? scoreAttempts(r.attempts)
      : {
          correct: r.correct,
          incorrect: r.total - r.correct,
          skipped: 0,
          raw: r.correct,
          negative: (r.total - r.correct) * Math.abs(BPSC_RULES.wrong),
          final: r.correct - (r.total - r.correct) * Math.abs(BPSC_RULES.wrong),
        }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Signal tone="accent">Performance Diagnosis</Signal>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 text-4xl font-semibold tracking-tight text-ink">
          {r.score}%<span className="ml-2 text-lg text-muted">/ 100</span>
        </motion.h1>
        <p className="mt-2 font-mono text-sm text-muted">Percentile {r.percentile}% · {r.correct}/{r.total} correct</p>
      </div>

      {/* metric grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map(([label, value], i) => (
          <motion.div key={label as string} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-faint">{label as string}</span>
                <span className="font-mono text-xl font-semibold text-accent-hi">{value}%</span>
              </div>
              <Progress value={value as number} className="mt-2" />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* negative-marking scoring breakdown */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Signal tone="warning">Scoring · {BPSC_RULES.label}</Signal>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Correct" value={String(breakdown.correct)} tone="text-success" />
          <Stat label="Incorrect" value={String(breakdown.incorrect)} tone="text-danger" />
          <Stat label="Skipped" value={String(breakdown.skipped)} tone="text-muted" />
        </div>
        <div className="mt-5 space-y-2.5">
          <Row label="Raw score" value={`+${breakdown.raw}`} tone="text-ink-soft" />
          <Row label="Negative marking" value={`−${breakdown.negative.toFixed(1)}`} tone="text-danger" />
          <div className="border-t border-border-soft pt-2.5">
            <Row label="Final score" value={`${breakdown.final.toFixed(1)} / ${breakdown.correct + breakdown.incorrect}`} tone="text-accent-hi" bold />
          </div>
        </div>
      </Card>

      {/* where you lost marks */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-danger" />
          <h2 className="text-sm font-semibold text-ink">Where you lost marks</h2>
        </div>
        <div className="mt-4 space-y-3">
          {Object.entries(r.losses).map(([subject, loss]) => (
            <div key={subject} className="flex items-center justify-between rounded-xl border border-border-soft bg-surface px-4 py-3">
              <span className="text-sm text-ink-soft">{subject}</span>
              <span className="font-mono text-sm text-danger">−{loss}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* AI diagnosis */}
      <Card className="border-accent/25 p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent-hi" />
          <h2 className="text-sm font-semibold text-ink">AI Diagnosis</h2>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{r.diagnosis}</p>
      </Card>

      {/* next best action */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-success" />
          <h2 className="text-sm font-semibold text-ink">Next Best Action</h2>
        </div>
        <p className="mt-3 text-[15px] text-ink-soft">{r.nextBestAction}</p>
        <Link
          to={`/practice?topic=${r.targetTopicId ?? 't_profit'}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
        >
          Start Targeted Practice <ArrowRight size={15} />
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={saveToMemory}
            disabled={saving || !!savedToMemory}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
              savedToMemory
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-border bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink',
            )}
          >
            {savedToMemory ? (
              <>
                <Check size={15} /> Saved to Memory
              </>
            ) : (
              <>
                <BookmarkPlus size={15} /> Save to Memory
              </>
            )}
          </button>
          <Link to="/memory" className="inline-flex items-center gap-1.5 text-sm text-accent-hi hover:text-ink">
            Open Memory Ledger <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone="muted">Review mistakes</Badge>
          <Link to="/strategy" className="text-sm text-accent-hi hover:text-ink">View strategy</Link>
        </div>
      </Card>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface px-3 py-3">
      <div className={`font-mono text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  )
}

function Row({ label, value, tone, bold }: { label: string; value: string; tone: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className={`font-mono text-sm ${tone} ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  )
}
