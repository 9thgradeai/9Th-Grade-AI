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
      <Hero />
      <ProblemSection />
      <CoreLoop />
      <AIEngineSection />
      <EveryAnswerSection />
      <RoadmapSection />
      <SyllabusUniverse />
      <ExamSelector />
      <AdaptiveExamSection />
      <MemoryEngineSection />
      <AnalyticsSection />
      <FinalCTA />
    </div>
  )
}
