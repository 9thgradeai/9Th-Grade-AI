#!/usr/bin/env tsx
/*
  Idempotent BCS Question Bank Import Pipeline
  - Parses JSONL files
  - Validates and normalizes data
  - Maps to existing Subject/Topic/SubTopic hierarchy
  - Computes contentHash for deduplication
  - Upserts questions with all enhanced fields
*/

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface BCSQuestion {
  external_id: string;
  source: {
    type: string;
    exam: string;
    exam_name: string;
    question_no: string;
  };
  subject: string;
  topic: string | null;
  subtopic: string | null;
  question_type: string;
  question_text: string;
  options: Array<{ key: string; text: string }>;
  correct_option: string;
  explanation: string | null;
  solution: string | null;
  key_concept: string | null;
  difficulty: number | null;
  status: string;
  quality_flags: string[];
}

// Subject mapping from JSONL to database
const SUBJECT_MAP: Record<string, string> = {
  'Bangladesh Affairs': 's_bd',
  'International Affairs': 's_int',
  'Bengali Literature': 's_bn',
  'Ethics, Values and Good Governance': 's_ethics',
  'English Literature': 's_en',
  'Mathematics': 's_math',
  'General Science': 's_sci',
  'Mental Ability': 's_mental',
  'Computer and Information Technology': 's_ict',
  'English Language': 's_en',
  'Bengali Language': 's_bn',
  'Geography and Environment': 's_geo',
};

// Topic mapping from JSONL subjects to database topics
const TOPIC_HINTS: Record<string, string[]> = {
  'Bangladesh Affairs': ['t_liberation', 't_constitution'],
  'International Affairs': ['t_un', 't_org'],
  'Bengali Literature': ['t_sandhi', 't_samas', 't_karok'],
  'Ethics, Values and Good Governance': ['t_sandhi', 't_samas', 't_karok'], // fallback
  'English Literature': ['t_synonym', 't_grammar', 't_verbal'],
  'Mathematics': ['t_arithmetic', 't_profit', 't_algebra', 't_geometry'],
  'General Science': ['t_phys', 't_chem'],
  'Mental Ability': ['t_speed', 't_series'],
  'Computer and Information Technology': ['t_arithmetic'], // fallback
  'English Language': ['t_synonym', 't_grammar', 't_verbal'],
  'Bengali Language': ['t_sandhi', 't_samas', 't_karok'],
  'Geography and Environment': ['t_liberation'], // fallback
};

// Question type mapping
const QUESTION_TYPE_MAP: Record<string, string> = {
  'mcq': 'mcq-single',
  'mcq-multiple': 'mcq-multiple',
  'fill-blank': 'fill-blank',
};

// Status mapping
const STATUS_MAP: Record<string, string> = {
  'needs_review': 'review',
  'approved': 'approved',
  'published': 'published',
  'draft': 'draft',
  'archived': 'archived',
};

function computeContentHash(prompt: string, options: string[]): string {
  const normalized = prompt.trim().toLowerCase() + '|' + options.map(o => o.trim().toLowerCase()).sort().join('|');
  return createHash('sha256').update(normalized).digest('hex');
}

function mapCorrectOption(correctOption: string, options: Array<{ key: string; text: string }>): number {
  const index = options.findIndex(o => o.key === correctOption);
  return index >= 0 ? index : 0;
}

async function getOrCreateSubTopic(topicId: string, name: string): Promise<string> {
  // Try to find existing
  const existing = await prisma.subTopic.findFirst({
    where: { topicId, name },
  });
  if (existing) return existing.id;

  // Create new
  const count = await prisma.subTopic.count({ where: { topicId } });
  const created = await prisma.subTopic.create({
    data: {
      topicId,
      name,
      sortOrder: count,
    },
  });
  return created.id;
}

async function importQuestions(jsonlPath: string): Promise<{
  imported: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const results = { imported: 0, skipped: 0, errors: 0, details: [] as string[] };

  const content = fs.readFileSync(jsonlPath, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());

  // Get all topics for mapping
  const topics = await prisma.topic.findMany({
    include: { subTopics: true },
  });
  const topicById = new Map(topics.map(t => [t.id, t]));
  const topicByName = new Map(topics.map(t => [t.name.toLowerCase(), t]));

  for (const line of lines) {
    try {
      const q: BCSQuestion = JSON.parse(line);

      // Validate required fields
      if (!q.external_id || !q.question_text || !q.options || !q.correct_option) {
        results.errors++;
        results.details.push(`Missing required fields: ${q.external_id}`);
        continue;
      }

      // Map subject
      const subjectId = SUBJECT_MAP[q.subject];
      if (!subjectId) {
        results.errors++;
        results.details.push(`Unknown subject: ${q.subject} for ${q.external_id}`);
        continue;
      }

      // Determine topic
      let topicId: string | null = null;
      if (q.topic && topicByName.has(q.topic.toLowerCase())) {
        topicId = topicByName.get(q.topic.toLowerCase())!.id;
      } else if (TOPIC_HINTS[q.subject]) {
        // Use first available topic for this subject
        topicId = TOPIC_HINTS[q.subject][0];
      } else {
        // Default to first topic of the subject
        const subjectTopics = topics.filter(t => t.subjectId === subjectId);
        if (subjectTopics.length > 0) {
          topicId = subjectTopics[0].id;
        }
      }

      if (!topicId) {
        results.errors++;
        results.details.push(`Could not determine topic for: ${q.external_id}`);
        continue;
      }

      // Determine subtopic
      let subTopicId: string | null = null;
      if (q.subtopic) {
        subTopicId = await getOrCreateSubTopic(topicId, q.subtopic);
      } else {
        // Create a default "General" subtopic for this topic
        subTopicId = await getOrCreateSubTopic(topicId, `General - ${topicById.get(topicId)?.name || 'Topic'}`);
      }

      // Normalize options
      const optionTexts = q.options.map(o => o.text);
      const correctIndex = mapCorrectOption(q.correct_option, q.options);

      // Compute content hash
      const contentHash = computeContentHash(q.question_text, optionTexts);

      // Check for existing question by contentHash or external_id
      const existingByHash = await prisma.question.findFirst({ where: { contentHash } });
      const existingByExternal = await prisma.question.findFirst({ where: { id: q.external_id } });

      if (existingByHash) {
        // Update existing question if it's a duplicate
        await prisma.question.update({
          where: { id: existingByHash.id },
          data: {
            canonicalId: existingByHash.id,
            isCanonical: false,
            status: 'published',
            verificationStatus: 'verified',
          },
        });
        results.skipped++;
        results.details.push(`Duplicate (hash): ${q.external_id} -> ${existingByHash.id}`);
        continue;
      }

      // Determine difficulty (1-5)
      const difficulty = q.difficulty ? Math.max(1, Math.min(5, q.difficulty)) : 2;

      // Determine question type
      const questionType = QUESTION_TYPE_MAP[q.question_type] || 'mcq-single';

      // Determine status
      const status = STATUS_MAP[q.status] || 'review';

      // Explanation
      const explanation = q.explanation || q.solution || 'No explanation provided.';

      // Upsert question (metadata only - content is in QuestionContent)
      const question = await prisma.question.upsert({
        where: { id: q.external_id },
        update: {
          topicId,
          subTopicId,
          questionType,
          difficulty,
          targetSeconds: difficulty * 30 + 10,
          tags: [q.subject.toLowerCase().replace(/\s+/g, '-')],
          bloomLevel: 'understand', // default
          status,
          verificationStatus: q.explanation ? 'verified' : 'unverified',
          contentHash,
          canonicalId: null,
          isCanonical: true,
          publishedAt: status === 'published' ? new Date() : null,
        },
        create: {
          id: q.external_id,
          topicId,
          subTopicId,
          questionType,
          difficulty,
          targetSeconds: difficulty * 30 + 10,
          tags: [q.subject.toLowerCase().replace(/\s+/g, '-')],
          bloomLevel: 'understand',
          status,
          verificationStatus: q.explanation ? 'verified' : 'unverified',
          contentHash,
          isCanonical: true,
          publishedAt: status === 'published' ? new Date() : null,
        },
      });

      // Upsert QuestionContent (contains actual question content)
      await prisma.questionContent.upsert({
        where: { questionId: question.id },
        update: {
          prompt: q.question_text,
          promptBn: q.question_text, // Same for now, could be translated
          options: q.options.map(o => ({ text: o.text, textBn: o.text })),
          correctIndex,
          explanation,
          explanationBn: explanation,
          detailedExplanation: q.solution || null,
        },
        create: {
          questionId: question.id,
          prompt: q.question_text,
          promptBn: q.question_text,
          options: q.options.map(o => ({ text: o.text, textBn: o.text })),
          correctIndex,
          explanation,
          explanationBn: explanation,
          detailedExplanation: q.solution || null,
        },
      });

      // Upsert QuestionSource
      await prisma.questionSource.upsert({
        where: { questionId: question.id },
        update: {
          examYear: 50,
          questionNumber: parseInt(q.source.question_no.replace(/[^\d]/g, ''), 10) || null,
          sourceType: 'bcs-official',
          sourceName: q.source.exam_name,
          sourceUrl: null,
          verifiedAt: q.explanation ? new Date() : null,
          verifiedBy: 'system',
        },
        create: {
          questionId: question.id,
          examYear: 50,
          questionNumber: parseInt(q.source.question_no.replace(/[^\d]/g, ''), 10) || null,
          sourceType: 'bcs-official',
          sourceName: q.source.exam_name,
          sourceUrl: null,
          verifiedAt: q.explanation ? new Date() : null,
          verifiedBy: 'system',
        },
      });

      // Ensure QuestionStats exists
      await prisma.questionStats.upsert({
        where: { questionId: question.id },
        update: {},
        create: {
          questionId: question.id,
          attemptCount: 0,
          correctCount: 0,
          avgTimeSeconds: 0,
          difficultyRating: 0,
        },
      });

      results.imported++;
      results.details.push(`Imported: ${q.external_id} (${q.subject})`);

    } catch (e) {
      results.errors++;
      results.details.push(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return results;
}

async function main() {
  const jsonlPath = process.argv[2] || path.join(__dirname, '../../data/Question_Bank/BCS/General/bcs_50.jsonl');

  console.log(`Importing from: ${jsonlPath}`);

  try {
    const results = await importQuestions(jsonlPath);
    console.log('\n=== Import Results ===');
    console.log(`Imported: ${results.imported}`);
    console.log(`Skipped (duplicates): ${results.skipped}`);
    console.log(`Errors: ${results.errors}`);
    console.log('\nDetails:');
    results.details.forEach(d => console.log(`  ${d}`));
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();