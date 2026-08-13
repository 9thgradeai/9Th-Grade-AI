/* ============================================================
   Catalog seeder — idempotent, non-destructive.
   Seeds the shared syllabus questions from catalog.ts.
   Safe to re-run on an existing database.

   Run: npm run db:seed
   ============================================================ */

import { PrismaClient } from '@prisma/client'
import { exams, subjects, topics, questions } from '../src/seed/catalog'

const prisma = new PrismaClient()

async function main() {
  // Check if catalog questions already have content and stats
  const catalogQuestionIds = questions.map(q => q.id)
  const questionsWithContent = await prisma.question.count({
    where: { id: { in: catalogQuestionIds }, content: { isNot: null } }
  })
  const questionsWithStats = await prisma.question.count({
    where: { id: { in: catalogQuestionIds }, stats: { isNot: null } }
  })

  if (questionsWithContent === catalogQuestionIds.length && questionsWithStats === catalogQuestionIds.length) {
    console.log('Catalog questions already fully seeded — skipping.')
    return
  }

  console.log('Seeding exams…')
  await prisma.exam.createMany({ data: exams, skipDuplicates: true })

  console.log('Seeding subjects…')
  await prisma.subject.createMany({ data: subjects, skipDuplicates: true })

  console.log('Seeding topics…')
  await prisma.topic.createMany({ data: topics, skipDuplicates: true })

  // Create default SubTopic for each Topic (required for questions)
  console.log('Seeding default subtopics…')
  const allTopics = await prisma.topic.findMany()
  for (const topic of allTopics) {
    const existingSubTopic = await prisma.subTopic.findFirst({
      where: { topicId: topic.id },
    })
    if (!existingSubTopic) {
      await prisma.subTopic.create({
        data: {
          topicId: topic.id,
          name: `General - ${topic.name}`,
          sortOrder: 0,
        },
      })
    }
  }

  // Get all subtopics for mapping
  const subTopics = await prisma.subTopic.findMany()
  const subTopicByTopicId = new Map<string, string>()
  for (const st of subTopics) {
    subTopicByTopicId.set(st.topicId, st.id)
  }

  console.log(`Processing catalog questions (${questions.length})…`)

  for (const q of questions) {
    const subTopicId = subTopicByTopicId.get(q.topicId)

    // Upsert question metadata
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        topicId: q.topicId,
        subTopicId,
        questionType: 'mcq-single',
        difficulty: q.difficulty,
        targetSeconds: q.targetSeconds,
        tags: q.tags,
        bloomLevel: 'understand',
        status: 'published',
        verificationStatus: 'verified',
        isCanonical: true,
        publishedAt: new Date(),
      },
      create: {
        id: q.id,
        topicId: q.topicId,
        subTopicId,
        questionType: 'mcq-single',
        difficulty: q.difficulty,
        targetSeconds: q.targetSeconds,
        tags: q.tags,
        bloomLevel: 'understand',
        status: 'published',
        verificationStatus: 'verified',
        isCanonical: true,
        publishedAt: new Date(),
      },
    })

    // Upsert QuestionContent with actual question data
    await prisma.questionContent.upsert({
      where: { questionId: q.id },
      update: {
        prompt: q.prompt,
        promptBn: q.prompt,
        options: q.options.map(opt => ({ text: opt, textBn: opt })),
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        explanationBn: q.explanation,
        detailedExplanation: null,
      },
      create: {
        questionId: q.id,
        prompt: q.prompt,
        promptBn: q.prompt,
        options: q.options.map(opt => ({ text: opt, textBn: opt })),
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        explanationBn: q.explanation,
        detailedExplanation: null,
      },
    })

    // Upsert QuestionStats
    await prisma.questionStats.upsert({
      where: { questionId: q.id },
      update: {},
      create: {
        questionId: q.id,
        attemptCount: 0,
        correctCount: 0,
        avgTimeSeconds: 0,
        difficultyRating: 0,
      },
    })
  }

  console.log('✅ Catalog seeded.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })