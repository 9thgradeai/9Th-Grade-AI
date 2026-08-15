import { client } from '@/lib/client'
import type { Exam, Subject, Topic } from '@/domains/exams/types'

const toExam = (e: Record<string, unknown>): Exam => ({
  id: String(e.id ?? ''),
  slug: String(e.slug ?? ''),
  name: String(e.name ?? ''),
  shortName: e.shortName ? String(e.shortName) : undefined,
  description: e.description ? String(e.description) : undefined,
  language: (e.language as Exam['language']) ?? 'en',
  stages: Array.isArray(e.stages) ? e.stages.map((s: Record<string, unknown>) => ({
    id: String(s.id ?? ''),
    name: String(s.name ?? ''),
    type: (s.type as Exam['stages'][number]['type']) ?? 'other',
    totalMarks: s.totalMarks ? Number(s.totalMarks) : undefined,
    durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : undefined,
  })) : [],
  totalMarks: e.totalMarks ? Number(e.totalMarks) : undefined,
  durationMinutes: e.durationMinutes ? Number(e.durationMinutes) : undefined,
  status: (e.status as Exam['status']) ?? 'active',
})

const toSubject = (s: Record<string, unknown>): Subject => ({
  id: String(s.id ?? ''),
  examId: String(s.examId ?? ''),
  order: s.order !== undefined ? Number(s.order) : 0,
  name: String(s.name ?? ''),
  nameBn: s.nameBn ? String(s.nameBn) : undefined,
  marks: s.marks ? Number(s.marks) : undefined,
  description: s.description ? String(s.description) : undefined,
})

const toTopic = (t: Record<string, unknown>): Topic => ({
  id: String(t.id ?? ''),
  subjectId: String(t.subjectId ?? ''),
  order: t.order !== undefined ? Number(t.order) : 0,
  name: String(t.name ?? ''),
  nameBn: t.nameBn ? String(t.nameBn) : undefined,
  marks: t.marks ? Number(t.marks) : undefined,
  description: t.description ? String(t.description) : undefined,
})

export const examApi = {
  getExams(): Promise<Exam[]> {
    return client.get<Record<string, unknown>[]>('/exams').then((list) => list.map(toExam))
  },

  getExam(slug: string): Promise<Exam | undefined> {
    return client.get<Record<string, unknown>>(`/exams/${encodeURIComponent(slug)}`).then((e) => {
      if (!e) return undefined
      return toExam(e)
    })
  },

  getSubjects(examId: string): Promise<Subject[]> {
    return client.get<Record<string, unknown>[]>('/exams/subjects').then((list) => {
      const filtered = examId ? list.filter((s) => s.examId === examId) : list
      return filtered.map(toSubject)
    })
  },

  getSubject(id: string): Promise<Subject | undefined> {
    return client.get<Record<string, unknown>>(`/exams/subjects/${encodeURIComponent(id)}`).then((s) => {
      if (!s) return undefined
      return toSubject(s)
    })
  },

  getTopics(subjectId: string): Promise<Topic[]> {
    return client.get<Record<string, unknown>[]>(`/exams/topics?subjectId=${encodeURIComponent(subjectId)}`).then((list) => list.map(toTopic))
  },

  getTopic(id: string): Promise<Topic | undefined> {
    return client.get<Record<string, unknown>>(`/exams/topics/${encodeURIComponent(id)}`).then((t) => {
      if (!t) return undefined
      return toTopic(t)
    })
  },
}
