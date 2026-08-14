import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, RefreshCw } from 'lucide-react'
import type { RevisionItem } from '@/lib/types'
import { Card, Badge, Button } from '@/components/ui'
import { cn } from '@/lib/cn'

type Tab = 'today' | 'tomorrow' | 'upcoming'

const tabs: { key: Tab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'upcoming', label: 'Upcoming' },
]

export function MemoryLedger({ memory }: { memory: { today: RevisionItem[]; tomorrow: RevisionItem[]; upcoming: RevisionItem[] } }) {
  const [tab, setTab] = useState<Tab>('today')
  const items = memory[tab]

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-cyan" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-ink">Memory Ledger</h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                tab === t.key ? 'bg-accent text-white' : 'text-muted hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No items {tab === 'today' ? 'due today' : tab === 'tomorrow' ? 'due tomorrow' : 'upcoming'}.
          </div>
        ) : (
          items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">{item.topic}</span>
                  <span className="text-[10px] text-faint">{item.subject}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                  <span className="flex items-center gap-1"><Clock size={11} /> {item.nextReview}</span>
                  <span>Strength: {item.memoryStrength}%</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden sm:block w-16">
                  <div className="h-1 rounded-full bg-surface-2">
                    <div className="h-1 rounded-full bg-gradient-to-r from-accent to-cyan" style={{ width: `${item.memoryStrength}%` }} />
                  </div>
                </div>
                <Badge tone={item.overdue ? 'danger' : item.memoryStrength < 50 ? 'warning' : 'success'} className="text-[9px]">
                  {item.overdue ? 'Overdue' : item.memoryStrength < 50 ? 'Low' : 'Good'}
                </Badge>
                <Link to="/memory">
                  <Button size="sm" variant="ghost" icon={<RefreshCw size={13} />} className="h-7 px-2 text-xs">
                    Review
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Card>
  )
}
