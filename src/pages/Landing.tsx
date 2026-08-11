import { memo } from 'react'
import { Hero } from '@/components/landing/Hero'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { CoreLoop } from '@/components/landing/CoreLoop'
import { AIEngineSection } from '@/components/landing/AIEngineSection'
import { EveryAnswerSection } from '@/components/landing/EveryAnswerSection'
import { RoadmapSection } from '@/components/landing/RoadmapSection'
import { SyllabusUniverse } from '@/components/landing/SyllabusUniverse'
import { ExamSelector } from '@/components/landing/ExamSelector'
import { AdaptiveExamSection } from '@/components/landing/AdaptiveExamSection'
import { MemoryEngineSection } from '@/components/landing/MemoryEngineSection'
import { AnalyticsSection } from '@/components/landing/AnalyticsSection'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { TerminalPrompt, TerminalDivider } from '@/components/terminal'

/* Each landing section is memoized (they receive no props), keeping re-renders
   minimal even under the fixed terminal background. */
const HeroM = memo(Hero)
const ProblemSectionM = memo(ProblemSection)
const CoreLoopM = memo(CoreLoop)
const AIEngineSectionM = memo(AIEngineSection)
const EveryAnswerSectionM = memo(EveryAnswerSection)
const RoadmapSectionM = memo(RoadmapSection)
const SyllabusUniverseM = memo(SyllabusUniverse)
const ExamSelectorM = memo(ExamSelector)
const AdaptiveExamSectionM = memo(AdaptiveExamSection)
const MemoryEngineSectionM = memo(MemoryEngineSection)
const AnalyticsSectionM = memo(AnalyticsSection)
const FinalCTAM = memo(FinalCTA)

/** Terminal context marker — `$ cd ~/features` then an uppercase label. */
function Context({ to, label }: { to: string; label: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6">
      <TerminalPrompt command={`cd ~/${to}`} cursor={false} />
      <h2 className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-faint">{label}</h2>
      <TerminalDivider className="my-4" />
    </div>
  )
}

export default function Landing() {
  return (
    <div className="noise term-bg relative min-h-screen">
      <div className="relative z-10">
        <HeroM />

        <Context to="features" label="adaptive learning infrastructure" />
        <ProblemSectionM />
        <CoreLoopM />

        <Context to="ai-engine" label="the intelligence layer" />
        <AIEngineSectionM />
        <EveryAnswerSectionM />

        <Context to="workflow" label="a living plan, recalculated" />
        <RoadmapSectionM />
        <SyllabusUniverseM />
        <ExamSelectorM />

        <Context to="adaptive-practice" label="practice that adapts to you" />
        <AdaptiveExamSectionM />
        <MemoryEngineSectionM />

        <Context to="analytics" label="measure, then improve" />
        <AnalyticsSectionM />

        <Context to="launch" label="initialize your preparation" />
        <FinalCTAM />
      </div>
    </div>
  )
}
