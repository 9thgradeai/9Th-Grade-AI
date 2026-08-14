import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'

export function NextBestAction({ action }: { action: { title: string; description: string; route: string; impact: 'high' | 'medium' | 'low' } }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="relative overflow-hidden border-accent/25 p-5">
        <div className="flex items-start justify-between">
          <div>
            <Badge tone="accent">Next Best Action</Badge>
            <h3 className="mt-2 text-lg font-semibold text-ink">{action.title}</h3>
            <p className="mt-1 text-sm text-muted">{action.description}</p>
          </div>
          <span className="shrink-0 rounded-lg border border-border bg-surface px-2 py-1 font-mono text-[10px] text-faint uppercase tracking-wider">
            {action.impact} impact
          </span>
        </div>
        <div className="mt-4">
          <Link to={action.route}>
            <Button icon={<Target size={15} />}>Start Now</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  )
}
