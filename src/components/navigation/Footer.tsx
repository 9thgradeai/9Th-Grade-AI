import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { TerminalPrompt, TerminalDivider, TerminalStatus } from '@/components/terminal'

const columns = [
  {
    title: 'PLATFORM',
    links: [
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'AI Engine', to: '/ai-engine' },
      { label: 'Analytics', to: '/progress' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'EXAMS',
    links: [
      { label: 'BCS', to: '/exams/bcs' },
      { label: 'Bangladesh Bank AD', to: '/exams/bank-ad' },
      { label: '9th-Grade Jobs', to: '/exams/9th-grade' },
      { label: 'NTRCA', to: '/exams/ntrca' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Start Preparing', to: '/onboarding' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* system status */}
        <TerminalPrompt command="system.status" cursor={false} />
        <div className="mt-3 grid max-w-sm gap-1.5">
          <TerminalStatus label="status" value="operational" tone="text-success" />
          <TerminalStatus label="version" value="1.2.0" />
          <TerminalStatus label="environment" value="production" />
        </div>

        <TerminalDivider />

        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The AI operating system for competitive exam preparation in Bangladesh. Your preparation, engineered
              by intelligence.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-faint">
              <span>BCS</span>·<span>Bangladesh Bank AD</span>·<span>9th Grade</span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="term-label text-[11px] text-faint">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="inline-flex min-h-10 items-center text-sm text-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-faint">© 2026 9Th-Grade AI · system online</p>
          <p className="font-mono text-xs text-faint">
            official syllabi remain configurable · not presented as unassailable fact
          </p>
        </div>
      </div>
    </footer>
  )
}
