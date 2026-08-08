import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Clock, BarChart2, Trophy } from 'lucide-react'
import { Card, Badge } from '@/components/ui'

const mocks = [
  { id: 'mock-1', name: 'BCS Preliminary — Mock #12', subject: 'Full syllabus', duration: '50 min', questions: 50, best: 72, tone: 'accent' as const },
  { id: 'mock-2', name: 'Bangladesh Affairs Focus', subject: 'Bangladesh Affairs', duration: '30 min', questions: 30, best: 81, tone: 'cyan' as const },
  { id: 'mock-3', name: 'English Grammar Sprint', subject: 'English', duration: '20 min', questions: 25, best: 68, tone: 'violet' as const },
  { id: 'mock-4', name: 'Mathematics Reasoning', subject: 'Mathematical Reasoning', duration: '25 min', questions: 20, best: 58, tone: 'success' as const },
]

export default function MockTests() {
  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Mock Tests</h1>
        <p className="mt-2 text-sm text-muted">Simulate the real examination under timed conditions.</p>
      </div>

      <div className="mt-8 space-y-3">
        {mocks.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${m.tone === 'cyan' ? 'border-cyan/20 text-cyan' : m.tone === 'violet' ? 'border-violet/20 text-violet' : m.tone === 'success' ? 'border-success/20 text-success' : 'border-accent/20 text-accent-hi'}`}>
                <Trophy size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-ink">{m.name}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                  <span className="flex items-center gap-1"><Clock size={11} /> {m.duration}</span>
                  <span className="flex items-center gap-1"><BarChart2 size={11} /> {m.questions} questions</span>
                  <span>{m.subject}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-faint">Best score</div>
                  <div className="font-mono text-lg font-semibold text-accent-hi">{m.best}%</div>
                </div>
                <Link
                  to={`/mock-tests/${m.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
                >
                  <Play size={15} /> Start
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mt-6 flex items-center gap-3 p-4">
        <Badge tone="accent">Tip</Badge>
        <span className="text-xs text-muted">For an accurate readiness estimate, take mocks in a quiet room with a real timer.</span>
      </Card>
    </div>
  )
}
