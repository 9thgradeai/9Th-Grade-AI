import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/** Constellation brand mark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-7 w-7', className)} aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="url(#bm)" strokeWidth="1.4" opacity="0.6" />
      <circle cx="16" cy="16" r="3.2" fill="url(#bm)" />
      <circle cx="16" cy="5" r="1.8" fill="#22d3ee" />
      <circle cx="5.5" cy="12.5" r="1.8" fill="#4f7cff" />
      <circle cx="26.5" cy="12.5" r="1.8" fill="#8b5cf6" />
      <circle cx="16" cy="27" r="1.8" fill="#22d3ee" />
      <g stroke="#8b94ab" strokeWidth="0.8" opacity="0.7">
        <line x1="16" y1="16" x2="16" y2="5" />
        <line x1="16" y1="16" x2="5.5" y2="12.5" />
        <line x1="16" y1="16" x2="26.5" y2="12.5" />
        <line x1="16" y1="16" x2="16" y2="27" />
      </g>
      <defs>
        <radialGradient id="bm" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#4f7cff" />
          <stop offset="60%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className={cn('flex items-center gap-2.5', className)}
      aria-label="9Th-Grade AI home"
    >
      <BrandMark />
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        9Th-Grade <span className="text-accent-hi">AI</span>
      </span>
    </Link>
  )
}
