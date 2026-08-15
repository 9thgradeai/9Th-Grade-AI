export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: () => [...examKeys.lists()] as const,
  details: () => [...examKeys.all, 'detail'] as const,
  detail: (id: string) => [...examKeys.details(), id] as const,
  subjects: (examId: string) => [...examKeys.detail(examId), 'subjects'] as const,
  subject: (id: string) => [...examKeys.all, 'subject', id] as const,
  topics: (subjectId: string) => [...examKeys.subject(subjectId), 'topics'] as const,
  topic: (id: string) => [...examKeys.all, 'topic', id] as const,
}
