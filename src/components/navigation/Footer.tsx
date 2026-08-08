import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const columns = [
  {
    title: 'Platform',
    links: [
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'AI Engine', to: '/ai-engine' },
      { label: 'Analytics', to: '/progress' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'Exams',
    links: [
      { label: 'BCS', to: '/exams/bcs' },
      { label: 'Bangladesh Bank AD', to: '/exams/bank-ad' },
      { label: '9th-Grade Jobs', to: '/exams/9th-grade' },
      { label: 'NTRCA', to: '/exams/ntrca' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Start Preparing', to: '/onboarding' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative border-t border-white/8 bg-space-900/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The AI operating system for competitive exam preparation in Bangladesh. Your preparation, engineered
              by intelligence.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-faint">
              <span>BCS</span>·<span>Bangladesh Bank AD</span>·<span>9th Grade</span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-muted transition-colors hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-faint">© 2026 9Th-Grade AI. Built for Bangladesh's exam ecosystem.</p>
          <p className="text-xs text-faint">
            Official syllabi remain configurable and are not presented as unassailable fact.
          </p>
        </div>
      </div>
    </footer>
  )
}
