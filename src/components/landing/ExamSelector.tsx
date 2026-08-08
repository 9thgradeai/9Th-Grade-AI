import { Link } from 'react-router-dom'
import { ArrowUpRight, Shield, Landmark, Briefcase, GraduationCap, Sparkles } from 'lucide-react'
import { SectionHeading, Reveal } from './Reveal'

const exams = [
  { name: 'BCS', slug: 'bcs', desc: 'Bangladesh Civil Service', icon: Shield, color: '#4f7cff' },
  { name: 'Bangladesh Bank AD', slug: 'bank-ad', desc: 'Assistant Director & first-class roles', icon: Landmark, color: '#22d3ee' },
  { name: '9th-Grade Govt Jobs', slug: '9th-grade', desc: 'Ministry & agency recruitment', icon: Briefcase, color: '#8b5cf6' },
  { name: 'NTRCA', slug: 'ntrca', desc: 'Teachers registration & certification', icon: GraduationCap, color: '#34d399' },
  { name: 'Other Competitive', slug: 'other', desc: 'A growing ecosystem of first-class exams', icon: Sparkles, color: '#9aa3b8' },
]

export function ExamSelector() {
  return (
    <section className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Exam ecosystem"
          title={
            <>
              One intelligence layer.
              <br />
              <span className="text-gradient-accent font-display">Multiple examinations.</span>
            </>
          }
          sub="Configure any syllabus. The same engine plans, adapts, and measures across every exam."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e, i) => (
            <Reveal key={e.name} delay={i * 0.06}>
              <Link
                to={`/exams/${e.slug}`}
                className="group block h-full rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${e.color}40`, backgroundColor: `${e.color}14`, color: e.color }}
                  >
                    <e.icon size={20} />
                  </span>
                  <ArrowUpRight size={16} className="text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{e.name}</h3>
                <p className="mt-1.5 text-sm text-muted">{e.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Syllabus', 'AI strategy', 'Adaptive practice'].map((t) => (
                    <span key={t} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-faint">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </Reveal>
          ))}

          <Reveal delay={0.3}>
            <div className="flex h-full min-h-[200px] flex-col justify-center rounded-2xl border border-dashed border-white/12 p-6">
              <p className="text-sm font-medium text-ink-soft">Syllabi stay configurable.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Official syllabus details remain editable per exam — never presented as fixed, unchangeable fact.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
