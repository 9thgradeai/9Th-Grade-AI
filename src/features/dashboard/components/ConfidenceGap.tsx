import { motion } from 'framer-motion'
import type { ConfidenceDiagnostic } from '@/lib/types'
import { Card, Progress, Badge } from '@/components/ui'

export function ConfidenceGap({ diagnostic }: { diagnostic: ConfidenceDiagnostic }) {
  const bars = [
    { label: 'High Confidence', accuracy: diagnostic.highConfidenceAccuracy, count: diagnostic.highConfidenceCount, tone: 'accent' as const },
    { label: 'Low Confidence', accuracy: diagnostic.lowConfidenceAccuracy, count: diagnostic.lowConfidenceCount, tone: 'violet' as const },
  ]

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Confidence Accuracy Gap</h3>
        <Badge tone="warning" className="text-[9px]">Diagnostic</Badge>
      </div>
      <p className="mt-2 text-xs text-muted">How your confidence aligns with actual accuracy.</p>
      <div className="mt-4 space-y-3">
        {bars.map((b, i) => (
          <motion.div key={b.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-soft">{b.label}</span>
              <span className="font-mono text-muted">{b.accuracy}% · {b.count} questions</span>
            </div>
            <Progress value={b.accuracy} className="mt-1.5" barClassName={b.tone === 'accent' ? 'from-accent to-cyan' : 'from-violet to-accent'} />
          </motion.div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-warning/20 bg-warning/[0.06] px-3 py-2 text-xs text-muted">
        <span className="font-medium text-ink">Gap: {diagnostic.gap}%</span> — Low confidence answers are {diagnostic.lowConfidenceAccuracy - diagnostic.highConfidenceAccuracy >= 0 ? 'more accurate' : 'less accurate'} than high confidence ones.
      </div>
    </Card>
  )
}
