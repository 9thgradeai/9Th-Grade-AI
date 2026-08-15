import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, BarChart3 } from 'lucide-react'
import { bcsPreliminaryCurriculum } from '@/domains/exams/curriculum/bcs-preliminary'
import { Card, Badge } from '@/components/ui'

export function ExamOverview({ examSlug }: { examSlug: string }) {
  const exam = bcsPreliminaryCurriculum.exam
  const subjects = bcsPreliminaryCurriculum.subjects
  const totalMarks = exam.totalMarks
  const subjectCount = subjects.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-hi">Examination</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{exam.name}</h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-wider text-faint">{exam.stageName}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Card className="border-accent/20 bg-accent/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-accent-hi" />
              <span className="font-mono text-lg font-semibold text-ink">{totalMarks}</span>
              <span className="text-xs text-muted">মার্কস</span>
            </div>
          </Card>
          <Card className="border-accent/20 bg-accent/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-accent-hi" />
              <span className="font-mono text-lg font-semibold text-ink">{subjectCount}</span>
              <span className="text-xs text-muted">বিষয়</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Syllabus note */}
      <Card className="border-accent/15 bg-accent/[0.03] p-5">
        <p className="text-sm text-muted">
          সম্পূর্ণ সিলেবাস নিচে enlisted আছে। যেকোনো বিষয়ে ক্লিক করে সিলেবাস দেখুন ও প্রস্তুতি শুরু করুন।
        </p>
      </Card>

      {/* Subject grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">বিষয়সমূহ</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/exams/${examSlug}/${exam.stage}/subjects/${s.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-faint">{String(i + 1).padStart(2, '0')}</span>
                  <Badge tone="accent" className="text-[10px]">{s.marks} নম্বর</Badge>
                </div>
                <div>
                  <h3 className="text-[15px] font-medium text-ink group-hover:text-accent-hi transition-colors">{s.name}</h3>
                  {s.sections.length > 0 && (
                    <p className="mt-1 text-xs text-muted">{s.sections.length} টি সেকশন</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-accent-hi">
                  <span>সিলেবাস দেখুন</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
