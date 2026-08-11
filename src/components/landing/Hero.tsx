import { ArrowRight } from 'lucide-react'
import {
  TerminalPrompt,
  TerminalPanel,
  TerminalButton,
  TerminalStatus,
} from '@/components/terminal'

const credibility = ['BCS', 'Bangladesh Bank AD', '9th Grade', 'Adaptive Practice', 'AI Strategy']

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24 pb-20 sm:px-6">
      <div className="w-full max-w-3xl">
        <TerminalPanel header="~/home">
          <div className="flex flex-col gap-5 p-6 sm:p-10">
            <TerminalPrompt command="system.initialize()" />

            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Your preparation.
              <br />
              <span className="text-accent-hi">Engineered by intelligence.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              9Th-Grade AI is your AI-powered command center for BCS, Bangladesh Bank AD, and competitive
              government examinations in Bangladesh.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <TerminalButton to="/register" iconRight={<ArrowRight size={14} />} className="h-11">
                execute → register
              </TerminalButton>
              <TerminalButton to="/exams" variant="ghost" className="h-11">
                explore.features
              </TerminalButton>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5 font-mono text-xs text-faint">
              {credibility.map((c) => (
                <span key={c} className="rounded border border-border px-2 py-0.5 text-muted">
                  [ {c} ]
                </span>
              ))}
            </div>

            <div className="mt-2 border-t border-border pt-4">
              <TerminalStatus label="system.status" value="READY" tone="text-success" />
            </div>
          </div>
        </TerminalPanel>
      </div>
    </section>
  )
}
