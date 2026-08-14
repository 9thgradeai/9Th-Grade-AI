import { motion } from 'framer-motion'
import { Trophy, Flame, TrendingUp, Target } from 'lucide-react'
import type { ReadinessSnapshot, ProjectionStatus } from '@/lib/types'
import { Card, Progress } from '@/components/ui'
import { cn } from '@/lib/cn'

const projectionColors: Record<ProjectionStatus, string> = {
  estimated: 'text-warning',
  simulated: 'text-warning',
  'insufficient-data': 'text-muted',
  live: 'text-success',
}

export function ReadinessIntelligence({ readiness, projectionLabel }: { readiness: ReadinessSnapshot; projectionLabel: ProjectionStatus }) {
  const tiles = [
    { label: 'Readiness', value: readiness.examReadiness, tone: 'success' as const, sub: 'vs target 90%' },
    { label: 'Accuracy', value: readiness.accuracy, tone: 'accent' as const, sub: 'questions correct' },
    { label: 'Percentile', value: readiness.nationalPercentile, tone: 'violet' as const, sub: 'estimated cohort' },
    { label: 'Streak', value: readiness.streakDays, tone: 'warning' as const, sub: 'day streak' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-cyan" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Readiness Intelligence</h3>
        </div>
        <span className={cn('font-mono text-[10px] uppercase tracking-wider', projectionColors[projectionLabel])}>
          {projectionLabel.replace('-', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-faint">{t.label}</span>
                {t.label === 'Streak' && <Flame size={13} className="text-warning" />}
              </div>
              <div className="mt-1 font-mono text-xl font-semibold tracking-tight text-ink">
                {t.value}{t.label === 'Percentile' || t.label === 'Accuracy' || t.label === 'Readiness' ? '%' : ''}
              </div>
              <Progress value={t.value} className="mt-2" />
              <span className="mt-1.5 block text-[10px] text-faint">{t.sub}</span>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint">
            <Target size={12} /> Projected rank
          </div>
          <div className="mt-1 font-mono text-lg font-semibold text-ink">
            #{readiness.projectedRank?.toLocaleString() ?? '--'}
          </div>
          <div className="text-[10px] text-muted">of {readiness.totalAspirants.toLocaleString()} aspirants</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint">
            <TrendingUp size={12} /> Cutoff probability
          </div>
          <div className="mt-1 font-mono text-lg font-semibold text-ink">{readiness.cutoffProbability}%</div>
          <div className="text-[10px] text-muted">Projected passing probability</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-faint">
            <Flame size={12} /> Study hours
          </div>
          <div className="mt-1 font-mono text-lg font-semibold text-ink">{readiness.studyHours}h</div>
          <div className="text-[10px] text-muted">{readiness.totalMCQs.toLocaleString()} MCQs solved</div>
        </Card>
      </div>
    </div>
  )
}
