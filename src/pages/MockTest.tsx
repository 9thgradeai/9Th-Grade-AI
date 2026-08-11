import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { QuestionRunner } from '@/components/exam/QuestionRunner'
import { Skeleton, Signal } from '@/components/ui'
import { saveResult } from '@/lib/session'
import type { Question, QuestionAttempt, TestResult } from '@/lib/types'

export default function MockTest() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const { data: pref } = useAsync(() => api.getPerformance())

  useEffect(() => {
    let active = true
    api.listQuestions('__mock__', 10).then((qs) => {
      if (active) setQuestions(qs)
    })
    return () => {
      active = false
    }
  }, [id])

  function onFinish(attempts: QuestionAttempt[]) {
    const correct = attempts.filter((a) => a.correct).length
    const total = attempts.length
    const accuracy = total ? Math.round((correct / total) * 100) : 0
    const result: TestResult = {
      id: `res_mock_${id}`,
      testId: id ?? 'mock',
      score: accuracy,
      accuracy,
      speed: Math.round((pref?.speed ?? 76) * 0.92),
      retention: Math.round(accuracy * 0.9),
      percentile: Math.round(50 + accuracy * 0.5),
      correct,
      total,
      timeSpentMinutes: 42,
      attempts,
      losses: { Mathematics: 12, English: 6, 'International Affairs': 4 },
      diagnosis:
        'Your mathematics errors are concentrated around percentage-based problems. You answer quickly but frequently slip the final computation.',
      nextBestAction: 'Complete a targeted Percentage + Profit/Loss session before the next mock.',
      targetTopicId: 't_profit',
      completedAt: new Date().toISOString(),
    }
    saveResult(result)
    navigate(`/results/${result.id}`)
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="mx-auto max-w-xl pt-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <Signal tone="accent">Mock examination</Signal>
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">Ready when you are.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          The exam interface removes all distraction. A timer runs, questions progress, and you can flag items
          for review. No universe animations — just focus.
        </p>

        {questions ? (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              ['Questions', String(questions.length)],
              ['Duration', `${Math.round((questions.length * 1.2) * 100) / 100} min`],
              ['Difficulty', 'Adaptive'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border bg-surface p-4">
                <div className="text-[11px] uppercase tracking-wider text-faint">{k}</div>
                <div className="mt-1 font-mono text-sm text-ink">{v}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        )}

        <button
          onClick={() => setStarted(true)}
          disabled={!questions}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-accent-hi to-accent px-6 py-3 text-[15px] font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
        >
          <Clock size={16} /> Begin Exam
        </button>
      </div>
    )
  }

  return (
    <div className="pt-2">
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <button onClick={() => navigate('/mock-tests')} className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
          <ArrowLeft size={15} /> Exit
        </button>
        <span className="text-sm font-medium text-ink">Mock Examination</span>
      </div>
      {questions && <QuestionRunner questions={questions} timed durationSeconds={questions.length * 70} immersive onSubmit={onFinish} />}
    </div>
  )
}
