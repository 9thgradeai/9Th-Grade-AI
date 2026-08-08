import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { Skeleton, Progress, LinkButton } from '@/components/ui'

export default function ExamDetail() {
  const { slug } = useParams<{ slug: string }>()
  const exam = useAsync(() => api.getExam(slug ?? ''), [slug])
  const subjects = useAsync(() => api.listSubjects(), [slug])

  if (exam.loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (!exam.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-40 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-ink">We couldn't load this examination.</h1>
        <Link to="/exams" className="mt-4 inline-flex items-center gap-2 text-sm text-accent-hi">
          <ArrowLeft size={15} /> Back to all exams
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Link to="/exams" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
          <ArrowLeft size={15} /> All exams
        </Link>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{exam.data.name}</h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-wider text-faint">{exam.data.tagline}</p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{exam.data.description}</p>
          </div>
          <LinkButton to="/onboarding" size="lg" iconRight={<ArrowRight size={16} />}>
            Prepare for {exam.data.shortName}
          </LinkButton>
        </div>
      </motion.div>

      <div className="mt-14">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">
          <span className="h-px w-6 bg-accent/50" /> AI strategy across subjects
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : subjects.data?.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      {s.name}
                      {s.nameBn && <span className="ml-2 lang-bn text-xs text-faint">{s.nameBn}</span>}
                    </span>
                    <span className="font-mono text-xs text-faint">{s.weight} pts</span>
                  </div>
                  <Progress value={s.mastery} className="mt-3" />
                  <div className="mt-2 flex justify-between text-[11px] text-faint">
                    <span>Mastery {s.mastery}%</span>
                    <span>Accuracy {s.accuracy}%</span>
                  </div>
                </motion.div>
              ))}
        </div>
      </div>
    </div>
  )
}
