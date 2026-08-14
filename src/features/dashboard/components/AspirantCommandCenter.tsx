import { Target, Activity, BookOpen, Clock } from 'lucide-react'
import type { ExamSchedule, ProjectionStatus } from '@/lib/types'
import { Card, Badge, Signal } from '@/components/ui'
import { formatCountdown } from '@/lib/dashboardIntelligence'

export function AspirantCommandCenter({ schedule, projectionLabel }: { schedule?: ExamSchedule; projectionLabel: ProjectionStatus }) {
  const countdown = schedule?.examDate ? formatCountdown(schedule.examDate) : null
  const examName = schedule?.name ?? 'BCS Preliminary'
  const days = countdown?.days ?? null

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent-hi">
            <Target size={22} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-ink">{examName}</h2>
              <Badge tone="accent">Target exam</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1.5"><Activity size={13} /> BCS Administration</span>
              <span className="flex items-center gap-1.5"><BookOpen size={13} /> Analytical Strategist</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> Preliminary Preparation</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          {days !== null && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-mono text-2xl font-semibold tracking-tight text-ink">
                  {days}<span className="text-sm text-muted ml-1">days</span>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-faint">remaining</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-right">
                <div className="font-mono text-lg font-semibold text-ink">
                  {countdown?.hours ?? '--'}<span className="text-xs text-muted ml-0.5">h</span>
                </div>
                <div className="text-[11px] uppercase tracking-wider text-faint">hours</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge tone="muted" className="text-[10px]">{projectionLabel.toUpperCase()}</Badge>
            <Signal tone="success">System active</Signal>
          </div>
        </div>
      </div>
    </Card>
  )
}
