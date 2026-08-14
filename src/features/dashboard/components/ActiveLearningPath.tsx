import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { SubjectCompetency } from '@/lib/types'
import { Card, Badge, Progress } from '@/components/ui'

export function ActiveLearningPath({ competencies }: { competencies: SubjectCompetency[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Active Learning Path</h3>
      </div>
      <div className="mt-4 space-y-3">
        {competencies.slice(0, 5).map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/subjects/${s.id}`} className="group block">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink group-hover:text-accent-hi transition-colors">{s.name}</span>
                    {s.nameBn && <span className="lang-bn text-xs text-faint">{s.nameBn}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={s.mastery} className="flex-1" />
                    <span className="font-mono text-xs text-muted">{s.mastery}%</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={s.priority === 'critical' ? 'danger' : s.priority === 'focus' ? 'warning' : 'success'} className="text-[9px]">
                    {s.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <Link to="/progress" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-hi hover:text-ink">
        View full path <ArrowRight size={14} />
      </Link>
    </Card>
  )
}
