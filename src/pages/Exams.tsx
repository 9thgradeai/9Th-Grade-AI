import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Shield, Landmark, Briefcase, GraduationCap, Sparkles } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui'

const icons: Record<string, typeof Shield> = {
  shield: Shield,
  bank: Landmark,
  briefcase: Briefcase,
  graduation: GraduationCap,
  sparkles: Sparkles,
}

export default function Exams() {
  const { data: exams, loading } = useAsync(() => api.listExams())

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">Exam ecosystem</span>
        </div>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          One intelligence layer.
          <br />
          <span className="text-gradient-accent font-display">Multiple examinations.</span>
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Every competitive exam shares the same preparation problem. One engine solves it for all of them —
          with configurable, accurate syllabi.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))
          : exams?.map((e, i) => {
              const Icon = icons[e.icon] ?? Sparkles
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link
                    to={`/exams/${e.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-xl border"
                        style={{ borderColor: `${e.color}40`, backgroundColor: `${e.color}14`, color: e.color }}
                      >
                        <Icon size={20} />
                      </span>
                      <ArrowUpRight size={16} className="text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-ink">{e.name}</h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-faint">{e.tagline}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{e.description}</p>
                  </Link>
                </motion.div>
              )
            })}
      </div>
    </div>
  )
}
