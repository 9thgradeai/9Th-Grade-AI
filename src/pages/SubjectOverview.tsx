import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Play } from 'lucide-react'
import { bcsPreliminaryCurriculum } from '@/domains/exams/curriculum/bcs-preliminary'
import { Badge, Button, EmptyState } from '@/components/ui'
import { SyllabusTree } from '@/features/exam-explorer/components/SyllabusTree'

export default function SubjectOverview() {
  const { examSlug, stageSlug, subjectId } = useParams<{ examSlug: string; stageSlug: string; subjectId: string }>()
  const subject = bcsPreliminaryCurriculum.subjects.find(s => s.id === subjectId)

  if (!subject) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6">
        <EmptyState
          title="বিষয় খুঁজে পাওয়া যায়নি"
          body="এই বিষয় ID সঠিক নয়।"
          action={<Link to={`/exams/${examSlug}/${stageSlug}`}><Button variant="outline">সবিষয় দেখুন</Button></Link>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link to={`/exams/${examSlug}`} className="hover:text-ink">BCS</Link>
        <span className="text-faint">/</span>
        <Link to={`/exams/${examSlug}/${stageSlug}`} className="hover:text-ink">প্রিলিমিনারি</Link>
        <span className="text-faint">/</span>
        <span className="text-ink">{subject.name}</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{subject.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge tone="accent">{subject.marks} নম্বর</Badge>
            <span className="text-xs text-muted">{subject.sections.length} টি সেকশন</span>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" icon={<BookOpen size={16} />} className="justify-start">সিলেবাস দেখুন</Button>
        <Button variant="outline" icon={<Play size={16} />} className="justify-start">অনুশীলন শুরু করুন</Button>
        <Button variant="ghost" className="justify-start">রিভিশন</Button>
        <Button variant="ghost" className="justify-start">অগ্রগতি</Button>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-faint mb-4">সিলেবাস</h2>
        <SyllabusTree curriculum={{ exam: bcsPreliminaryCurriculum.exam, subjects: [subject] }} />
      </div>
    </div>
  )
}
