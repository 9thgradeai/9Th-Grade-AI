import { useState } from 'react'
import { Card, Button } from '@/components/ui'
import { cn } from '@/lib/cn'

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-muted">{desc}</div>
      </div>
      {children}
    </div>
  )
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', on ? 'bg-accent' : 'bg-white/10')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', on ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

export default function Settings() {
  const [notif, setNotif] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [reviews, setReviews] = useState(true)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-2 text-sm text-muted">Tune your preparation system.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Language</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['English-first', 'Bangla-first', 'Banglish'].map((lang) => (
            <button key={lang} className={cn('rounded-xl border px-3 py-3 text-sm transition-all', lang === 'English-first' ? 'border-accent/50 bg-accent/[0.08] text-ink' : 'border-white/10 bg-white/[0.02] text-muted hover:border-white/25')}>
              {lang}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-faint">
          The interface supports both English and Bangla experiences. Try switching to see Bangla-first UI labels like "আজকের লক্ষ্য".
        </p>
      </Card>

      <Card className="px-6 py-2">
        <h2 className="pt-4 text-sm font-semibold uppercase tracking-widest text-faint">Preferences</h2>
        <Row label="Notifications" desc="Reminders for daily mission and overdue reviews">
          <Switch on={notif} onClick={() => setNotif((v) => !v)} />
        </Row>
        <Row label="Reduce motion" desc="Minimize ambient animations and transitions">
          <Switch on={reduced} onClick={() => setReduced((v) => !v)} />
        </Row>
        <Row label="Weekly review summary" desc="Get an AI summary of your week every Sunday">
          <Switch on={reviews} onClick={() => setReviews((v) => !v)} />
        </Row>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Study target</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['30m', '1h', '2h'].map((t) => (
            <button key={t} className={cn('rounded-xl border px-3 py-3 text-sm transition-all', t === '2h' ? 'border-accent/50 bg-accent/[0.08] text-ink' : 'border-white/10 bg-white/[0.02] text-muted hover:border-white/25')}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Button size="md">Save preferences</Button>
    </div>
  )
}
