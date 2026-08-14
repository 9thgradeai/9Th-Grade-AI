import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Play } from 'lucide-react'
import type { TopicCompetency } from '@/lib/types'
import { Card, Progress, Button } from '@/components/ui'

export function SubjectWeaknessMap({ weakestTopics }: { weakestTopics: TopicCompetency[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-warning" />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Weakness Map</h3>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {weakestTopics.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border-soft bg-surface p-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-soft">{t.name}</span>
              <span className="font-mono text-danger">{t.mastery}%</span>
            </div>
            <div className="mt-1 text-[10px] text-faint">{t.subjectId}</div>
            <Progress value={t.mastery} className="mt-2" barClassName="from-danger to-warning" />
            <div className="mt-2">
              <Link to={`/practice?topic=${t.id}`}>
                <Button size="sm" variant="ghost" icon={<Play size={12} />} className="h-7 px-2 text-[11px]">
                  Practice
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
