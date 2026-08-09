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
import { LivingUniverse } from '@/components/universe/LivingUniverse'
import { useUniverseState } from '@/components/universe/useUniverseState'

/* The scroll-driven `useUniverseState` re-renders <Landing/> on every
   frame of scroll (to feed the canvas timeline). Memoizing each section
   keeps that per-frame re-render to just <Landing/> + the canvas — the
   DOM-heavy, framer-motion sections skip it entirely. They receive no
   props, so memo is safe here. */
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

export default function Landing() {
  const { progress, intensity } = useUniverseState()
  return (
    <div className="noise">
      {/* Single fixed full-viewport universe — scroll drives the cosmic timeline. */}
      <LivingUniverse
        mode="landing"
        variant="fixed"
        interactive
        progress={progress}
        intensity={intensity}
      />
      <HeroM />
      <ProblemSectionM />
      <CoreLoopM />
      <AIEngineSectionM />
      <EveryAnswerSectionM />
      <RoadmapSectionM />
      <SyllabusUniverseM />
      <ExamSelectorM />
      <AdaptiveExamSectionM />
      <MemoryEngineSectionM />
      <AnalyticsSectionM />
      <FinalCTAM />
    </div>
  )
}
