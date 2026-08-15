import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Play } from 'lucide-react'
import { bcsPreliminaryCurriculum } from '@/domains/exams/curriculum/bcs-preliminary'
import { Card, Badge, Button, EmptyState } from '@/components/ui'

export default function TopicOverview() {
  const { examSlug, stageSlug, subjectId, topicId } = useParams<{ examSlug: string; stageSlug: string; subjectId: string; topicId: string }>()
  const subject = bcsPreliminaryCurriculum.subjects.find(s => s.id === subjectId)
  const section = subject?.sections.find(s => s.id === topicId || (s.topics ?? []).some(t => t.id === topicId))
  const topic = section?.topics?.find(t => t.id === topicId)

  if (!subject || !topic) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6">
        <EmptyState
          title="টপিক খুঁজে পাওয়া যায়নি"
          body="এই টপিক ID সঠিক নয়।"
          action={<Link to={`/exams/${examSlug}/${stageSlug}/subjects/${subjectId}`}><Button variant="outline">বিষয়ে ফিরে যান</Button></Link>}
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
        <Link to={`/exams/${examSlug}/${stageSlug}/subjects/${subjectId}`} className="hover:text-ink">{subject.name}</Link>
        <span className="text-faint">/</span>
        <span className="text-ink">{topic.name}</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{topic.name}</h1>
        {topic.marks ? (
          <div className="mt-2">
            <Badge tone="accent">{topic.marks} নম্বর</Badge>
          </div>
        ) : null}
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" icon={<BookOpen size={16} />} className="justify-start">সিলেবাস দেখুন</Button>
        <Button variant="outline" icon={<Play size={16} />} className="justify-start">অনুশীলন শুরু করুন</Button>
        <Button variant="ghost" className="justify-start">রিভিশন</Button>
        <Button variant="ghost" className="justify-start">অগ্রগতি</Button>
      </div>

      {topic.description && (
        <Card className="mt-8 p-5">
          <p className="text-sm text-muted">{topic.description}</p>
        </Card>
      )}

      {(topic.subtopics ?? []).length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-faint mb-4">সাবটপিক</h2>
          <div className="space-y-2">
            {(topic.subtopics ?? []).map((sub) => (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-faint">{sub.order}</span>
                  <span className="text-sm text-ink">{sub.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
