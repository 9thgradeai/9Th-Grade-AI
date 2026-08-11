import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/* ============================================================
   Terminal Motion — reusable primitives.
   The shared `ui` kit is left untouched (dashboard depends on it);
   these add a terminal language on top of the same semantic tokens.
   CSS-first motion; `transform`/`opacity` only; reduced-motion aware.
   ============================================================ */

/* ---------- TerminalShell ---------- */

export function TerminalShell({
  title = 'SYSTEM TERMINAL',
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('term-bg relative min-h-screen text-ink', className)}>
      <TerminalTitleBar title={title} />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Optional title bar for a terminal frame. */
export function TerminalTitleBar({
  title,
  right,
}: {
  title: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </span>
        <span className="ml-2 term-label text-[11px] text-muted">{title}</span>
      </div>
      {right}
    </div>
  )
}

/* ---------- TerminalTabs ---------- */

export function TerminalTabs({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn('flex flex-wrap items-center gap-1', className)}
    >
      {children}
    </div>
  )
}

export function TerminalTab({
  active,
  label,
  onClick,
  className,
}: {
  active?: boolean
  label: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={!!active}
      onClick={onClick}
      className={cn(
        'group relative rounded-md border px-3 py-1.5 font-mono text-[12px] transition-colors',
        active
          ? 'border-accent/40 bg-accent/[0.08] text-accent-hi'
          : 'border-transparent text-muted hover:border-border hover:bg-surface-2 hover:text-ink',
        className,
      )}
    >
      <span className="text-faint">[</span>
      {label}
      <span className="text-faint">]</span>
      {active && <span className="term-cursor ml-0.5 text-accent-hi" aria-hidden="true">▌</span>}
    </button>
  )
}

/* ---------- TerminalPrompt ---------- */

export function TerminalPrompt({
  command,
  children,
  cursor = true,
  className,
}: {
  command: string
  children?: ReactNode
  cursor?: boolean
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="font-mono text-sm text-ink-soft">
        <span className="text-accent-hi">$</span> {command}
        {cursor && <span className="term-cursor ml-1 text-accent-hi" aria-hidden="true">▌</span>}
      </p>
      {children}
    </div>
  )
}

/* ---------- TerminalCommand ---------- */

export function TerminalCommand({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cn('font-mono text-[13px] text-accent-hi', className)}>{children}</code>
}

/* ---------- TerminalPanel ---------- */

export function TerminalPanel({
  header,
  children,
  className,
}: {
  header?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-surface', className)}>
      {header && (
        <div className="flex items-center gap-2 border-b border-border bg-surface-2/50 px-3 py-1.5">
          <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
          <span className="term-label text-[10px] text-muted">{header}</span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

/* ---------- TerminalStatus ---------- */

export function TerminalStatus({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline gap-2 font-mono text-[12px]">
      <span className="text-faint">{label}</span>
      <span className="text-faint">:</span>
      <span className={cn('text-ink-soft', tone)}>{value}</span>
    </div>
  )
}

/* ---------- TerminalDivider ---------- */

export function TerminalDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('my-6 h-px w-full bg-border', className)}
      style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}
    />
  )
}

/* ---------- TerminalButton ---------- */

type TerminalButtonProps = {
  to?: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  iconRight?: ReactNode
  className?: string
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled' | 'type' | 'aria-label'>

export function TerminalButton({
  to,
  children,
  variant = 'primary',
  iconRight,
  className,
  onClick,
  disabled,
  type,
  ...rest
}: TerminalButtonProps) {
  const classes = cn(
    'group inline-flex h-9 items-center gap-2 rounded-md border px-4 text-[13px] font-medium tracking-tight transition-colors select-none disabled:opacity-50 disabled:pointer-events-none',
    variant === 'primary'
      ? 'border-accent/50 bg-accent/[0.08] text-accent-hi hover:bg-accent/[0.16]'
      : 'border-border bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink',
    className,
  )
  const content = (
    <>
      <span>{children}</span>
      {iconRight && (
        <span className="text-accent-hi transition-transform group-hover:translate-x-0.5" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={classes} aria-label={rest['aria-label']}>
        {content}
      </Link>
    )
  }
  return (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} className={classes} aria-label={rest['aria-label']}>
      {content}
    </button>
  )
}

/* ---------- TerminalSection ---------- */

export function TerminalSection({
  id,
  label,
  command,
  children,
  className,
}: {
  id?: string
  label: string
  command: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20', className)}>
      <TerminalPrompt command={command} cursor={false} />
      <h2 className="mt-3 font-mono text-xs uppercase tracking-[0.24em] text-faint">
        {label}
        <span className="ml-3 inline-block h-px w-16 translate-y-[-4px] bg-accent/40" aria-hidden="true" />
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  )
}

/* ---------- TerminalPageTransition ---------- */

export function TerminalPageTransition({ children }: { children: ReactNode }) {
  // CSS-driven entrance; the global prefers-reduced-motion guard zeroes it.
  return <div className="term-enter">{children}</div>
}
