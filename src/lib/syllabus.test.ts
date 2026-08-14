import { examSyllabus } from './syllabus';
import { validateExamSyllabus } from './syllabus-validation';

// Test the syllabus data
const validationResult = validateExamSyllabus(examSyllabus);

console.log('Syllabus Validation Results:');
console.log('============================');
console.log(`Valid: ${validationResult.isValid}`);
console.log(`Exam Count: ${validationResult.stats.examCount}`);
console.log(`Domain Count: ${validationResult.stats.domainCount}`);
console.log(`Topic Count: ${validationResult.stats.topicCount}`);
console.log(`Subtopic Count: ${validationResult.stats.subtopicCount}`);
console.log(`Total Marks: ${validationResult.stats.totalMarks}`);

if (validationResult.warnings.length > 0) {
  console.log('\nWarnings:');
  validationResult.warnings.forEach((w, i) => console.log(`${i + 1}. ${w}`));
}

if (validationResult.errors.length > 0) {
  console.log('\nErrors:');
  validationResult.errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
}

// Additional validation: check BCS total marks
const bcsExam = examSyllabus.find(e => e.id === 'bcs');
if (bcsExam) {
  const bcsTotal = bcsExam.domains.reduce((sum, d) => sum + d.marks, 0);
  console.log(`\nBCS Total Marks: ${bcsTotal} (should be 200)`);
}

// Additional validation: check Bank total marks
const bankExam = examSyllabus.find(e => e.id === 'bank');
if (bankExam) {
  const bankTotal = bankExam.domains.reduce((sum, d) => sum + d.marks, 0);
  console.log(`Bank Total Marks: ${bankTotal} (should be 100)`);
}