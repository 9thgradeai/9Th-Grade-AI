import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ExamOverview } from '@/features/exam-explorer/components/ExamOverview'
import { Button } from '@/components/ui'

export default function ExamDetail() {
  const params = useParams<{ slug?: string; examSlug?: string; stageSlug?: string }>()
  const slug = params.slug ?? params.examSlug

  if (slug === 'bcs') {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
        <ExamOverview examSlug={slug} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-28 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link to="/exams" className="inline-flex items-center gap-2 hover:text-ink">
          <ArrowLeft size={15} /> পরীক্ষাসমূহ
        </Link>
      </div>
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-semibold text-ink">শীঘ্রই আসছে</h1>
        <p className="mt-2 text-sm text-muted">এই পরীক্ষার সিলেবাস ও প্রস্তুতি সিস্টেম presently গড়ে তুলছে।</p>
        <Link to="/exams">
          <Button className="mt-4" variant="outline">অন্যান্য পরীক্ষা দেখুন</Button>
        </Link>
      </div>
    </div>
  )
}
