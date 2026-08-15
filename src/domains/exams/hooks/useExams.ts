import { useQuery } from '@tanstack/react-query'
import { examApi } from '@/lib/api/endpoints/exams'
import { examKeys } from '@/lib/api/queryKeys'

export function useExams() {
  return useQuery({
    queryKey: examKeys.list(),
    queryFn: examApi.getExams,
  })
}

export function useExam(slug: string) {
  return useQuery({
    queryKey: examKeys.detail(slug),
    queryFn: () => examApi.getExam(slug),
    enabled: !!slug,
  })
}

export function useExamSubjects(examId: string) {
  return useQuery({
    queryKey: examKeys.subjects(examId),
    queryFn: () => examApi.getSubjects(examId),
    enabled: !!examId,
  })
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: examKeys.subject(id),
    queryFn: () => examApi.getSubject(id),
    enabled: !!id,
  })
}

export function useSubjectTopics(subjectId: string) {
  return useQuery({
    queryKey: examKeys.topics(subjectId),
    queryFn: () => examApi.getTopics(subjectId),
    enabled: !!subjectId,
  })
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: examKeys.topic(id),
    queryFn: () => examApi.getTopic(id),
    enabled: !!id,
  })
}
