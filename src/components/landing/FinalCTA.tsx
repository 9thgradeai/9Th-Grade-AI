import { ArrowRight } from 'lucide-react'
import {
  TerminalPanel,
  TerminalPrompt,
  TerminalButton,
  TerminalStatus,
} from '@/components/terminal'

export function FinalCTA() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-28 sm:px-6">
      <div className="w-full max-w-2xl">
        <TerminalPanel header="~/launch">
          <div className="flex flex-col gap-5 p-6 text-center sm:p-10">
            <TerminalPrompt command="launch.dashboard" />
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Don't prepare <span className="text-accent-hi">blindly.</span>
            </h2>
            <p className="mx-auto max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Build an AI-powered preparation system that knows where you are, where you need to go, and what you
              should do next.
            </p>
            <div className="mx-auto flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <TerminalButton to="/onboarding" iconRight={<ArrowRight size={14} />} className="h-11">
                execute → initialize
              </TerminalButton>
              <TerminalButton to="/exams" variant="ghost" className="h-11">
                explore.features
              </TerminalButton>
            </div>
            <div className="mx-auto mt-1 border-t border-border pt-4 text-left">
              <TerminalStatus label="system.status" value="ready when you are" tone="text-success" />
            </div>
          </div>
        </TerminalPanel>
      </div>
    </section>
  )
}
