/* ============================================================
   Catalog seed data — the shared syllabus that every user studies.
   Mirrors the shapes expected by the frontend (src/lib/types.ts) so
   the API responses line up with the existing UI with zero changes.

   Official syllabi are intentionally configurable — these are a
   sensible default, never presented as unassailable fact.
   ============================================================ */

export interface SeedExam {
  id: string
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  color: string
  icon: string
  configurableSyllabus: boolean
}

export interface SeedSubject {
  id: string
  examId: string
  name: string
  nameBn?: string
  weight: number
  sortOrder: number
}

export interface SeedTopic {
  id: string
  subjectId: string
  name: string
}

export interface SeedQuestion {
  id: string
  topicId: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: number // 1-5
  targetSeconds: number
  tags: string[]
}

export const exams: SeedExam[] = [
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

/* --- BCS subject structure (the primary target exam) --- */

export const subjects: SeedSubject[] = [
  { id: 's_bn', examId: 'exam_bcs', name: 'Bangla', nameBn: 'বাংলা', weight: 35, sortOrder: 1 },
  { id: 's_en', examId: 'exam_bcs', name: 'English', nameBn: 'ইংরেজি', weight: 35, sortOrder: 2 },
  { id: 's_bd', examId: 'exam_bcs', name: 'Bangladesh Affairs', nameBn: 'বাংলাদেশ বিষয়াবলি', weight: 30, sortOrder: 3 },
  { id: 's_int', examId: 'exam_bcs', name: 'International Affairs', nameBn: 'আন্তর্জাতিক বিষয়াবলি', weight: 20, sortOrder: 4 },
  { id: 's_sci', examId: 'exam_bcs', name: 'General Science', nameBn: 'সাধারণ বিজ্ঞান', weight: 15, sortOrder: 5 },
  { id: 's_ict', examId: 'exam_bcs', name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', weight: 15, sortOrder: 6 },
  { id: 's_math', examId: 'exam_bcs', name: 'Mathematical Reasoning', nameBn: 'গাণিতিক যুক্তি', weight: 15, sortOrder: 7 },
  { id: 's_mental', examId: 'exam_bcs', name: 'Mental Ability', nameBn: 'মানসিক দক্ষতা', weight: 15, sortOrder: 8 },
  { id: 's_ethics', examId: 'exam_bcs', name: 'Ethics & Governance', nameBn: 'নৈতিকতা ও সুশাসন', weight: 15, sortOrder: 9 },
  { id: 's_geo', examId: 'exam_bcs', name: 'Geography', nameBn: 'ভূগোল', weight: 15, sortOrder: 10 },
]

export const topics: SeedTopic[] = [
  { id: 't_sandhi', subjectId: 's_bn', name: 'Sandhi' },
  { id: 't_samas', subjectId: 's_bn', name: 'Samas' },
  { id: 't_karok', subjectId: 's_bn', name: 'Karok & Bibhakti' },
  { id: 't_synonym', subjectId: 's_en', name: 'Synonyms & Antonyms' },
  { id: 't_grammar', subjectId: 's_en', name: 'Grammar' },
  { id: 't_verbal', subjectId: 's_en', name: 'Verbal Ability' },
  { id: 't_liberation', subjectId: 's_bd', name: 'Liberation War' },
  { id: 't_constitution', subjectId: 's_bd', name: 'Constitutional Articles' },
  { id: 't_un', subjectId: 's_int', name: 'United Nations System' },
  { id: 't_org', subjectId: 's_int', name: 'International Organizations' },
  { id: 't_phys', subjectId: 's_sci', name: 'Physics Formulas' },
  { id: 't_chem', subjectId: 's_sci', name: 'Chemistry Basics' },
  { id: 't_arithmetic', subjectId: 's_math', name: 'Arithmetic' },
  { id: 't_profit', subjectId: 's_math', name: 'Percentage & Profit/Loss' },
  { id: 't_algebra', subjectId: 's_math', name: 'Algebra' },
  { id: 't_geometry', subjectId: 's_math', name: 'Geometry' },
  { id: 't_speed', subjectId: 's_mental', name: 'Speed & Distance' },
  { id: 't_series', subjectId: 's_mental', name: 'Series & Sequences' },
]

/* --- Question bank ---
   A deterministic set across the topics above. Enough volume to build
   topic tests and mixed mock tests with real variety. */

export const questions: SeedQuestion[] = [
  // Bangla — Sandhi
  {
    id: 'q_sandhi_1', topicId: 't_sandhi',
    prompt: '“বিদ্যালয়” শব্দটি কোন সন্ধির উদাহরণ?',
    options: ['স্বর সন্ধি', 'ব্যঞ্জন সন্ধি', 'বিসর্গ সন্ধি', 'স্বরধ্বনি লোপ'],
    correctIndex: 0, difficulty: 2, targetSeconds: 30, tags: ['bangla', 'sandhi'],
    explanation: 'ই + আ = য। বিদ্যা + আলয় = বিদ্যালয় — এখানে স্বরধ্বনির মিলন হওয়ায় এটি স্বর সন্ধি।',
  },
  {
    id: 'q_sandhi_2', topicId: 't_sandhi',
    prompt: '“নরপতি” কোন সন্ধির উদাহরণ?',
    options: ['স্বর সন্ধি', 'ব্যঞ্জন সন্ধি', 'বিসর্গ সন্ধি', 'সংযোজক সন্ধি'],
    correctIndex: 2, difficulty: 3, targetSeconds: 35, tags: ['bangla', 'sandhi'],
    explanation: 'নর + পতি = নরপতি — এখানে বিসর্গ (:) লোপ পেয়েছে, তাই এটি বিসর্গ সন্ধি।',
  },
  // Bangla — Karok
  {
    id: 'q_karok_1', topicId: 't_karok',
    prompt: '“সে ঢাকায় থাকে” — বাক্যে “ঢাকায়” কোন কারক?',
    options: ['কর্ম কারক', 'অধিকরণ কারক', 'করণ কারক', 'সম্প্রদান কারক'],
    correctIndex: 1, difficulty: 2, targetSeconds: 30, tags: ['bangla', 'karok'],
    explanation: 'যেখানে থাকা বোঝায় তা অধিকরণ কারক। “ঢাকায়” = অবস্থানের স্থান।',
  },
  // English — Synonyms & Antonyms
  {
    id: 'q_synonym_1', topicId: 't_synonym',
    prompt: 'Which word is the closest synonym of "abundant"?',
    options: ['Scarce', 'Plentiful', 'Sparse', 'Meagre'],
    correctIndex: 1, difficulty: 2, targetSeconds: 25, tags: ['english', 'vocabulary'],
    explanation: 'Abundant means existing in large quantities — plentiful is the synonym; the rest are antonyms.',
  },
  {
    id: 'q_synonym_2', topicId: 't_synonym',
    prompt: 'Which word is an antonym of "transparent"?',
    options: ['Clear', 'Lucid', 'Opaque', 'Visible'],
    correctIndex: 2, difficulty: 2, targetSeconds: 25, tags: ['english', 'vocabulary'],
    explanation: 'Transparent = clear / see-through; its opposite is opaque (not see-through).',
  },
  // English — Grammar
  {
    id: 'q_grammar_1', topicId: 't_grammar',
    prompt: 'Choose the correct sentence:',
    options: [
      'He is senior than me.',
      'He is senior to me.',
      'He is senior of me.',
      'He is senior from me.',
    ],
    correctIndex: 1, difficulty: 3, targetSeconds: 35, tags: ['english', 'grammar'],
    explanation: 'The adjective "senior" takes "to" (not "than"): "senior to me".',
  },
  {
    id: 'q_grammar_2', topicId: 't_grammar',
    prompt: 'Identify the correct passive voice of: "People speak English all over the world."',
    options: [
      'English is spoken all over the world.',
      'English was spoken all over the world.',
      'English is being spoken all over the world.',
      'English has been spoken all over the world.',
    ],
    correctIndex: 0, difficulty: 3, targetSeconds: 35, tags: ['english', 'grammar'],
    explanation: 'Present simple active → present simple passive: "English is spoken ...".',
  },
  // Bangladesh Affairs — Liberation War
  {
    id: 'q_liberation_1', topicId: 't_liberation',
    prompt: 'Bangladesh achieved independence in which year?',
    options: ['1969', '1970', '1971', '1972'],
    correctIndex: 2, difficulty: 1, targetSeconds: 20, tags: ['bd', 'liberation'],
    explanation: 'Bangladesh gained independence on 16 December 1971 after the Liberation War.',
  },
  {
    id: 'q_liberation_2', topicId: 't_liberation',
    prompt: 'Which document was the provisional declaration of independence issued on 26 March 1971?',
    options: [
      'The Proclamation of Independence',
      'The Lahore Resolution',
      'The Six Point Programme',
      'The Mujibnagar Charter',
    ],
    correctIndex: 0, difficulty: 3, targetSeconds: 35, tags: ['bd', 'liberation'],
    explanation: 'The Declaration of Independence was proclaimed on 26 March 1971; the formal Proclamation was issued at Mujibnagar in April.',
  },
  // Bangladesh Affairs — Constitution
  {
    id: 'q_constitution_1', topicId: 't_constitution',
    prompt: 'The Constitution of Bangladesh came into force on which date?',
    options: ['16 December 1971', '16 December 1972', '4 November 1972', '26 March 1972'],
    correctIndex: 1, difficulty: 2, targetSeconds: 30, tags: ['bd', 'constitution'],
    explanation: 'The Constitution was adopted on 4 November 1972 and came into effect on 16 December 1972.',
  },
  // International Affairs — UN System
  {
    id: 'q_un_1', topicId: 't_un',
    prompt: 'The UN was established in which year?',
    options: ['1919', '1945', '1948', '1950'],
    correctIndex: 1, difficulty: 1, targetSeconds: 20, tags: ['intl', 'un'],
    explanation: 'The United Nations was founded on 24 October 1945.',
  },
  {
    id: 'q_un_2', topicId: 't_un',
    prompt: 'The UN Security Council has how many permanent members?',
    options: ['5', '10', '15', '7'],
    correctIndex: 0, difficulty: 1, targetSeconds: 20, tags: ['intl', 'un'],
    explanation: 'The P5: US, UK, France, Russia, China.',
  },
  // International Affairs — Organizations
  {
    id: 'q_org_1', topicId: 't_org',
    prompt: 'The headquarters of SAARC is located in which city?',
    options: ['Dhaka', 'New Delhi', 'Kathmandu', 'Colombo'],
    correctIndex: 2, difficulty: 2, targetSeconds: 30, tags: ['intl', 'orgs'],
    explanation: 'SAARC is headquartered in Kathmandu, Nepal.',
  },
  // General Science — Physics
  {
    id: 'q_phys_1', topicId: 't_phys',
    prompt: 'The SI unit of force is:',
    options: ['Joule', 'Newton', 'Watt', 'Pascal'],
    correctIndex: 1, difficulty: 1, targetSeconds: 20, tags: ['science', 'physics'],
    explanation: 'Force is measured in newtons (N). Joule is energy, watt is power, pascal is pressure.',
  },
  {
    id: 'q_phys_2', topicId: 't_phys',
    prompt: 'Speed = Distance / Time. A car covers 120 km in 2 hours. Its speed is:',
    options: ['40 km/h', '50 km/h', '60 km/h', '120 km/h'],
    correctIndex: 2, difficulty: 1, targetSeconds: 25, tags: ['science', 'physics'],
    explanation: '120 ÷ 2 = 60 km/h.',
  },
  // General Science — Chemistry
  {
    id: 'q_chem_1', topicId: 't_chem',
    prompt: 'The chemical symbol for gold is:',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correctIndex: 2, difficulty: 1, targetSeconds: 20, tags: ['science', 'chemistry'],
    explanation: 'Gold is Au (from Latin aurum). Ag is silver.',
  },
  // Mathematics — Arithmetic
  {
    id: 'q_arithmetic_1', topicId: 't_arithmetic',
    prompt: 'What is the LCM of 12 and 18?',
    options: ['6', '24', '36', '72'],
    correctIndex: 2, difficulty: 2, targetSeconds: 30, tags: ['math', 'arithmetic'],
    explanation: 'LCM(12,18): 12=2²·3, 18=2·3² ⇒ 2²·3² = 36.',
  },
  {
    id: 'q_arithmetic_2', topicId: 't_arithmetic',
    prompt: 'The average of 10, 20, 30, 40 is:',
    options: ['20', '25', '30', '35'],
    correctIndex: 1, difficulty: 1, targetSeconds: 20, tags: ['math', 'arithmetic'],
    explanation: '(10+20+30+40)/4 = 100/4 = 25.',
  },
  // Mathematics — Percentage & Profit/Loss
  {
    id: 'q_profit_1', topicId: 't_profit',
    prompt: 'If an item is bought for ৳500 and sold for ৳600, what is the profit percentage?',
    options: ['15%', '18%', '20%', '25%'],
    correctIndex: 2, difficulty: 2, targetSeconds: 40, tags: ['math', 'profit'],
    explanation: 'Profit = 600 − 500 = ৳100. Profit % = (100/500) × 100 = 20%.',
  },
  {
    id: 'q_profit_2', topicId: 't_profit',
    prompt: 'A trader marks goods 25% above cost and gives a 10% discount. What is the net profit percentage?',
    options: ['10%', '12.5%', '15%', '13.75%'],
    correctIndex: 1, difficulty: 4, targetSeconds: 60, tags: ['math', 'profit'],
    explanation: 'Net = 1.25 × 0.90 = 1.125, i.e. 12.5% profit.',
  },
  {
    id: 'q_profit_3', topicId: 't_profit',
    prompt: 'By selling a book for ৳180 a shopkeeper loses 10%. What was the cost price?',
    options: ['৳198', '৳200', '৳162', '৳190'],
    correctIndex: 1, difficulty: 3, targetSeconds: 50, tags: ['math', 'profit'],
    explanation: 'SP = 90% of CP ⇒ CP = 180 / 0.9 = ৳200.',
  },
  {
    id: 'q_profit_4', topicId: 't_profit',
    prompt: 'A shopkeeper sells two items at ৳1,200 each; one at 20% profit and one at 20% loss. Net result?',
    options: ['No profit, no loss', '4% loss', '4% profit', '2% profit'],
    correctIndex: 1, difficulty: 5, targetSeconds: 70, tags: ['math', 'profit'],
    explanation: 'Equal SP with equal % profit & loss always yields a net loss = (p²/100)% = 4%.',
  },
  {
    id: 'q_profit_5', topicId: 't_profit',
    prompt: 'What is 18% of 450?',
    options: ['72', '81', '79', '86'],
    correctIndex: 1, difficulty: 1, targetSeconds: 25, tags: ['math', 'profit'],
    explanation: '450 × 0.18 = 81.',
  },
  {
    id: 'q_profit_6', topicId: 't_profit',
    prompt: 'A shopkeeper sells an article at a 15% profit. If the cost price is ৳400, the selling price is:',
    options: ['৳440', '৳450', '৳460', '৳470'],
    correctIndex: 2, difficulty: 2, targetSeconds: 40, tags: ['math', 'profit'],
    explanation: 'SP = 400 × 1.15 = ৳460.',
  },
  // Mathematics — Algebra
  {
    id: 'q_algebra_1', topicId: 't_algebra',
    prompt: 'If x + 5 = 12, then x = ?',
    options: ['5', '6', '7', '17'],
    correctIndex: 2, difficulty: 1, targetSeconds: 20, tags: ['math', 'algebra'],
    explanation: 'x = 12 − 5 = 7.',
  },
  {
    id: 'q_algebra_2', topicId: 't_algebra',
    prompt: '(a + b)² expands to:',
    options: ['a² + b²', 'a² + 2ab + b²', 'a² − 2ab + b²', 'a² + ab + b²'],
    correctIndex: 1, difficulty: 2, targetSeconds: 25, tags: ['math', 'algebra'],
    explanation: '(a + b)² = a² + 2ab + b².',
  },
  // Mathematics — Geometry
  {
    id: 'q_geometry_1', topicId: 't_geometry',
    prompt: 'The sum of interior angles of a hexagon is:',
    options: ['540°', '720°', '900°', '1080°'],
    correctIndex: 1, difficulty: 2, targetSeconds: 35, tags: ['math', 'geometry'],
    explanation: '(n − 2) × 180 = (6 − 2) × 180 = 720°.',
  },
  {
    id: 'q_geometry_2', topicId: 't_geometry',
    prompt: 'The area of a circle with radius 7 cm (π = 22/7) is:',
    options: ['154 cm²', '44 cm²', '49 cm²', '308 cm²'],
    correctIndex: 0, difficulty: 2, targetSeconds: 35, tags: ['math', 'geometry'],
    explanation: 'Area = πr² = (22/7) × 7 × 7 = 154 cm².',
  },
  // Mental Ability — Speed & Distance
  {
    id: 'q_speed_1', topicId: 't_speed',
    prompt: 'A train 120 m long crosses a pole in 6 seconds. Its speed is:',
    options: ['20 m/s', '18 m/s', '16 m/s', '12 m/s'],
    correctIndex: 0, difficulty: 3, targetSeconds: 45, tags: ['mental', 'speed'],
    explanation: 'Speed = distance/time = 120/6 = 20 m/s.',
  },
  {
    id: 'q_speed_2', topicId: 't_speed',
    prompt: 'A man covers 10 km in 2 hours. His average speed is:',
    options: ['3 km/h', '4 km/h', '5 km/h', '6 km/h'],
    correctIndex: 2, difficulty: 1, targetSeconds: 20, tags: ['mental', 'speed'],
    explanation: '10 ÷ 2 = 5 km/h.',
  },
  // Mental Ability — Series
  {
    id: 'q_series_1', topicId: 't_series',
    prompt: 'Find the next term: 2, 6, 12, 20, 30, ?',
    options: ['38', '40', '42', '44'],
    correctIndex: 2, difficulty: 3, targetSeconds: 40, tags: ['mental', 'series'],
    explanation: 'Differences are +4, +6, +8, +10 ⇒ next +12 = 42.',
  },
  {
    id: 'q_series_2', topicId: 't_series',
    prompt: 'Find the next term: 3, 6, 11, 18, 27, ?',
    options: ['36', '38', '40', '42'],
    correctIndex: 1, difficulty: 3, targetSeconds: 40, tags: ['mental', 'series'],
    explanation: 'Differences are +3, +5, +7, +9 ⇒ next +11 = 38.',
  },
]
