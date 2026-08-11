/* ============================================================
   Canonical BCS Preliminary syllabus — single source of truth.

   Exam → Subject → Section → Topic.

   The subject `id` fields match the `Subject.id` values returned by
   the service layer (`api.listSubjects` / mock data) so every feature
   (dashboard, subject detail, practice, revision) stays in sync from
   one definition. Marks sum to 200 across the 10 subjects.

   Add a new exam here (or in the backend seed catalog) rather than
   forking these definitions into individual components.
   ============================================================ */

export interface SyllabusTopic {
  id: string
  name: string
  /** Optional mapping to a Topic.id in the question/revision layer. */
  topicId?: string
}

export interface SyllabusSection {
  name: string
  topics: SyllabusTopic[]
}

export interface ExamSubject {
  id: string
  name: string
  nameBn: string
  /** Contribution to the 200-mark preliminary total. */
  marks: number
  /** Short strategic label used by the dashboard. */
  priority: 'high' | 'medium' | 'low'
  sections: SyllabusSection[]
}

export interface ExamSyllabus {
  id: string
  name: string
  shortName: string
  totalMarks: number
  subjects: ExamSubject[]
}

export const BCS_PRELIMINARY: ExamSyllabus = {
  id: 'bcs-preliminary',
  name: '51st BCS Preliminary',
  shortName: 'BCS Prelim',
  totalMarks: 200,
  subjects: [
    {
      id: 's_bn',
      name: 'Bangla Language & Literature',
      nameBn: 'বাংলা ভাষা ও সাহিত্য',
      marks: 30,
      priority: 'high',
      sections: [
        {
          name: 'ভাষা',
          topics: [
            { id: 'bn_language', name: 'বাংলা ব্যাকরণ', topicId: 't_karok' },
            { id: 'bn_sandhi', name: 'সন্ধি ও সন্ধিবিচ্ছেদ', topicId: 't_sandhi' },
            { id: 'bn_samas', name: 'সমাস', topicId: 't_samas' },
            { id: 'bn_bibhakti', name: 'কারক ও বিভক্তি', topicId: 't_karok' },
          ],
        },
        {
          name: 'সাহিত্য',
          topics: [
            { id: 'bn_padya', name: 'পদ্য (মধ্যযুগ ও আধুনিক)', topicId: 't_sandhi' },
            { id: 'bn_gadya', name: 'গদ্য ও প্রবন্ধ', topicId: 't_samas' },
            { id: 'bn_biography', name: 'জীবনী ও সাহিত্যিক পরিচিতি', topicId: 't_karok' },
          ],
        },
      ],
    },
    {
      id: 's_en',
      name: 'English Language and Literature',
      nameBn: 'ইংরেজি ভাষা ও সাহিত্য',
      marks: 30,
      priority: 'high',
      sections: [
        {
          name: 'Language',
          topics: [
            { id: 'en_grammar', name: 'Grammar', topicId: 't_grammar' },
            { id: 'en_vocab', name: 'Synonyms & Antonyms', topicId: 't_synonym' },
            { id: 'en_verbal', name: 'Verbal Ability', topicId: 't_verbal' },
            { id: 'en_reading', name: 'Reading Comprehension', topicId: 't_grammar' },
          ],
        },
        {
          name: 'Literature',
          topics: [
            { id: 'en_poetry', name: 'Poetry & Prose', topicId: 't_verbal' },
            { id: 'en_authors', name: 'Authors & Works', topicId: 't_synonym' },
          ],
        },
      ],
    },
    {
      id: 's_bd',
      name: 'Bangladesh Affairs',
      nameBn: 'বাংলাদেশ বিষয়াবলি',
      marks: 25,
      priority: 'high',
      sections: [
        {
          name: 'National Affairs',
          topics: [
            { id: 'bd_history', name: 'History & Liberation War', topicId: 't_liberation' },
            { id: 'bd_constitution', name: 'Constitution & Amendments', topicId: 't_constitution' },
            { id: 'bd_politics', name: 'Political & Government System', topicId: 't_constitution' },
            { id: 'bd_economy', name: 'Economy & Development', topicId: 't_liberation' },
            { id: 'bd_agri', name: 'Agriculture & Population', topicId: 't_constitution' },
          ],
        },
      ],
    },
    {
      id: 's_int',
      name: 'International Affairs',
      nameBn: 'আন্তর্জাতিক বিষয়াবলি',
      marks: 25,
      priority: 'high',
      sections: [
        {
          name: 'Global System',
          topics: [
            { id: 'int_un', name: 'United Nations System', topicId: 't_un' },
            { id: 'int_org', name: 'International Organizations', topicId: 't_org' },
            { id: 'int_geo', name: 'Geography & World Affairs', topicId: 't_org' },
          ],
        },
      ],
    },
    {
      id: 's_geo',
      name: 'Geography, Environment & Disaster Management',
      nameBn: 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা',
      marks: 10,
      priority: 'medium',
      sections: [
        {
          name: 'Geography',
          topics: [
            { id: 'geo_phys', name: 'Physical Geography', topicId: 't_phys' },
            { id: 'geo_bd', name: 'Bangladesh Geography', topicId: 't_chem' },
          ],
        },
        {
          name: 'Environment',
          topics: [
            { id: 'env_eco', name: 'Ecology & Environment', topicId: 't_chem' },
            { id: 'env_disaster', name: 'Disaster Management', topicId: 't_phys' },
          ],
        },
      ],
    },
    {
      id: 's_sci',
      name: 'General Science',
      nameBn: 'সাধারণ বিজ্ঞান',
      marks: 15,
      priority: 'medium',
      sections: [
        {
          name: 'Science',
          topics: [
            { id: 'sci_phys', name: 'Physics', topicId: 't_phys' },
            { id: 'sci_chem', name: 'Chemistry', topicId: 't_chem' },
            { id: 'sci_bio', name: 'Biology & Everyday Science', topicId: 't_chem' },
          ],
        },
      ],
    },
    {
      id: 's_ict',
      name: 'Computer & Information Technology',
      nameBn: 'কম্পিউটার ও তথ্য প্রযুক্তি',
      marks: 15,
      priority: 'medium',
      sections: [
        {
          name: 'ICT',
          topics: [
            { id: 'ict_basics', name: 'Computer Fundamentals', topicId: 't_phys' },
            { id: 'ict_net', name: 'Networking & Internet', topicId: 't_chem' },
            { id: 'ict_cyber', name: 'Cyber Security & Ethics', topicId: 't_chem' },
          ],
        },
      ],
    },
    {
      id: 's_math',
      name: 'Mathematical Reasoning',
      nameBn: 'গাণিতিক যুক্তি',
      marks: 20,
      priority: 'high',
      sections: [
        {
          name: 'Arithmetic',
          topics: [
            { id: 'math_arithmetic', name: 'Arithmetic', topicId: 't_arithmetic' },
            { id: 'math_profit', name: 'Percentage & Profit/Loss', topicId: 't_profit' },
          ],
        },
        {
          name: 'Algebra & Geometry',
          topics: [
            { id: 'math_algebra', name: 'Algebra', topicId: 't_algebra' },
            { id: 'math_geometry', name: 'Geometry', topicId: 't_geometry' },
          ],
        },
      ],
    },
    {
      id: 's_mental',
      name: 'Mental Ability',
      nameBn: 'মানসিক দক্ষতা',
      marks: 15,
      priority: 'medium',
      sections: [
        {
          name: 'Mental Ability',
          topics: [
            { id: 'mental_series', name: 'Series & Sequences', topicId: 't_series' },
            { id: 'mental_speed', name: 'Speed & Distance', topicId: 't_speed' },
            { id: 'mental_puzzles', name: 'Puzzles & Reasoning', topicId: 't_series' },
          ],
        },
      ],
    },
    {
      id: 's_ethics',
      name: 'Ethics, Values & Good Governance',
      nameBn: 'নৈতিকতা, মূল্যবোধ ও সু-শাসন',
      marks: 15,
      priority: 'medium',
      sections: [
        {
          name: 'Ethics & Governance',
          topics: [
            { id: 'eth_morality', name: 'Morality & Ethics', topicId: 't_speed' },
            { id: 'eth_governance', name: 'Good Governance', topicId: 't_series' },
            { id: 'eth_constitution', name: 'Constitutional Values', topicId: 't_constitution' },
          ],
        },
      ],
    },
  ],
}

/** Convenience lookups. */
export const SUBJECT_BY_ID: Map<string, ExamSubject> = new Map(BCS_PRELIMINARY.subjects.map((s) => [s.id, s]))
export function subjectById(id: string): ExamSubject | undefined {
  return SUBJECT_BY_ID.get(id)
}

/** Sum of marks — should always equal 200 for the preliminary. */
export const TOTAL_MARKS = BCS_PRELIMINARY.subjects.reduce((sum, s) => sum + s.marks, 0)
