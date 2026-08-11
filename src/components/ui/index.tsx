import {
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { Crown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  as?: 'button'
  icon?: ReactNode
  iconRight?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-accent-hi to-accent text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 border border-border',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  outline: 'border border-border text-ink hover:bg-surface-2',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25 border border-danger/20',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', icon, iconRight, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-[-0.01em] transition-colors duration-150 select-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap active:scale-[0.97]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
})

interface LinkButtonProps {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  icon?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
}

export function LinkButton({ to, variant = 'primary', size = 'md', className, icon, iconRight, children }: LinkButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center font-medium tracking-[-0.01em] transition-colors duration-150 select-none whitespace-nowrap cursor-pointer',
    variantClasses[variant],
    sizeClasses[size],
  )
  return (
    <Link to={to} className={cn(base, className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </Link>
  )
}

/* ---------- Card ---------- */

export function Card({ className, children, glow = false }: { className?: string; children: ReactNode; glow?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface',
        glow && 'ring-glow',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Badge ---------- */

type BadgeTone = 'accent' | 'cyan' | 'violet' | 'success' | 'warning' | 'danger' | 'muted'

const badgeTones: Record<BadgeTone, string> = {
  accent: 'bg-accent/15 text-accent-hi border-accent/25',
  cyan: 'bg-cyan/12 text-cyan border-cyan/25',
  violet: 'bg-violet/15 text-violet border-violet/25',
  success: 'bg-success/12 text-success border-success/25',
  warning: 'bg-warning/12 text-warning border-warning/25',
  danger: 'bg-danger/12 text-danger border-danger/25',
  muted: 'bg-surface-2 text-muted border-border',
}

export function Badge({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Progress ---------- */

export function Progress({
  value,
  className,
  barClassName,
  showLabel = false,
}: {
  value: number
  className?: string
  barClassName?: string
  showLabel?: boolean
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div
        ref={barRef}
        className={cn('h-full rounded-full bg-gradient-to-r from-accent to-cyan', barClassName)}
        style={{
          width: inView ? `${value}%` : 0,
          transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
      {showLabel && (
        <span className="absolute right-0 -top-0.5 font-mono text-[11px] text-ink-soft">
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}

/* ---------- Stat / Metric (monospace) ---------- */

export function Metric({
  label,
  value,
  sub,
  tone = 'accent',
}: {
  label: string
  value: string | number
  sub?: string
  tone?: BadgeTone
}) {
  const color: Record<string, string> = {
    accent: 'text-accent-hi',
    cyan: 'text-cyan',
    violet: 'text-violet',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    muted: 'text-ink',
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{label}</span>
      <span className={cn('font-mono text-2xl font-semibold tracking-tight', color[tone])}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  )
}

/* ---------- Section label ---------- */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-hi', className)}>
      <span className="h-px w-6 bg-accent/50" />
      <span>{children}</span>
    </div>
  )
}

/* ---------- AI signal chip (monospace) ---------- */

export function Signal({ children, tone = 'accent', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  const dot: Record<string, string> = {
    accent: 'bg-accent-hi',
    cyan: 'bg-cyan',
    violet: 'bg-violet',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    muted: 'bg-faint',
  }
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-muted', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse-soft', dot[tone])} />
      {children}
    </span>
  )
}

/* ---------- Skeleton loader ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-2', className)} />
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      {icon && <div className="text-accent-hi">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* ---------- Feature-gate (paywall) notice ---------- */

export function UpgradeNotice({
  feature,
  className,
}: {
  /** Human-readable name of the locked feature, e.g. "Mock Tests". */
  feature: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-accent/20 bg-accent/[0.04] px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent-hi">
        <Crown size={18} />
      </span>
      <h3 className="text-lg font-semibold text-ink">{feature} is a premium feature</h3>
      <p className="max-w-sm text-sm text-muted">
        Unlock unlimited mock tests, adaptive exams, and AI strategy with a Pro plan.
      </p>
      <div className="mt-2">
        <LinkButton to="/pricing" iconRight={<ArrowRight size={14} />}>
          See plans
        </LinkButton>
      </div>
    </div>
  )
}

/* ---------- Error state ---------- */

export function ErrorState({ onRetry, onHome }: { onRetry?: () => void; onHome?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/20 bg-danger/[0.04] px-6 py-16 text-center">
      <span className="text-3xl">🌑</span>
      <h3 className="text-lg font-semibold text-ink">We couldn't load your preparation data.</h3>
      <p className="max-w-sm text-sm text-muted">
        Your universe is momentarily out of reach. Try again, or return to your dashboard.
      </p>
      <div className="mt-2 flex gap-3">
        {onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}
        {onHome && <LinkButton to="/dashboard" variant="ghost">Return to Dashboard</LinkButton>}
      </div>
    </div>
  )
}

/* ---------- Form primitives ---------- */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
