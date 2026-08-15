export interface ExamDomain {
  id: string
  examId: string
  order: number
  name: string
  nameBn?: string
  marks?: number
  description?: string
}

export interface ExamTopic {
  id: string
  domainId: string
  order: number
  name: string
  nameBn?: string
  marks?: number
  description?: string
}

export interface ExamSubtopic {
  id: string
  topicId: string
  order: number
  name: string
  nameBn?: string
  description?: string
}

export interface Exam {
  id: string
  slug: string
  name: string
  shortName?: string
  description?: string
  language: "bn" | "en" | "mixed"
  stages: ExamStage[]
  totalMarks?: number
  durationMinutes?: number
  status: "active" | "upcoming" | "archived"
}

export interface ExamStage {
  id: string
  name: string
  type: "preliminary" | "written" | "viva" | "other"
  totalMarks?: number
  durationMinutes?: number
}

export interface Subject {
  id: string
  examId: string
  order: number
  name: string
  nameBn?: string
  marks?: number
  description?: string
}

export interface Topic {
  id: string
  subjectId: string
  order: number
  name: string
  nameBn?: string
  marks?: number
  description?: string
}

export interface Subtopic {
  id: string
  topicId: string
  order: number
  name: string
  nameBn?: string
  description?: string
}

export interface CurriculumSection {
  id: string
  order: number
  name: string
  nameBn?: string
  marks?: number
  description?: string
  topics?: CurriculumTopic[]
}

export interface CurriculumTopic {
  id: string
  order: number
  name: string
  nameBn?: string
  marks?: number
  description?: string
  subtopics?: CurriculumSubtopic[]
}

export interface CurriculumSubtopic {
  id: string
  order: number
  name: string
  nameBn?: string
  description?: string
}

export interface ExamCurriculum {
  exam: {
    slug: string
    stage: string
    name: string
    stageName: string
    totalMarks: number
  }
  subjects: Array<{
    id: string
    order: number
    name: string
    nameBn?: string
    marks: number
    description?: string
    sections: CurriculumSection[]
  }>
}
