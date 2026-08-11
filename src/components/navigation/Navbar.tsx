import { useEffect, useState, type CSSProperties } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Logo } from './Logo'
import { TerminalButton } from '@/components/terminal'

const links = [
  { to: '/', label: 'platform' },
  { to: '/how-it-works', label: 'how-it-works' },
  { to: '/exams', label: 'exams' },
  { to: '/ai-engine', label: 'ai-engine' },
  { to: '/progress', label: 'analytics' },
]

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex min-h-10 items-center rounded-md border px-2.5 py-1.5 font-mono text-[12px] transition-colors',
          isActive
            ? 'border-accent/40 bg-accent/[0.08] text-accent-hi'
            : 'border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-ink',
        )
      }
    >
      <span className="text-faint">[</span>
      ~/{label}
      <span className="text-faint">]</span>
    </NavLink>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'g-enter fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'py-2.5' : 'py-4',
      )}
      style={{ '--enter-y': '-20px' } as CSSProperties}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={cn(
            'flex items-center justify-between gap-3 rounded-lg border px-3 transition-all duration-300',
            scrolled ? 'h-12 border-border bg-surface/90' : 'h-14 border-transparent bg-transparent',
          )}
        >
          <Logo />

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {links.map((l) => (
              <TabLink key={l.to} to={l.to} label={l.label} />
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <TerminalButton to="/login" variant="ghost" className="h-10">
              login
            </TerminalButton>
            <TerminalButton to="/register" iconRight={<ArrowRight size={14} />} className="h-10">
              start
            </TerminalButton>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="g-enter mx-4 mt-2 rounded-lg border border-border bg-surface p-2 lg:hidden"
          style={{ '--enter-y': '-8px', '--enter-delay': '0s' } as CSSProperties}
        >
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2.5 font-mono text-sm',
                    isActive ? 'text-accent-hi bg-accent/[0.08]' : 'text-muted hover:text-ink',
                  )
                }
              >
                <span className="text-faint">~/</span>
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
              <TerminalButton to="/login" variant="ghost" className="h-9 flex-1">
                login
              </TerminalButton>
              <TerminalButton to="/register" iconRight={<ArrowRight size={14} />} className="h-9 flex-1">
                start
              </TerminalButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
