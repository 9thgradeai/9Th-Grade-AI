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
import { CosmicHorizon, CosmicSection } from '@/components/horizon'

/* Each landing section is memoized because the fixed Cosmic Horizon
   background animates independently of React; the sections receive no
   props, so memo is safe and keeps re-renders minimal. */
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

/* CosmicSection marks the narrative anchors; sections between them inherit
   the nearest preceding phase, so the atmosphere evolves dark → structured
   → luminous as the visitor moves down the page. */
export default function Landing() {
  return (
    <div className="noise relative">
      <CosmicHorizon variant="cinematic" />
      <div className="relative z-10">
        <CosmicSection phase="hero"><HeroM /></CosmicSection>
        <ProblemSectionM />
        <CoreLoopM />
        <CosmicSection phase="ai-engine"><AIEngineSectionM /></CosmicSection>
        <EveryAnswerSectionM />
        <CosmicSection phase="strategy"><RoadmapSectionM /></CosmicSection>
        <SyllabusUniverseM />
        <ExamSelectorM />
        <CosmicSection phase="adaptive-practice"><AdaptiveExamSectionM /></CosmicSection>
        <MemoryEngineSectionM />
        <CosmicSection phase="analytics"><AnalyticsSectionM /></CosmicSection>
        <CosmicSection phase="mastery"><FinalCTAM /></CosmicSection>
      </div>
    </div>
  )
}
