import { type CSSProperties } from 'react'
import { Link, Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Dumbbell,
  BookOpen,
  NotebookPen,
  Bot,
  LineChart,
  Trophy,
  Bell,
  Briefcase,
  LogOut,
  Settings,
  Sun,
  Moon,
} from 'lucide-react'
import { BrandMark } from '@/components/navigation/Logo'
import { cn } from '@/lib/cn'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'

/** Primary destinations for the mobile bottom bar (max 6 slots). */
const primaryNav = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/memory', label: 'Revision', icon: BookOpen },
  { to: '/strategy', label: 'AI Tutor', icon: Bot },
  { to: '/progress', label: 'Analytics', icon: LineChart },
  { to: '/rank', label: 'Rank', icon: Trophy },
]

/** Grouped sidebar navigation (§5). */
const navGroups = [
  {
    label: 'PREPARE',
    items: [
      { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
      { to: '/practice', label: 'Practice', icon: Dumbbell },
      { to: '/memory', label: 'Revision', icon: BookOpen },
    ],
  },
  {
    label: 'IMPROVE',
    items: [
      { to: '/written-viva', label: 'Written & Viva', icon: NotebookPen },
      { to: '/strategy', label: 'AI Tutor', icon: Bot },
      { to: '/progress', label: 'Analytics', icon: LineChart },
      { to: '/rank', label: 'Rank', icon: Trophy },
    ],
  },
  {
    label: 'STAY INFORMED',
    items: [
      { to: '/notices', label: 'Noticeboard', icon: Bell },
      { to: '/career', label: 'Career OS', icon: Briefcase },
    ],
  },
]

/** Shared theme toggle used in both the sidebar and the mobile top bar. */
function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink',
        className,
      )}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

/** Dashboard logo — points into the app rather than the public landing. */
function AppLogo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="Dashboard home">
      <BrandMark className="h-7 w-7" />
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        9Th-Grade <span className="text-accent-hi">AI</span>
      </span>
    </Link>
  )
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof LayoutDashboard }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
          isActive ? 'bg-accent/10 text-accent-hi' : 'text-muted hover:bg-surface-2 hover:text-ink',
        )
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = (user?.firstName?.[0] ?? user?.name?.[0] ?? 'U').toUpperCase()

  return (
    <div className="min-h-screen bg-canvas text-ink" style={{ '--enter-y': '10px' } as CSSProperties}>
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <AppLogo />
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="App">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1.5 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((n) => (
                  <NavItem key={n.to} {...n} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-border p-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                isActive ? 'bg-accent/10 text-accent-hi' : 'text-muted hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            <Settings size={16} />
            Settings
          </NavLink>

          <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/60 px-2 py-1.5">
            <Link
              to="/profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                {initials}
              </span>
              <span className="truncate text-[13px] font-medium text-ink-soft">
                {user?.firstName ?? user?.name ?? 'Account'}
              </span>
            </Link>
            <ThemeToggle />
            <button
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
              aria-label="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-danger"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-canvas/90 px-4 backdrop-blur lg:hidden">
        <AppLogo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            to="/profile"
            aria-label="Profile"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
              {initials}
            </span>
          </Link>
        </div>
      </header>

      {/* ---------- Main content ---------- */}
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* ---------- Mobile bottom tab bar ---------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-border bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="App mobile"
      >
        {primaryNav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium',
                isActive ? 'text-accent-hi' : 'text-muted',
              )
            }
          >
            <n.icon size={19} />
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer so the fixed bottom bar never covers content on mobile */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </div>
  )
}
