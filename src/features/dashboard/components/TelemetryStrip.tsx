import { motion } from 'framer-motion'
import { Flame, Zap, Target, Clock, Activity, Gauge, BookOpen, BarChart3 } from 'lucide-react'
import type { AspirantTelemetry } from '@/lib/types'
import { Card, Metric } from '@/components/ui'

export function TelemetryStrip({ telemetry }: { telemetry: AspirantTelemetry }) {
  const items = [
    { label: 'Day Streak', value: telemetry.streakDays, Icon: Flame, tone: 'warning' as const },
    { label: 'Total XP', value: telemetry.totalXP.toLocaleString(), Icon: Zap, tone: 'accent' as const },
    { label: 'MCQs Solved', value: telemetry.totalMCQs.toLocaleString(), Icon: Target, tone: 'cyan' as const },
    { label: 'Study Hours', value: `${telemetry.studyHours}h`, Icon: Clock, tone: 'violet' as const },
    { label: 'Accuracy', value: `${telemetry.accuracy}%`, Icon: Activity, tone: 'success' as const },
    { label: 'Avg Time', value: `${telemetry.avgResponseTime}s`, Icon: Gauge, tone: 'accent' as const },
    { label: 'Mastery', value: `${telemetry.currentMastery}%`, Icon: BookOpen, tone: 'cyan' as const },
    { label: 'Retention', value: `${telemetry.revisionRetention}%`, Icon: BarChart3, tone: 'violet' as const },
  ]

  return (
    <Card className="p-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Metric label={item.label} value={item.value} tone={item.tone} sub="" />
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
