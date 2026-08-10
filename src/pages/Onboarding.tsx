import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Shield, Landmark, Briefcase, GraduationCap, Sparkles, Check } from 'lucide-react'
import { CosmicHorizon } from '@/components/horizon'
import { Logo } from '@/components/navigation/Logo'
import { Button, Progress, Signal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useAsync } from '@/lib/useAsync'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const examOptions = [
  { id: 'exam_bcs', name: 'BCS', tag: 'Bangladesh Civil Service', icon: Shield },
  { id: 'exam_bank', name: 'Bangladesh Bank AD', tag: 'Assistant Director', icon: Landmark },
  { id: 'exam_9th', name: '9th Grade', tag: 'Government jobs', icon: Briefcase },
  { id: 'exam_ntrca', name: 'NTRCA', tag: 'Teachers recruitment', icon: GraduationCap },
  { id: 'exam_other', name: 'Other', tag: 'Competitive exams', icon: Sparkles },
]

const timeOptions = ['30 min', '1 hour', '2 hours', '3 hours', '4+ hours']
const levelOptions = [
  { id: 'beginner', name: 'Beginner', desc: 'Starting from the basics', value: 28 },
  { id: 'intermediate', name: 'Intermediate', desc: 'Some foundation built', value: 48 },
  { id: 'advanced', name: 'Advanced', desc: 'Strong across most subjects', value: 72 },
]

const diagnostic = [
  { q: 'What is 20% of 250?', options: ['40', '45', '50', '55'], correct: 2 },
  { q: 'The UN was founded in…', options: ['1919', '1945', '1948', '1950'], correct: 1 },
  { q: 'Choose the correct plural of "analysis".', options: ['analysises', 'analyses', 'analysis', 'analysi'], correct: 1 },
  { q: 'The largest sea in the world is…', options: ['Arabian Sea', 'South China Sea', 'Caspian Sea', 'Mediterranean Sea'], correct: 1 },
]

const AI_STEPS = ['Analyzing your preparation…', 'Scanning performance', 'Mapping weaknesses', 'Calculating priorities', 'Building roadmap']

export default function Onboarding() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && !user) return <Navigate to="/login" replace />
  if (loading) return null
  const [step, setStep] = useState(0)
  const [exam, setExam] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState<string | null>(null)
  const [level, setLevel] = useState<string | null>(null)
  const [diagnosticIndex, setDiagnosticIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [aiStep, setAiStep] = useState(-1)
  const [done, setDone] = useState(false)

  const roadmap = useAsync(() => api.getRoadmap())
  const examName = examOptions.find((e) => e.id === exam)?.name ?? 'BCS'

  const total = 6
  const progress = Math.round((step / (total - 1)) * 100)

  function next() {
    setStep((s) => s + 1)
  }
  function back() {
    if (step > 0) setStep((s) => s - 1)
  }

  function answerDiagnostic(selected: number) {
    if (selected === diagnostic[diagnosticIndex].correct) setCorrect((c) => c + 1)
    if (diagnosticIndex < diagnostic.length - 1) setDiagnosticIndex((i) => i + 1)
    else {
      // start blueprint generation
      setStep(5)
      setAiStep(0)
      const iv = setInterval(() => {
        setAiStep((s) => {
          if (s >= AI_STEPS.length - 1) {
            clearInterval(iv)
            setTimeout(() => setDone(true), 500)
            return s
          }
          return s + 1
        })
      }, 520)
    }
  }

  const diagnosticScore = Math.round((correct / diagnostic.length) * 100)
  const baseMastery = levelOptions.find((l) => l.id === level)?.value ?? 41
  const adjustedMastery = Math.min(85, baseMastery + Math.round(diagnosticScore / 8))

  return (
    <div className="relative flex min-h-screen flex-col">
      <CosmicHorizon variant="ambient" />

      {/* header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[11px] uppercase tracking-widest text-faint sm:block">
            Initialize your system
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-ink-soft">
            {step + 1} / {total}
          </span>
        </div>
      </div>

      {/* progress */}
      <div className="relative z-10 mx-auto w-full max-w-md px-6">
        <Progress value={done ? 100 : progress} />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16 pt-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* STEP 1 — mission */}
            {step === 0 && (
              <Step key="s0" onBack={undefined} onNext={exam ? next : undefined} nextLabel="Continue" title="Choose your mission." sub="Your universe begins with the exam you're preparing for.">
                <div className="grid gap-2.5">
                  {examOptions.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setExam(e.id)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                        exam === e.id ? 'border-accent/50 bg-accent/[0.08]' : 'border-white/10 bg-white/[0.03] hover:border-white/25',
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-accent-hi">
                        <e.icon size={17} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-ink">{e.name}</span>
                        <span className="block text-xs text-muted">{e.tag}</span>
                      </span>
                      {exam === e.id && <Check size={16} className="text-accent-hi" />}
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {/* STEP 2 — exam date */}
            {step === 1 && (
              <Step key="s1" onBack={back} onNext={date ? next : undefined} nextLabel="Continue" title="When is your exam?" sub="The roadmap is generated backward from this date.">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-faint">Target exam date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent/50"
                  />
                </label>
              </Step>
            )}

            {/* STEP 3 — study time */}
            {step === 2 && (
              <Step key="s2" onBack={back} onNext={time ? next : undefined} nextLabel="Continue" title="How much time can you study daily?" sub="Be honest — the plan calibrates to your real availability.">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {timeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={cn(
                        'rounded-xl border px-4 py-4 text-sm font-medium transition-all',
                        time === t ? 'border-accent/50 bg-accent/[0.08] text-ink' : 'border-white/10 bg-white/[0.03] text-muted hover:border-white/25',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {/* STEP 4 — level */}
            {step === 3 && (
              <Step key="s3" onBack={back} onNext={level ? next : undefined} nextLabel="Continue" title="Where are you right now?" sub="Sets your starting baseline across the universe.">
                <div className="grid gap-2.5">
                  {levelOptions.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={cn(
                        'flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all',
                        level === l.id ? 'border-accent/50 bg-accent/[0.08]' : 'border-white/10 bg-white/[0.03] hover:border-white/25',
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-ink">{l.name}</span>
                        <span className="block text-xs text-muted">{l.desc}</span>
                      </span>
                      <span className="font-mono text-xs text-faint">{l.value}%</span>
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {/* STEP 5 — diagnostic */}
            {step === 4 && (
              <Step key="s4" onBack={back} onNext={undefined} nextLabel="" title="Let's map your strengths." sub={`A quick diagnostic — ${diagnostic.length} questions to establish a baseline.`}>
                <div className="rounded-2xl border border-white/10 bg-space-950/50 p-6">
                  <div className="flex items-center justify-between text-xs text-faint">
                    <span>Question {diagnosticIndex + 1} / {diagnostic.length}</span>
                    <span className="font-mono">{correct} correct</span>
                  </div>
                  <p className="mt-4 text-lg font-medium text-ink">{diagnostic[diagnosticIndex].q}</p>
                  <div className="mt-5 grid gap-2">
                    {diagnostic[diagnosticIndex].options.map((opt, i) => (
                      <button
                        key={opt}
                        onClick={() => answerDiagnostic(i)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-ink-soft transition-colors hover:border-accent/40 hover:bg-white/[0.06]"
                      >
                        <span className="mr-3 font-mono text-faint">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </Step>
            )}

            {/* STEP 6 — blueprint generation / result */}
            {step === 5 && !done && (
              <motion.div key="s5" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center">
                  <motion.div
                    className="h-14 w-14 rounded-full border-2 border-accent/30 border-t-accent"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                </div>
                <p className="mt-6 font-mono text-sm text-ink-soft">{AI_STEPS[Math.max(aiStep, 0)]}</p>
                <div className="mx-auto mt-4 max-w-[260px]">
                  <Progress value={((aiStep + 1) / AI_STEPS.length) * 100} />
                </div>
                <div className="mt-6 flex justify-center gap-2">
                  {AI_STEPS.slice(0, aiStep + 1).map((s) => (
                    <span key={s} className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] text-success">
                      ✓
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* BLUEPRINT */}
            {step === 5 && done && (
              <motion.div key="bp" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-accent/25 bg-space-950/60 p-6 ring-glow">
                <Signal tone="success">Preparation Blueprint ready</Signal>
                <h2 className="mt-4 text-2xl font-semibold text-ink">Your Preparation Blueprint</h2>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-faint">Exam</div>
                    <div className="mt-1 font-mono text-lg text-ink">{examName}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-faint">Days remaining</div>
                    <div className="mt-1 font-mono text-lg text-ink">{roadmap.data?.daysRemaining ?? 142}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-faint">Current mastery</div>
                    <div className="mt-1 font-mono text-lg text-accent-hi">{adjustedMastery}%</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[11px] uppercase tracking-wider text-faint">Target</div>
                    <div className="mt-1 font-mono text-lg text-success">{roadmap.data?.targetMastery ?? 85}%</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-xs text-faint">
                    <span>Daily effort</span>
                    <span className="font-mono text-ink-soft">{time ?? '2 hours'}</span>
                  </div>
                  <div className="mt-3 text-xs text-faint">Priorities</div>
                  <ol className="mt-1.5 space-y-1 font-mono text-sm text-ink-soft">
                    <li>1. English Grammar</li>
                    <li>2. Mathematics</li>
                    <li>3. International Affairs</li>
                  </ol>
                </div>

                <Button size="lg" className="mt-5 w-full" onClick={() => navigate('/dashboard')} iconRight={<ArrowRight size={16} />}>
                  Enter My Command Center
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Step({
  title,
  sub,
  children,
  onBack,
  onNext,
  nextLabel,
}: {
  title: string
  sub: string
  children: React.ReactNode
  onBack?: () => void
  onNext?: () => void
  nextLabel: string
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }}>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">{sub}</p>
      <div className="mt-6">{children}</div>
      <div className="mt-6 flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft size={15} /> Back
          </button>
        ) : (
          <span />
        )}
        {onNext && (
          <Button onClick={onNext} size="md" iconRight={<ArrowRight size={15} />}>
            {nextLabel}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
