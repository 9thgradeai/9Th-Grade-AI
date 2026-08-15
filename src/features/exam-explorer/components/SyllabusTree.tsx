import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronRight, ChevronDown } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import type { ExamCurriculum } from '@/domains/exams/types'

function CurriculumTree({ curriculum }: { curriculum: ExamCurriculum }) {
  const [expandedSections, setExpandedSections] = useState<string[]>(curriculum.subjects.map(s => `s-${s.id}`))
  const [expandedTopics, setExpandedTopics] = useState<string[]>([])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const [search, setSearch] = useState('')

  const matchesSearch = (text: string) => {
    if (!search.trim()) return true
    return text.toLowerCase().includes(search.toLowerCase())
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="সিলেবাস সার্চ করুন... (বাংলা / English)"
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="space-y-4">
        {curriculum.subjects.map((subject) => {
          const subjectExpanded = expandedSections.includes(`s-${subject.id}`)
          const filteredSections = subject.sections.filter(section =>
            matchesSearch(section.name) || matchesSearch(section.description ?? '')
          )

          if (search.trim() && !matchesSearch(subject.name) && filteredSections.length === 0) {
            return null
          }

          return (
            <Card key={subject.id} className="overflow-hidden">
              <button
                onClick={() => toggleSection(`s-${subject.id}`)}
                className="flex w-full items-center justify-between p-4 text-left"
                aria-expanded={subjectExpanded}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-faint">{String(subject.order).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-sm font-medium text-ink">{subject.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge tone="accent" className="text-[10px]">{subject.marks} নম্বর</Badge>
                    </div>
                  </div>
                </div>
                {subjectExpanded ? <ChevronDown size={16} className="text-faint" /> : <ChevronRight size={16} className="text-faint" />}
              </button>

              {subjectExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-4 space-y-2">
                    {filteredSections.map((section) => {
                      const sectionKey = `t-${section.id}`
                      const topicExpanded = expandedTopics.includes(sectionKey)
                      const sectionTopics = section.topics ?? []
                      const filteredTopics = sectionTopics.filter(t =>
                        matchesSearch(t.name) || matchesSearch(t.description ?? '')
                      )

                      if (search.trim() && !matchesSearch(section.name) && filteredTopics.length === 0) {
                        return null
                      }

                      return (
                        <div key={section.id} className="rounded-xl border border-border-soft bg-surface/50">
                          <button
                            onClick={() => toggleTopic(sectionKey)}
                            className="flex w-full items-center justify-between p-3 text-left"
                            aria-expanded={topicExpanded}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-faint shrink-0">{section.order}</span>
                              <div className="min-w-0">
                                <p className="text-sm text-ink truncate">{section.name}</p>
                                {section.marks ? (
                                  <span className="text-[10px] text-muted">{section.marks} নম্বর</span>
                                ) : null}
                              </div>
                            </div>
                            {topicExpanded ? <ChevronDown size={14} className="text-faint shrink-0" /> : <ChevronRight size={14} className="text-faint shrink-0" />}
                          </button>

                          {topicExpanded && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-t border-border px-3 py-2"
                            >
                              {section.description ? (
                                <p className="text-xs text-muted mb-2">{section.description}</p>
                              ) : null}
                              {filteredTopics.length === 0 ? (
                                <p className="text-xs text-faint py-1">No topics in this section.</p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {filteredTopics.map((topic) => {
                                    const topicSubtopics = topic.subtopics ?? []
                                    return (
                                      <li key={topic.id} className="flex items-start gap-2 text-sm text-ink-soft">
                                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
                                        <div>
                                          <span>{topic.name}</span>
                                          {topic.marks ? (
                                            <span className="ml-2 text-[10px] text-faint font-mono">{topic.marks} নম্বর</span>
                                          ) : null}
                                          {topicSubtopics.length > 0 && (
                                            <ul className="mt-1 ml-4 space-y-1">
                                              {topicSubtopics.map((sub) => (
                                                <li key={sub.id} className="text-xs text-muted">
                                                  {sub.name}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function SyllabusTree({ curriculum }: { curriculum: ExamCurriculum }) {
  return <CurriculumTree curriculum={curriculum} />
}
