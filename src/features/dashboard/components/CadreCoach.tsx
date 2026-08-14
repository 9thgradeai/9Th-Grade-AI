import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Send, ArrowRight } from 'lucide-react'
import type { CoachContext, CadreCoachMessage, CoachDirectAction } from '@/lib/types'
import { Card, Button, Input } from '@/components/ui'
import { cn } from '@/lib/cn'

const SUGGESTIONS = [
  'Explain Article 70',
  'Quiz me on UN System',
  'What are my weakest topics?',
  'Create a 20-question drill',
  'Help me remember Bangladesh Constitution',
  'Test my International Affairs',
  'Why am I losing marks in Mathematics?',
]

export function CadreCoach({ context, messages }: { context: CoachContext; messages: CadreCoachMessage[] }) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<CadreCoachMessage[]>(messages)
  const [sending, setSending] = useState(false)

  function send(msg: string) {
    setInput('')
    setSending(true)
    setHistory((h) => [...h, { role: 'user', content: msg }])
    setTimeout(() => {
      setHistory((h) => [
        ...h,
        {
          role: 'assistant',
          content: `Your accuracy in ${context.weakSubjects[0] ?? 'your weakest subject'} needs attention. Based on your recent performance, I recommend a targeted practice session.`,
          actions: [{ label: 'Start Practice', route: '/practice' }],
        },
      ])
      setSending(false)
    }, 800)
  }

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.1] text-accent-hi">
          <Sparkles size={15} />
        </span>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-widest text-ink">AI Cadre Coach</h3>
      </div>

      <div className="mt-4 space-y-3">
        {history.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('rounded-xl px-3 py-2.5 text-sm', m.role === 'user' ? 'bg-accent/[0.08] text-ink' : 'bg-surface-2 text-ink-soft')}
          >
            <p>{m.content}</p>
            {m.actions && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.actions.map((a: CoachDirectAction) => (
                  <a key={a.label} href={a.route} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/[0.08] px-2.5 py-1.5 text-xs font-medium text-accent-hi hover:bg-accent/[0.15]">
                    {a.label} <ArrowRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        {sending && (
          <div className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Analyzing your preparation…
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {SUGGESTIONS.slice(0, 4).map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:border-accent/30 hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && input.trim() && send(input.trim())}
          placeholder="Ask your coach…"
          className="flex-1"
        />
        <Button size="sm" onClick={() => input.trim() && send(input.trim())} disabled={!input.trim()} icon={<Send size={14} />}>
          Send
        </Button>
      </div>
    </Card>
  )
}
