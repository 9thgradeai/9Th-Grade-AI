import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Target, Brain, Dumbbell, LineChart, Trophy, LogOut } from 'lucide-react'
import { Logo } from '@/components/navigation/Logo'
import { cn } from '@/lib/cn'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'

const nav = [
  { to: '/dashboard', label: 'Command', icon: LayoutDashboard },
  { to: '/strategy', label: 'Strategy', icon: Target },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/memory', label: 'Memory', icon: Brain },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/rank', label: 'Rank', icon: Trophy },
]

export function AppShell() {
  const user = useAsync(() => api.getUser())
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(79,124,255,0.12),transparent)]" />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-space-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex" aria-label="App">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                      isActive ? 'bg-white/8 text-ink' : 'text-muted hover:text-ink hover:bg-white/5',
                    )
                  }
                >
                  <n.icon size={15} />
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/[0.08]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet text-[11px] font-bold text-white">
                {user.data?.firstName?.[0] ?? 'R'}
              </span>
              <span className="hidden text-[13px] font-medium text-ink-soft sm:block">
                {user.data?.firstName ?? 'Rafi'}
              </span>
            </button>
            <button
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-danger"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* mobile nav */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/6 px-3 pb-2 md:hidden" aria-label="App mobile">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium',
                  isActive ? 'bg-white/8 text-ink' : 'text-muted',
                )
              }
            >
              <n.icon size={14} />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
