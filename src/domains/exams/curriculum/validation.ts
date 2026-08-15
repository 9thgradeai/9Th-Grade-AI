import { bcsPreliminaryCurriculum } from './bcs-preliminary'
export { bcsPreliminaryCurriculum } from './bcs-preliminary'

export interface CurriculumValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    subjectCount: number
    totalMarks: number
    sectionCount: number
    topicCount: number
    subtopicCount: number
  }
}

export function validateCurriculum(): CurriculumValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const exam = bcsPreliminaryCurriculum.exam

  const subjectIds = new Set<string>()
  const sectionIds = new Set<string>()
  const topicIds = new Set<string>()
  const subtopicIds = new Set<string>()

  let totalMarks = 0
  let sectionCount = 0
  let topicCount = 0
  let subtopicCount = 0

  if (exam.totalMarks !== 200) {
    errors.push(`Expected total marks 200, got ${exam.totalMarks}`)
  }

  for (const subject of bcsPreliminaryCurriculum.subjects) {
    totalMarks += subject.marks

    if (subjectIds.has(subject.id)) {
      errors.push(`Duplicate subject ID: ${subject.id}`)
    }
    subjectIds.add(subject.id)

    if (!subject.name || subject.name.trim() === '') {
      errors.push(`Subject ${subject.id} has empty name`)
    }

    if (subject.marks <= 0) {
      warnings.push(`Subject ${subject.id} has non-positive marks: ${subject.marks}`)
    }

    for (const section of subject.sections) {
      sectionCount++

      if (sectionIds.has(section.id)) {
        errors.push(`Duplicate section ID: ${section.id}`)
      }
      sectionIds.add(section.id)

      const sectionTopics = section.topics ?? []
      for (const topic of sectionTopics) {
        topicCount++

        if (topicIds.has(topic.id)) {
          errors.push(`Duplicate topic ID: ${topic.id}`)
        }
        topicIds.add(topic.id)

        const topicSubtopics = topic.subtopics ?? []
        for (const sub of topicSubtopics) {
          subtopicCount++

          if (subtopicIds.has(sub.id)) {
            errors.push(`Duplicate subtopic ID: ${sub.id}`)
          }
          subtopicIds.add(sub.id)
        }
      }
    }
  }

  if (totalMarks !== 200) {
    errors.push(`Subject marks sum to ${totalMarks}, expected 200`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      subjectCount: bcsPreliminaryCurriculum.subjects.length,
      totalMarks,
      sectionCount,
      topicCount,
      subtopicCount,
    },
  }
}

export function getCurriculum() {
  return bcsPreliminaryCurriculum
}
