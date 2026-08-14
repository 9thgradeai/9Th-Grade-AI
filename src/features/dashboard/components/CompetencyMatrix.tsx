import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { SubjectCompetency } from '@/lib/types'
import { Card, Progress } from '@/components/ui'

const trendIcon = (v: number) => v > 0 ? <TrendingUp size={12} className="text-success" /> : v < 0 ? <TrendingDown size={12} className="text-danger" /> : <Minus size={12} className="text-faint" />

export function CompetencyMatrix({ competencies }: { competencies: SubjectCompetency[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Subject Competency</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {competencies.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <div className="rounded-xl border border-border-soft bg-surface p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  {s.name}
                  {s.nameBn && <span className="ml-1.5 lang-bn text-xs text-faint">{s.nameBn}</span>}
                </span>
                <div className="flex items-center gap-2">
                  {trendIcon(s.weeklyTrend)}
                  <span className="font-mono text-xs text-muted">{s.mastery}%</span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-faint">
                <span>acc {s.accuracy}%</span>
                <span>·</span>
                <span>spd {s.speed}%</span>
                <span>·</span>
                <span>ret {s.retention}%</span>
              </div>
              <Progress value={s.mastery} className="mt-2" barClassName={s.mastery < 55 ? 'from-danger to-warning' : undefined} />
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
