import { useEffect, useRef, useState, type ReactNode } from 'react'

/* CSS-based scroll reveal (replaces framer-motion). Same visual result as the
   previous motion.div reveal: opacity 0→1, translateY y→0, 0.7s, once, -80px
   trigger. Uses an IntersectionObserver to toggle the `.g-reveal-in` class. */

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '-80px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`g-reveal ${shown ? 'g-reveal-in' : ''} ${className ?? ''}`}
      style={{ '--reveal-y': `${y}px`, '--reveal-delay': `${delay}s` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">{children}</span>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = 'left',
}: {
  eyebrow: string
  title: ReactNode
  sub?: ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <div className={align === 'center' ? 'flex justify-center' : ''}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-[2.6rem]">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{sub}</p>}
    </Reveal>
  )
}
