import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Flag, Send } from 'lucide-react'
import type { Question, QuestionAttempt } from '@/lib/types'
import { Button, Badge } from '@/components/ui'
import { cn } from '@/lib/cn'

interface Props {
  questions: Question[]
  timed?: boolean
  durationSeconds?: number
  onSubmit: (attempts: QuestionAttempt[]) => void
  /** hide chrome for full-screen exam mode */
  immersive?: boolean
}

export function QuestionRunner({ questions, timed = false, durationSeconds = 0, onSubmit, immersive = false }: Props) {
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<(number | null)[]>(() => questions.map(() => null))
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set())
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [timePerQ, setTimePerQ] = useState<number[]>(() => questions.map(() => 0))
  const [done, setDone] = useState(false)

  const q = questions[index]

  const select = useCallback(
    (opt: number) => {
      setSelections((s) => {
        const next = [...s]
        next[index] = opt
        return next
      })
    },
    [index],
  )

  const toggleFlag = () => {
    setFlagged((f) => {
      const n = new Set(f)
      if (n.has(index)) n.delete(index)
      else n.add(index)
      return n
    })
  }

  const go = (dir: 1 | -1) => {
    const target = index + dir
    if (target >= 0 && target < questions.length) {
      setIndex(target)
    } else if (dir === 1 && target >= questions.length) {
      finish()
    }
  }

  const finish = () => {
    if (done) return
    setDone(true)
    const attempts: QuestionAttempt[] = questions.map((question, i) => ({
      id: `att_${i}`,
      questionId: question.id,
      selectedIndex: selections[i],
      correct: selections[i] === question.correctIndex,
      timeSpentSeconds: timePerQ[i],
      confidence: 3,
      answeredAt: new Date().toISOString(),
    }))
    onSubmit(attempts)
  }

  // ticker
  useEffect(() => {
    if (!timed || done) return
    const iv = setInterval(() => {
      setTimePerQ((t) => {
        const next = [...t]
        next[index] += 1
        return next
      })
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv)
          finish()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, done, index])

  const answered = selections.filter((s) => s !== null).length
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className={cn('mx-auto w-full', immersive ? 'max-w-3xl' : 'max-w-2xl')}>
      {/* top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-ink-soft">
            {index + 1} <span className="text-faint">/ {questions.length}</span>
          </span>
          {flagged.has(index) && <Badge tone="warning">Flagged</Badge>}
        </div>
        {timed && (
          <span className={cn('rounded-lg border px-3 py-1 font-mono text-sm', timeLeft < 60 ? 'border-danger/30 text-danger' : 'border-white/10 text-ink-soft')}>
            {fmt(timeLeft)}
          </span>
        )}
      </div>

      {/* progress */}
      <div className="mt-4 flex gap-1">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to question ${i + 1}`}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i === index ? 'bg-accent-hi' : selections[i] !== null ? 'bg-accent/40' : flagged.has(i) ? 'bg-warning/50' : 'bg-white/10',
            )}
          />
        ))}
      </div>

      {/* question card */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="flex items-center justify-between">
              <Badge tone="muted">Difficulty L{q?.difficulty}</Badge>
              <button onClick={toggleFlag} className={cn('flex items-center gap-1.5 text-xs transition-colors', flagged.has(index) ? 'text-warning' : 'text-muted hover:text-ink')}>
                <Flag size={13} /> {flagged.has(index) ? 'Flagged' : 'Flag'}
              </button>
            </div>
            <p className="mt-4 text-lg font-medium leading-relaxed text-ink">{q?.prompt}</p>
            <div className="mt-5 grid gap-2.5">
              {q?.options.map((opt, i) => {
                const selected = selections[index] === i
                const showState = done
                return (
                  <button
                    key={opt}
                    onClick={() => !done && select(i)}
                    disabled={done}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition-all',
                      !showState && selected && 'border-accent/50 bg-accent/[0.08]',
                      !showState && !selected && 'border-white/10 bg-white/[0.02] hover:border-white/25',
                      showState && i === q.correctIndex && 'border-success/50 bg-success/[0.08]',
                      showState && selected && i !== q.correctIndex && 'border-danger/50 bg-danger/[0.08]',
                    )}
                  >
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs', selected && !showState ? 'border-accent text-accent-hi' : 'border-white/15 text-faint')}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {showState && i === q.correctIndex && <Check size={16} className="ml-auto text-success" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* nav */}
        <div className="mt-5 flex items-center justify-between">
          <Button variant="outline" onClick={() => go(-1)} disabled={index === 0} icon={<ChevronLeft size={16} />}>
            Previous
          </Button>
          {index < questions.length - 1 ? (
            <Button onClick={() => go(1)} iconRight={<ChevronRight size={16} />}>
              Next
            </Button>
          ) : (
            <Button onClick={finish} iconRight={<Send size={15} />}>
              {immersive ? 'Submit Exam' : 'Finish'}
            </Button>
          )}
        </div>
        <p className="mt-3 text-center text-[11px] text-faint">
          {answered} of {questions.length} answered
        </p>
      </div>
    </div>
  )
}
