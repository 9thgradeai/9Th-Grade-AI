import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Logo } from './Logo'
import { LinkButton } from '@/components/ui'

const links = [
  { to: '/', label: 'Platform' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/exams', label: 'Exams' },
  { to: '/ai-engine', label: 'AI Engine' },
  { to: '/progress', label: 'Analytics' },
]

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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'py-2.5' : 'py-4',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl px-4 transition-all duration-300',
            scrolled
              ? 'glass-strong h-12 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.7)]'
              : 'h-14 bg-transparent',
          )}
        >
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive ? 'text-ink' : 'text-muted hover:text-ink hover:bg-white/6',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <LinkButton to="/onboarding" variant="ghost" size="sm">
              Sign In
            </LinkButton>
            <LinkButton to="/onboarding" size="sm" iconRight={<ArrowRight size={14} />}>
              Start Preparing
            </LinkButton>
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-strong mx-4 mt-2 rounded-2xl p-3 lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-3 text-[15px]',
                      isActive ? 'text-ink bg-white/6' : 'text-muted hover:text-ink',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-2 flex flex-col gap-2 border-t border-white/8 pt-3">
              <LinkButton to="/onboarding" variant="ghost" size="md">
                Sign In
              </LinkButton>
              <LinkButton to="/onboarding" size="md" iconRight={<ArrowRight size={15} />}>
                Start Preparing
              </LinkButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
