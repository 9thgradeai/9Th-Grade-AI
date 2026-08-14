import type {
  User,
  Exam,
  Subject,
  Topic,
  Question,
  Performance,
  Roadmap,
  DailyTask,
  RevisionItem,
  AIBriefing,
  TestResult,
} from '@/lib/types'

/* ============================================================
   Mock data — realistic sample data, structured for a backend
   swap. Official syllabi are configurable, never presented as
   unassailable fact.
   ============================================================ */

export const user: User = {
  id: 'u_01',
  name: 'Rafi Ahmed',
  firstName: 'Rafi',
  email: 'rafi@example.com',
  timezone: 'Asia/Dhaka',
  createdAt: '2026-06-18T00:00:00.000Z',
}

export const exams: Exam[] = [
  {
    id: 'exam_bcs',
    slug: 'bcs',
    name: 'BCS',
    shortName: 'BCS',
    tagline: 'Bangladesh Civil Service',
    description:
      'The flagship competitive civil service examination. Multi-stage, syllabus-driven, and the highest-stakes first-class recruitment in Bangladesh.',
    color: '#4f7cff',
    icon: 'shield',
    configurableSyllabus: true,
  },
  {
    id: 'exam_bank',
    slug: 'bank-ad',
    name: 'Bangladesh Bank AD',
    shortName: 'Bank AD',
    tagline: 'Assistant Director',
    description:
      'A first-class competitive examination for Assistant Director and similar roles at Bangladesh Bank, focusing on analytical and aptitude aptitude.',
    color: '#22d3ee',
    icon: 'bank',
    configurableSyllabus: true,
  },
  {
    id: 'exam_9th',
    slug: '9th-grade',
    name: '9th-Grade Govt Jobs',
    shortName: '9th Grade',
    tagline: 'Government recruitment',
    description:
      'Ninth-grade government recruitment examinations across ministries and agencies. Syllabi vary by the specific recruitment — kept configurable.',
    color: '#8b5cf6',
    icon: 'briefcase',
    configurableSyllabus: true,
  },
  {
    id: 'exam_ntrca',
    slug: 'ntrca',
    name: 'NTRCA',
    shortName: 'NTRCA',
    tagline: 'Teachers recruitment',
    description:
      'Non-Government Teachers Registration and Certification Authority examinations for school and college teaching posts.',
    color: '#34d399',
    icon: 'graduation',
    configurableSyllabus: true,
  },
  {
    id: 'exam_other',
    slug: 'other',
    name: 'Other Competitive',
    shortName: 'Other',
    tagline: 'First-class recruitment',
    description:
      'A growing ecosystem of first-class competitive examinations. Add and configure any syllabus.',
    color: '#9aa3b8',
    icon: 'sparkles',
    configurableSyllabus: true,
  },
]

/* --- BCS subject structure --- */

export const subjects: Subject[] = [
  { id: 's_bn', examId: 'exam_bcs', name: 'Bangla Language & Literature', nameBn: 'বাংলা ভাষা ও সাহিত্য', weight: 30, mastery: 68, accuracy: 74, speed: 80, retention: 71 },
  { id: 's_en', examId: 'exam_bcs', name: 'English Language and Literature', nameBn: 'ইংরেজি ভাষা ও সাহিত্য', weight: 30, mastery: 61, accuracy: 66, speed: 78, retention: 60 },
  { id: 's_bd', examId: 'exam_bcs', name: 'Bangladesh Affairs', nameBn: 'বাংলাদেশ বিষয়াবলি', weight: 25, mastery: 72, accuracy: 79, speed: 84, retention: 77 },
  { id: 's_int', examId: 'exam_bcs', name: 'International Affairs', nameBn: 'আন্তর্জাতিক বিষয়াবলি', weight: 25, mastery: 48, accuracy: 54, speed: 72, retention: 44 },
  { id: 's_geo', examId: 'exam_bcs', name: 'Geography, Environment & Disaster Management', nameBn: 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা', weight: 10, mastery: 60, accuracy: 65, speed: 74, retention: 62 },
  { id: 's_sci', examId: 'exam_bcs', name: 'General Science', nameBn: 'সাধারণ বিজ্ঞান', weight: 15, mastery: 58, accuracy: 62, speed: 70, retention: 55 },
  { id: 's_ict', examId: 'exam_bcs', name: 'Computer & Information Technology', nameBn: 'কম্পিউটার ও তথ্য প্রযুক্তি', weight: 15, mastery: 76, accuracy: 82, speed: 86, retention: 79 },
  { id: 's_math', examId: 'exam_bcs', name: 'Mathematical Reasoning', nameBn: 'গাণিতিক যুক্তি', weight: 20, mastery: 54, accuracy: 58, speed: 64, retention: 50 },
  { id: 's_mental', examId: 'exam_bcs', name: 'Mental Ability', nameBn: 'মানসিক দক্ষতা', weight: 15, mastery: 83, accuracy: 86, speed: 88, retention: 82 },
  { id: 's_ethics', examId: 'exam_bcs', name: 'Ethics, Values & Good Governance', nameBn: 'নৈতিকতা, মূল্যবোধ ও সু-শাসন', weight: 15, mastery: 64, accuracy: 70, speed: 76, retention: 66 },
]

export const topics: Topic[] = [
  { id: 't_sandhi', subjectId: 's_bn', name: 'Sandhi', mastery: 74, accuracy: 79, speed: 82, retention: 76, status: 'practicing' },
  { id: 't_samas', subjectId: 's_bn', name: 'Samas', mastery: 66, accuracy: 71, speed: 78, retention: 68, status: 'practicing' },
  { id: 't_karok', subjectId: 's_bn', name: 'Karok & Bibhakti', mastery: 59, accuracy: 63, speed: 74, retention: 61, status: 'learning' },
  { id: 't_synonym', subjectId: 's_en', name: 'Synonyms & Antonyms', mastery: 63, accuracy: 67, speed: 79, retention: 58, status: 'practicing', reviewDue: 1 },
  { id: 't_grammar', subjectId: 's_en', name: 'Grammar', mastery: 58, accuracy: 63, speed: 76, retention: 60, status: 'learning' },
  { id: 't_verbal', subjectId: 's_en', name: 'Verbal Ability', mastery: 71, accuracy: 76, speed: 84, retention: 74, status: 'practicing' },
  { id: 't_liberation', subjectId: 's_bd', name: 'Liberation War', mastery: 81, accuracy: 85, speed: 88, retention: 84, status: 'mastered' },
  { id: 't_constitution', subjectId: 's_bd', name: 'Constitutional Articles', mastery: 69, accuracy: 74, speed: 82, retention: 66, status: 'practicing', reviewDue: 2 },
  { id: 't_un', subjectId: 's_int', name: 'United Nations System', mastery: 44, accuracy: 49, speed: 68, retention: 40, status: 'learning', reviewDue: 1 },
  { id: 't_org', subjectId: 's_int', name: 'International Organizations', mastery: 47, accuracy: 52, speed: 70, retention: 43, status: 'learning', reviewDue: 1 },
  { id: 't_phys', subjectId: 's_sci', name: 'Physics Formulas', mastery: 53, accuracy: 57, speed: 66, retention: 50, status: 'learning', reviewDue: 3 },
  { id: 't_chem', subjectId: 's_sci', name: 'Chemistry Basics', mastery: 61, accuracy: 65, speed: 73, retention: 58, status: 'practicing' },
  { id: 't_arithmetic', subjectId: 's_math', name: 'Arithmetic', mastery: 78, accuracy: 81, speed: 74, retention: 75, status: 'mastered' },
  { id: 't_profit', subjectId: 's_math', name: 'Percentage & Profit/Loss', mastery: 47, accuracy: 51, speed: 58, retention: 44, status: 'learning', reviewDue: 2 },
  { id: 't_algebra', subjectId: 's_math', name: 'Algebra', mastery: 64, accuracy: 68, speed: 70, retention: 61, status: 'practicing' },
  { id: 't_geometry', subjectId: 's_math', name: 'Geometry', mastery: 51, accuracy: 55, speed: 62, retention: 48, status: 'learning', reviewDue: 1 },
  { id: 't_speed', subjectId: 's_mental', name: 'Speed & Distance', mastery: 86, accuracy: 89, speed: 90, retention: 85, status: 'mastered' },
  { id: 't_series', subjectId: 's_mental', name: 'Series & Sequences', mastery: 81, accuracy: 84, speed: 87, retention: 80, status: 'mastered' },
]

/* --- Sample question bank (Percentage & Profit/Loss) --- */

export const questions: Question[] = [
  {
    id: 'q_1',
    topicId: 't_profit',
    prompt: 'If an item is bought for ৳500 and sold for ৳600, what is the profit percentage?',
    options: ['15%', '18%', '20%', '25%'],
    difficulty: 2,
    targetSeconds: 40,
  },
  {
    id: 'q_2',
    topicId: 't_profit',
    prompt: 'A trader marks goods 25% above cost and gives a 10% discount. What is the net profit percentage?',
    options: ['10%', '12.5%', '15%', '13.75%'],
    difficulty: 4,
    targetSeconds: 60,
  },
  {
    id: 'q_3',
    topicId: 't_profit',
    prompt: 'By selling a book for ৳180 a shopkeeper loses 10%. What was the cost price?',
    options: ['৳198', '৳200', '৳162', '৳190'],
    difficulty: 3,
    targetSeconds: 50,
  },
  {
    id: 'q_4',
    topicId: 't_profit',
    prompt: 'A shopkeeper sells two items at ৳1,200 each; one at 20% profit and one at 20% loss. Net result?',
    options: ['No profit, no loss', '4% loss', '4% profit', '2% profit'],
    difficulty: 5,
    targetSeconds: 70,
  },
  {
    id: 'q_5',
    topicId: 't_profit',
    prompt: 'What is 18% of 450?',
    options: ['72', '81', '79', '86'],
    difficulty: 1,
    targetSeconds: 25,
  },
  {
    id: 'q_6',
    topicId: 't_un',
    prompt: 'The UN was established in which year?',
    options: ['1919', '1945', '1948', '1950'],
    difficulty: 1,
    targetSeconds: 20,
  },
  {
    id: 'q_7',
    topicId: 't_un',
    prompt: 'The UN Security Council has how many permanent members?',
    options: ['5', '10', '15', '7'],
    difficulty: 1,
    targetSeconds: 20,
  },
  {
    id: 'q_8',
    topicId: 't_geometry',
    prompt: 'The sum of interior angles of a hexagon is:',
    options: ['540°', '720°', '900°', '1080°'],
    difficulty: 2,
    targetSeconds: 35,
  },
]

/* --- Performance snapshot --- */

export const performance: Performance = {
  mastery: 67,
  syllabusCoverage: 54,
  consistency: 82,
  accuracy: 71,
  speed: 76,
  retention: 64,
  examReadiness: 71,
  potentialScore: 86,
  percentile: 87.4,
  targetPercentile: 95,
  projectedPercentile: 91.2,
  trajectory: [38, 42, 45, 44, 50, 54, 52, 58, 61, 60, 65, 67],
  studyHistory: [
    { day: 'Mon', minutes: 95 },
    { day: 'Tue', minutes: 130 },
    { day: 'Wed', minutes: 80 },
    { day: 'Thu', minutes: 145 },
    { day: 'Fri', minutes: 60 },
    { day: 'Sat', minutes: 160 },
    { day: 'Sun', minutes: 120 },
  ],
  streakDays: 12,
}

/* --- Roadmap --- */

export const roadmap: Roadmap = {
  examId: 'exam_bcs',
  examName: '50th BCS',
  examDate: '2026-12-28T00:00:00.000Z',
  daysRemaining: 142,
  currentMastery: 41,
  targetMastery: 85,
  dailyEffortMinutes: 135,
  phases: [
    { id: 'rp1', title: 'Diagnostic', week: 1, weeks: 1, focus: 'Establish baseline across all subjects' },
    { id: 'rp2', title: 'Foundation', week: 2, weeks: 4, focus: 'Build core concepts in Bangla, English & Mathematics' },
    { id: 'rp3', title: 'Syllabus Coverage', week: 6, weeks: 10, focus: 'Systematic coverage of the full syllabus' },
    { id: 'rp4', title: 'Weakness Elimination', week: 16, weeks: 6, focus: 'Target the highest-leverage weak topics' },
    { id: 'rp5', title: 'Adaptive Practice', week: 22, weeks: 6, focus: 'Adaptive testing with response-time analysis' },
    { id: 'rp6', title: 'Mock Simulation', week: 28, weeks: 5, focus: 'Full exam simulations under timed conditions' },
    { id: 'rp7', title: 'Revision', week: 33, weeks: 4, focus: 'Memory-engine driven final revision' },
    { id: 'rp8', title: 'Exam Ready', week: 37, weeks: 3, focus: 'Consolidation, calm, readiness' },
  ],
  priorities: ['English Grammar', 'Mathematics', 'International Affairs'],
}

/* --- Daily mission --- */

export const dailyTasks: DailyTask[] = [
  { id: 'd_1', subject: 'English', topic: 'Grammar', kind: 'practice', durationMinutes: 30, priority: 'high', impact: 'high', expectedQuestions: 20, status: 'pending' },
  { id: 'd_2', subject: 'Mathematics', topic: 'Profit & Loss', kind: 'practice', durationMinutes: 40, priority: 'high', impact: 'high', expectedQuestions: 25, status: 'pending' },
  { id: 'd_3', subject: 'International Affairs', topic: 'UN System', kind: 'practice', durationMinutes: 25, priority: 'medium', impact: 'medium', expectedQuestions: 15, status: 'pending' },
  { id: 'd_4', subject: 'Bangla', topic: 'Karok & Bibhakti', kind: 'revision', durationMinutes: 20, priority: 'medium', impact: 'medium', status: 'pending' },
  { id: 'd_5', subject: 'Mixed', topic: 'Daily Mini Test', kind: 'test', durationMinutes: 15, priority: 'low', impact: 'medium', expectedQuestions: 10, status: 'pending' },
]

/* --- Revision items --- */

export const revisionItems: RevisionItem[] = [
  { id: 'r_1', topic: 'Constitutional Articles', subject: 'Bangladesh Affairs', memoryStrength: 52, lastReviewed: '2d ago', nextReview: 'Today', overdue: true },
  { id: 'r_2', topic: 'Synonyms & Antonyms', subject: 'English', memoryStrength: 61, lastReviewed: '1d ago', nextReview: 'Today', overdue: true },
  { id: 'r_3', topic: 'International Organizations', subject: 'International Affairs', memoryStrength: 38, lastReviewed: '3d ago', nextReview: 'Today', overdue: true },
  { id: 'r_4', topic: 'Physics Formulas', subject: 'General Science', memoryStrength: 47, lastReviewed: '1d ago', nextReview: 'Tomorrow', overdue: false },
  { id: 'r_5', topic: 'Percentage & Profit/Loss', subject: 'Mathematics', memoryStrength: 44, lastReviewed: 'Today', nextReview: 'In 2 days', overdue: false },
]

/* --- AI briefing --- */

export const aiBriefing: AIBriefing = {
  id: 'br_1',
  title: 'AI Briefing',
  items: [
    'Your accuracy improved 8% this week.',
    'Mathematics remains your largest scoring opportunity.',
    '17 revision items are becoming overdue.',
    'Your plan has been adjusted to +20 min/day on Mathematics.',
  ],
}

/* --- Sample test result --- */

export const sampleResult: TestResult = {
  id: 'res_1',
  testId: 'test_1',
  score: 72,
  accuracy: 78,
  speed: 69,
  retention: 74,
  percentile: 84,
  correct: 36,
  total: 50,
  timeSpentMinutes: 42,
  attempts: [],
  losses: { Mathematics: 12, English: 6, 'International Affairs': 4 },
  diagnosis:
    'Your mathematics errors are concentrated around percentage-based problems. You answer them quickly but frequently slip the final computation.',
  nextBestAction: 'Complete a targeted Percentage + Profit/Loss session.',
  targetTopicId: 't_profit',
  completedAt: '2026-08-08T00:00:00.000Z',
}
