/**
 * Syllabus Validation Functions
 *
 * Validates the exam syllabus structure for consistency and correctness.
 * Checks for proper hierarchy, valid IDs, correct mark totals, etc.
 */

import type { Exam, Domain, Topic } from './syllabus';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  stats: {
    examCount: number;
    domainCount: number;
    topicCount: number;
    subtopicCount: number;
    totalMarks: number;
  };
}

/**
 * Validates a complete exam syllabus structure
 */
export function validateExamSyllabus(exams: Exam[]): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const allIds = new Set<string>();
  const allSlugs = new Set<string>();

  const stats = {
    examCount: exams.length,
    domainCount: 0,
    topicCount: 0,
    subtopicCount: 0,
    totalMarks: 0,
  };

  // Validate each exam
  for (const exam of exams) {
    // Validate exam structure
    if (!exam.id) {
      errors.push('Exam missing ID');
    } else if (allIds.has(exam.id)) {
      errors.push(`Duplicate exam ID: ${exam.id}`);
    } else {
      allIds.add(exam.id);
      allSlugs.add(`exam_${exam.id}`);
    }

    if (!exam.title?.en || exam.title.en.trim() === '') {
      errors.push(`Exam ${exam.id} missing title`);
    }

    if (exam.totalMarks <= 0) {
      errors.push(`Exam ${exam.id} has invalid total marks: ${exam.totalMarks}`);
    }

    stats.examCount++;
    stats.totalMarks += exam.totalMarks;

    // Validate domains
    for (const domain of exam.domains) {
      stats.domainCount++;

      if (!domain.id) {
        errors.push(`Domain in exam ${exam.id} missing ID`);
      } else if (allIds.has(domain.id)) {
        errors.push(`Duplicate domain ID: ${domain.id}`);
      } else {
        allIds.add(domain.id);
        allSlugs.add(`domain_${domain.id}`);
      }

      if (!domain.name?.en || domain.name.en.trim() === '') {
        errors.push(`Domain ${domain.id} missing name`);
      }

      if (domain.marks <= 0) {
        errors.push(`Domain ${domain.id} has invalid marks: ${domain.marks}`);
      }

      // Validate topic hierarchy
      for (const topic of domain.topics) {
        stats.topicCount++;

        if (!topic.id) {
          errors.push(`Topic in domain ${domain.id} missing ID`);
        } else if (allIds.has(topic.id)) {
          errors.push(`Duplicate topic ID: ${topic.id}`);
        } else {
          allIds.add(topic.id);
          allSlugs.add(`topic_${topic.id}`);
        }

        if (!topic.name?.en) {
          errors.push(`Topic ${topic.id} missing name`);
        }

        // Validate subtopics
        for (const subtopic of topic.subtopics) {
          stats.subtopicCount++;

          if (!subtopic.id) {
            errors.push(`Subtopic in topic ${topic.id} missing ID`);
          } else if (allIds.has(subtopic.id)) {
            errors.push(`Duplicate subtopic ID: ${subtopic.id}`);
          } else {
            allIds.add(subtopic.id);
            allSlugs.add(`subtopic_${subtopic.id}`);
          }

          if (!subtopic.name?.en) {
            errors.push(`Subtopic ${subtopic.id} missing name`);
          }

          if (subtopic.marks < 0) {
            errors.push(`Subtopic ${subtopic.id} has negative marks: ${subtopic.marks}`);
          }
        }
      }
    }

    // Validate exam type
    if (exam.examType !== 'bcs' && exam.examType !== 'bank') {
      errors.push(`Exam ${exam.id} has invalid examType: ${exam.examType}`);
    }

    // Validate domain totals
    for (const domain of exam.domains) {
      const topicMarksSum = domain.topics.reduce((sum, topic) => sum + topic.marks, 0);
      if (domain.marks !== topicMarksSum) {
        warnings.push(
          `Domain ${domain.id} marks mismatch: expected ${domain.marks}, actual ${topicMarksSum}`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    stats: {
      examCount: exams.length,
      domainCount: stats.domainCount,
      topicCount: stats.topicCount,
      subtopicCount: stats.subtopicCount,
      totalMarks: stats.totalMarks,
    },
  };
}

/**
 * Validates domain-level mark consistency
 */
export function validateDomainMarks(domain: Domain): { valid: boolean; actual: number; expected: number } {
  const actual = domain.topics.reduce((sum, topic) => sum + topic.marks, 0);
  return {
    valid: actual === domain.marks,
    actual,
    expected: domain.marks,
  };
}

/**
 * Validates topic's subtopics
 */
export function validateTopicSubtopics(topic: Topic): { valid: boolean; count: number } {
  const valid = topic.subtopics.every(subtopic =>
    subtopic.id &&
    subtopic.name?.en &&
    subtopic.marks >= 0
  );
  return { valid, count: topic.subtopics.length };
}