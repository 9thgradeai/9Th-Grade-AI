/* ============================================================
   Catalog seeder — idempotent, non-destructive.
   Only seeds the shared syllabus when the catalog is empty, so it is
   safe to re-run on an existing database.

   Run: npm run db:seed
   ============================================================ */

import { PrismaClient } from '@prisma/client'
import { exams, subjects, topics, questions } from '../src/seed/catalog'

const prisma = new PrismaClient()

async function main() {
  const existingExams = await prisma.exam.count()
  if (existingExams > 0) {
    console.log('Catalog already seeded — skipping. (count(exams) =', existingExams + ')')
    return
  }

  console.log('Seeding exams…')
  await prisma.exam.createMany({ data: exams, skipDuplicates: true })

  console.log('Seeding subjects…')
  await prisma.subject.createMany({ data: subjects, skipDuplicates: true })

  console.log('Seeding topics…')
  await prisma.topic.createMany({ data: topics, skipDuplicates: true })

  console.log(`Seeding questions (${questions.length})…`)
  await prisma.question.createMany({ data: questions, skipDuplicates: true })

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
