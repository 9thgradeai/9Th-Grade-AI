export interface LocalizedString {
  en: string;
  bn?: string;
}

export interface SubTopic {
  id: string;
  name: LocalizedString;
  nameBn?: string;
  marks: number;
}

export interface Topic {
  id: string;
  name: LocalizedString;
  nameBn?: string;
  marks: number;
  subtopics: SubTopic[];
}

export interface Domain {
  id: string;
  name: LocalizedString;
  nameBn?: string;
  marks: number;
  topics: Topic[];
}

export interface Exam {
  id: string
  name: string
  title: LocalizedString
  nameBn?: string
  totalMarks: number
  domains: Domain[]
  examType: 'bcs' | 'bank'
}

export const TOTAL_MARKS = 200

export const BCS_PRELIMINARY = createExamData()[0]

export function subjectById(_subjectId: string): Exam | null {
  return null
}

function createExamData(): Exam[] {
  // Helper function to create localized strings
  const ls = (en: string, bn?: string): LocalizedString => ({ en, bn });

  const bcsDomains: Domain[] = [
    // 1. বাংলা ভাষা ও সাহিত্য - 35 marks
    {
      id: 'bn_lang',
      name: ls('Bangla Language & Literature', 'বাংলা ভাষা ও সাহিত্য'),
      marks: 35,
      topics: [
        // Topic 1: প্রয়োগ-অপপ্রয়োগ, বানান ও বাক্য শুদ্ধি - 15 marks
        {
          id: 'bn_topic1',
          name: ls('Pragmi-Oprojoy, Banan O Baky Shuddhi', 'প্রয়োগ-অপপ্রয়োগ, বানান ও বাক্য শুদ্ধি'),
          marks: 15,
          subtopics: [
            { id: 'bn_sub1', name: ls('Spelling', 'বানান শুদ্ধি'), marks: 5 },
            { id: 'bn_sub2', name: ls('Syntax', 'বাক্য শুদ্ধি'), marks: 5 },
            { id: 'bn_sub3', name: ls('Usage', 'প্রয়োগ-অপপ্রয়োগ'), marks: 5 },
          ],
        },
        // Topic 2: পরিভাষা, সমার্থক ও বিপরীতার্থক শব্দ
        {
          id: 'bn_topic2',
          name: ls('Terminology, Synonyms & Antonyms', 'পরিভাষা, সমার্থক ও বিপরীতার্থক শব্দ'),
          marks: 10,
          subtopics: [
            { id: 'bn_sub4', name: ls('Terminology', 'পরিভাষা'), marks: 4 },
            { id: 'bn_sub5', name: ls('Synonyms', 'সমার্থক শব্দ'), marks: 3 },
            { id: 'bn_sub6', name: ls('Antonyms', 'বিপরীতার্থক শব্দ'), marks: 3 },
          ],
        },
        // Topic 3: ধ্বনি, বর্ণ ও শব্দ
        {
          id: 'bn_topic3',
          name: ls('Phonetics, Varna & Word', 'ধ্বনি, বর্ণ ও শব্দ'),
          marks: 10,
          subtopics: [
            { id: 'bn_sub7', name: ls('Phonetics & Varna', 'ধ্বনি ও বর্ণ'), marks: 4 },
            { id: 'bn_sub8', name: ls('Word Classification', 'শব্দের প্রকারভেদ'), marks: 3 },
            { id: 'bn_sub9', name: ls('Sound Change', 'ধ্বনি পরিবর্তন'), marks: 3 },
          ],
        },
        // Topic 4: পদ ও বাক্য
        {
          id: 'bn_topic4',
          name: ls('Word & Sentence', 'পদ ও বাক্য'),
          marks: 15,
          subtopics: [
            { id: 'bn_sub10', name: ls('Parts of Speech', 'পদের শ্রেণিবিভাগ'), marks: 5 },
            { id: 'bn_sub11', name: ls('Sentence Structure', 'বাক্যের গঠন'), marks: 5 },
            { id: 'bn_sub12', name: ls('Cases & Voice', 'কারক ও বিভক্তি'), marks: 5 },
          ],
        },
        // Topic 5: Pratya, Sandhi & Samas
        {
          id: 'bn_topic5',
          name: ls('Pratya, Sandhi & Samas', 'প্রত্যয়, সন্ধি ও সমাস'),
          marks: 11,
          subtopics: [
            { id: 'bn_sub13', name: ls('Sandhi', 'সন্ধি'), marks: 4 },
            { id: 'bn_sub14', name: ls('Compound Words', 'সমাস'), marks: 4 },
            { id: 'bn_sub15', name: ls('Pratyaya', 'প্রত্যয়'), marks: 3 },
          ],
        },
        // Topic 6: প্রাচীন ও মধ্যযুগ - 5 marks
        {
          id: 'bn_topic6',
          name: ls('Ancient & Medieval Period', 'প্রাচীন ও মধ্যযুগ'),
          marks: 5,
          subtopics: [
            { id: 'bn_sub16', name: ls('Charyapada', 'চর্যাপদ'), marks: 2 },
            { id: 'bn_sub17', name: ls('Mangalkavya', 'মঙ্গলকাব্য'), marks: 1 },
            { id: 'bn_sub18', name: ls('Vaishnava Padavali', 'বৈষ্ণব পদাবলি'), marks: 1 },
            { id: 'bn_sub19', name: ls('Moriya Literature', 'মোর্শিয়া সাহিত্য'), marks: 1 },
          ],
        },
        // Topic 7: আধুনিক যুগ - 10 marks
        {
          id: 'bn_topic7',
          name: ls('Modern Era (1800-Present)', 'আধুনিক যুগ (১৮০০-বর্তমান)'),
          marks: 10,
          subtopics: [
            { id: 'bn_sub20', name: ls('Rabindra-Nazrul Literature', 'রবীন্দ্র-নজরুল সাহিত্য'), marks: 3 },
            { id: 'bn_sub21', name: ls('Language Movement Based Literature', 'ভাষা আন্দোলন ভিত্তিক সাহিত্য'), marks: 2 },
            { id: 'bn_sub22', name: ls('Liberation War Based Literature', 'মুক্তিযুদ্ধ ভিত্তিক সাহিত্য'), marks: 3 },
            { id: 'bn_sub23', name: ls('History & Novels', 'সার্থক ইতিহাস ও উপন্যাস'), marks: 2 },
          ],
        },
      ],
    },
    // 2. English Language & Literature - 35 marks
    {
      id: 'en_lang',
      name: ls('English Language & Literature'),
      marks: 35,
      topics: [
        // Topic 1: Parts of Speech: The Noun & Pronoun
        {
          id: 'en_topic1',
          name: ls('Parts of Speech: The Noun & Pronoun'),
          marks: 9,
          subtopics: [
            { id: 'en_sub1', name: ls('Noun & Determiners'), marks: 3 },
            { id: 'en_sub2', name: ls('Pronoun Classifications'), marks: 3 },
            { id: 'en_sub3', name: ls('Gender & Number'), marks: 3 },
          ],
        },
        // Topic 2: Parts of Speech: The Verb & Modals
        {
          id: 'en_topic2',
          name: ls('Parts of Speech: The Verb & Modals'),
          marks: 12,
          subtopics: [
            { id: 'en_sub4', name: ls('Finite & Non-finite Verbs'), marks: 4 },
            { id: 'en_sub5', name: ls('Linking & Phrasal Verbs'), marks: 4 },
            { id: 'en_sub6', name: ls('Modals & Auxiliaries'), marks: 4 },
          ],
        },
        // Topic 3: Parts of Speech: Adjective, Adverb, Preposition & Conjunction
        {
          id: 'en_topic3',
          name: ls('Parts of Speech: Adjective, Adverb, Preposition & Conjunction'),
          marks: 12,
          subtopics: [
            { id: 'en_sub7', name: ls('Adjective Degrees'), marks: 4 },
            { id: 'en_sub8', name: ls('Adverbs of Frequency'), marks: 4 },
            { id: 'en_sub9', name: ls('Appropriate Prepositions'), marks: 4 },
          ],
        },
        // Topic 4: Idioms & Phrases
        {
          id: 'en_topic4',
          name: ls('Idioms & Phrases'),
          marks: 12,
          subtopics: [
            { id: 'en_sub10', name: ls('Idiomatic Expressions'), marks: 4 },
            { id: 'en_sub11', name: ls('Kinds of Phrases'), marks: 4 },
            { id: 'en_sub12', name: ls('Verbal Phrases'), marks: 4 },
          ],
        },
        // Topic 5: Clauses
        {
          id: 'en_topic5',
          name: ls('Clauses'),
          marks: 12,
          subtopics: [
            { id: 'en_sub13', name: ls('Principal Clause'), marks: 4 },
            { id: 'en_sub14', name: ls('Subordinate Noun Clause'), marks: 4 },
            { id: 'en_sub15', name: ls('Adjective & Adverbial Clauses'), marks: 4 },
          ],
        },
        // Topic 6: Corrections
        {
          id: 'en_topic6',
          name: ls('Corrections'),
          marks: 12,
          subtopics: [
            { id: 'en_sub16', name: ls('Subject-Verb Agreement'), marks: 4 },
            { id: 'en_sub17', name: ls('Tense Consistency'), marks: 4 },
            { id: 'en_sub18', name: ls('Pronoun Reference Errors'), marks: 4 },
          ],
        },
        // Topic 7: Sentences & Transformations
        {
          id: 'en_topic7',
          name: ls('Sentences & Transformations'),
          marks: 12,
          subtopics: [
            { id: 'en_sub19', name: ls('Simple/Compound/Complex'), marks: 4 },
            { id: 'en_sub20', name: ls('Active & Passive Voice'), marks: 4 },
            { id: 'en_sub21', name: ls('Degree Transformations'), marks: 4 },
          ],
        },
        // Topic 8: Words: Meanings, Synonyms & Antonyms
        {
          id: 'en_topic8',
          name: ls('Words: Meanings, Synonyms & Antonyms'),
          marks: 12,
          subtopics: [
            { id: 'en_sub22', name: ls('Contextual Synonyms'), marks: 4 },
            { id: 'en_sub23', name: ls('Antonyms'), marks: 4 },
            { id: 'en_sub24', name: ls('Analogical Words'), marks: 4 },
          ],
        },
        // Topic 9: Words: Spellings & Formations
        {
          id: 'en_topic9',
          name: ls('Words: Spellings & Formations'),
          marks: 12,
          subtopics: [
            { id: 'en_sub25', name: ls('Spelling Corrections'), marks: 4 },
            { id: 'en_sub26', name: ls('Prefixes & Suffixes'), marks: 4 },
            { id: 'en_sub27', name: ls('Inflections'), marks: 4 },
          ],
        },
        // Topic 10: Composition
        {
          id: 'en_topic10',
          name: ls('Composition'),
          marks: 8,
          subtopics: [
            { id: 'en_sub28', name: ls('Letter Writing Formats'), marks: 4 },
            { id: 'en_sub29', name: ls('Paragraph Structures'), marks: 4 },
          ],
        },
        // Topic 11: English Literature
        {
          id: 'en_topic11',
          name: ls('English Literature'),
          marks: 11,
          subtopics: [
            { id: 'en_sub30', name: ls('Elizabethan Period'), marks: 3 },
            { id: 'en_sub31', name: ls('Romantic Period'), marks: 3 },
            { id: 'en_sub32', name: ls('Victorian & Modernist Writers'), marks: 3 },
            { id: 'en_sub33', name: ls('Famous Quotations'), marks: 2 },
          ],
        },
      ],
    },
    // 3. Bangladesh Affairs - 30 marks
    {
      id: 'bd_affairs',
      name: ls('Bangladesh Affairs', 'বাংলাদেশ বিষয়াবলি'),
      marks: 30,
      topics: [
        // Topic 1: বাংলাদেশের জাতীয় বিষয়াবলি - 6 marks
        {
          id: 'bd_topic1',
          name: ls('Bangladesh National Affairs', 'বাংলাদেশের জাতীয় বিষয়াবলি'),
          marks: 6,
          subtopics: [
            { id: 'bd_sub1', name: ls('Ancient Bengal History', 'প্রাচীন বাংলার ইতিহাস'), marks: 3 },
            { id: 'bd_sub2', name: ls('Language Movement 1952', 'ভাষা আন্দোলন ১৯৫২'), marks: 2 },
            { id: 'bd_sub3', name: ls('1971 Liberation War & Background', 'মুক্তিযুদ্ধ ১৯৭১ ও পটভূমি'), marks: 3 },
          ],
        },
        // Topic 2: Bangladesh's Agricultural Resources - 3 marks
        {
          id: 'bd_topic2',
          name: ls('Bangladesh Agricultural Resources', 'বাংলাদেশের কৃষিজ সম্পদ'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub4', name: ls('Crop Diversification', 'শস্য বহুমুখীকরণ'), marks: 2 },
            { id: 'bd_sub5', name: ls('Fisheries & Livestock', 'মৎস্য ও গবাদিপশু পালন'), marks: 1 },
            { id: 'bd_sub6', name: ls('Forest & Mineral Resources', 'বনজ ও খনিজ সম্পদ'), marks: 2 },
          ],
        },
        // Topic 3: Population, Census, Nation, Group & Sub-group - 3 marks
        {
          id: 'bd_topic3',
          name: ls('Population, Census, Nation, Group & Sub-group', 'জনসংখ্যা, আদমশুমারি, জাতি, গোষ্ঠী ও উপজাতি'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub7', name: ls('Population Structure', 'জনসংখ্যা কাঠামো'), marks: 2 },
            { id: 'bd_sub8', name: ls('Population Census & Household', 'আদমশুমারি ও গৃহগণনা'), marks: 2 },
            { id: 'bd_sub9', name: ls('Sub-group Geography & Culture', 'উপজাতিদের ভৌগোলিক অবস্থান ও সংস্কৃতি'), marks: 1 },
          ],
        },
        // Topic 4: Bangladesh Economy - 3 marks
        {
          id: 'bd_topic4',
          name: ls('Bangladesh Economy', 'বাংলাদেশের অর্থনীতি'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub10', name: ls('Five-Year Plans', 'পঞ্চবার্ষিকী পরিকল্পনা'), marks: 2 },
            { id: 'bd_sub11', name: ls('National Budget & GDP', 'জাতীয় বাজেট ও জিডিপি'), marks: 2 },
            { id: 'bd_sub12', name: ls('Poverty Alleviation & Remittance', 'দারিদ্র্য বিমোচন ও রেমিট্যান্স'), marks: 1 },
          ],
        },
        // Topic 5: Bangladesh Industry & Commerce - 3 marks
        {
          id: 'bd_topic5',
          name: ls('Bangladesh Industry & Commerce', 'বাংলাদেশের শিল্প ও বাণিজ্য'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub13', name: ls('RMG Sector', 'তৈরি করার পোশাক খাত'), marks: 2 },
            { id: 'bd_sub14', name: ls('Imports & Exports', 'আমদানি ও রপ্তানি পণ্য'), marks: 2 },
            { id: 'bd_sub15', name: ls('Banking & Insurance', 'ব্যাংক ও বীমা খাত'), marks: 1 },
          ],
        },
        // Topic 6: Bangladesh Constitution - 3 marks
        {
          id: 'bd_topic6',
          name: ls('Bangladesh Constitution', 'বাংলাদেশের সংবিধান'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub16', name: ls('Principles & Objectives', 'প্রস্তাবনা ও মূলনীতি'), marks: 2 },
            { id: 'bd_sub17', name: ls('Fundamental Rights (Articles 27-44)', 'মৌলিক অধিকারসমূহ (অনুচ্ছেদ ২৭-৪৪)'), marks: 3 },
            { id: 'bd_sub18', name: ls('Important Amendments', 'গুরুত্বপূর্ণ সংশোধনী'), marks: 1 },
          ],
        },
        // Topic 7: Bangladesh Political System - 3 marks
        {
          id: 'bd_topic7',
          name: ls('Bangladesh Political System', 'বাংলাদেশের রাজনৈতিক ব্যবস্থা'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub19', name: ls('Role of Political Parties', 'রাজনৈতিক দলসমূহের ভূমিকা'), marks: 2 },
            { id: 'bd_sub20', name: ls('Skilled Society & Provocative Parties', 'সুশীল সমাজ ও চাপ সৃষ্টিকারী দল'), marks: 1 },
          ],
        },
        // Topic 8: Bangladesh Government Machinery - 3 marks
        {
          id: 'bd_topic8',
          name: ls('Bangladesh Government Machinery', 'বাংলাদেশের সরকার ব্যবস্থা'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub21', name: ls('Law, Governance & Judiciary', 'আইন, শাসন ও বিচার বিভাগ'), marks: 2 },
            { id: 'bd_sub22', name: ls('National & Local Administrative Reforms', 'জাতীয় ও স্থানীয় প্রশাসনিক সংস্কার'), marks: 1 },
          ],
        },
        // Topic 9: National Awards, Distinguished Personalities & Important Institutions - 3 marks
        {
          id: 'bd_topic9',
          name: ls('National Awards, Distinguished Personalities & Important Institutions', 'জাতীয় অর্জন, বিশিষ্ট ব্যক্তিত্ব ও গুরুত্বপূর্ণ প্রতিষ্ঠান'),
          marks: 3,
          subtopics: [
            { id: 'bd_sub23', name: ls('National Awards & Days', 'জাতীয় অর্জন ও দিবস'), marks: 2 },
            { id: 'bd_sub24', name: ls('Distinguished Personalities', 'বিশিষ্ট ব্যক্তিত্ব'), marks: 1 },
            { id: 'bd_sub25', name: ls('Sports & Landmarks', 'খেলাধুলা ও ল্যান্ডমার্ক'), marks: 1 },
          ],
        },
      ],
    },
    // 4. International Affairs - 20 marks
    {
      id: 'int_affairs',
      name: ls('International Affairs', 'আন্তর্জাতিক বিষয়াবলি'),
      marks: 20,
      topics: [
        // Topic 1: Global History, Regional & International System, Geo-Politics - 5 marks
        {
          id: 'int_topic1',
          name: ls('Global History, Regional & International System'),
          marks: 5,
          subtopics: [
            { id: 'int_sub1', name: ls('Global History & World Wars'), marks: 2 },
            { id: 'int_sub2', name: ls('Regional Forums (SAARC, BIMSTEC, ASEAN)'), marks: 2 },
            { id: 'int_sub3', name: ls('Geo-Politics'), marks: 1 },
          ],
        },
        // Topic 2: International Security & Power - 5 marks
        {
          id: 'int_topic2',
          name: ls('International Security & Power'),
          marks: 5,
          subtopics: [
            { id: 'int_sub4', name: ls('International Agreements & Security'), marks: 2 },
            { id: 'int_sub5', name: ls('Military Alliances & Power Equations'), marks: 3 },
          ],
        },
        // Topic 3: Recent & Current Events - 5 marks
        {
          id: 'int_topic3',
          name: ls('Recent & Current Events'),
          marks: 5,
          subtopics: [
            { id: 'int_sub6', name: ls('Ongoing Global Conflicts'), marks: 3 },
            { id: 'int_sub7', name: ls('Recent Geo-Political Conferences'), marks: 2 },
            { id: 'int_sub8', name: ls('Bilateral Agreements'), marks: 1 },
          ],
        },
        // Topic 4: International Environmental Issues & Diplomacy - 5 marks
        {
          id: 'int_topic4',
          name: ls('International Environmental Issues & Diplomacy'),
          marks: 5,
          subtopics: [
            { id: 'int_sub9', name: ls('COP Climate Summits'), marks: 2 },
            { id: 'int_sub10', name: ls('Kyoto & Paris Agreements'), marks: 2 },
            { id: 'int_sub11', name: ls('Greenhouse Gases'), marks: 1 },
          ],
        },
        // Topic 5: International Organizations & Global Economic Institutions - marks from domain total
        {
          id: 'int_topic5',
          name: ls('International Organizations & Global Economic Institutions'),
          marks: 3,
          subtopics: [
            { id: 'int_sub12', name: ls('UN & Sub-agencies (UN, UNESCO, WHO)'), marks: 1 },
            { id: 'int_sub13', name: ls('World Bank & IMF (WB/IMF)'), marks: 1 },
            { id: 'int_sub14', name: ls('WTO'), marks: 1 },
          ],
        },
      ],
    },
    // 5. Geography, Environment & Disaster Management - 10 marks
    {
      id: 'geo_env',
      name: ls('Geography, Environment & Disaster Management', 'ভূগোল, পরিবেশ ও দুর্যোগ ব্যবস্থাপনা'),
      marks: 10,
      topics: [
        // Topic 1: Geographical Position & Importance - 2 marks
        {
          id: 'geo_topic1',
          name: ls('Geographical Position & Importance'),
          marks: 2,
          subtopics: [
            { id: 'geo_sub1', name: ls('Bangladesh & Regional Borders'), marks: 2 },
            { id: 'geo_sub2', name: ls('Environmental & Geo-Political Importance'), marks: 2 },
          ],
        },
        // Topic 2: Physical Environment & Resource Distribution - 2 marks
        {
          id: 'geo_topic2',
          name: ls('Physical Environment & Resource Distribution'),
          marks: 2,
          subtopics: [
            { id: 'geo_sub3', name: ls('Physical Formations'), marks: 2 },
            { id: 'geo_sub4', name: ls('Natural Resources Distribution'), marks: 2 },
          ],
        },
        // Topic 3: Bangladesh Environment: Nature & Resources - 2 marks
        {
          id: 'geo_topic3',
          name: ls('Bangladesh Environment: Nature & Resources'),
          marks: 2,
          subtopics: [
            { id: 'geo_sub5', name: ls('River System'), marks: 2 },
            { id: 'geo_sub6', name: ls('Forests & Major Environmental Crises'), marks: 2 },
          ],
        },
        // Topic 4: Bangladesh & Global Environmental Change - 2 marks
        {
          id: 'geo_topic4',
          name: ls('Bangladesh & Global Environmental Change'),
          marks: 2,
          subtopics: [
            { id: 'geo_sub7', name: ls('Impact of Climate Change'), marks: 2 },
            { id: 'geo_sub8', name: ls('Temperature Rise'), marks: 2 },
          ],
        },
        // Topic 5: Natural Disasters & Management - 2 marks
        {
          id: 'geo_topic5',
          name: ls('Natural Disasters & Management'),
          marks: 2,
          subtopics: [
            { id: 'geo_sub9', name: ls('Cyclones, Floods, Earthquakes'), marks: 2 },
            { id: 'geo_sub10', name: ls('Disaster Management Strategies'), marks: 2 },
          ],
        },
      ],
    },
    // 6. General Science - 15 marks
    {
      id: 'general_science',
      name: ls('General Science', 'সাধারণ বিজ্ঞান'),
      marks: 15,
      topics: [
        // Topic 1: Physical Science - 5 marks
        {
          id: 'sci_topic1',
          name: ls('Physical Science', 'ভৌত বিজ্ঞান'),
          marks: 5,
          subtopics: [
            { id: 'sci_sub1', name: ls('State of Matter', 'পদার্থের অবস্থা'), marks: 2 },
            { id: 'sci_sub2', name: ls('Atomic Structure', 'এটমের গঠন'), marks: 2 },
            { id: 'sci_sub3', name: ls('Carbon Multi-Use', 'কার্বনের বহুমুখী ব্যবহার'), marks: 2 },
            { id: 'sci_sub4', name: ls('Acid, Base & Salt', 'এসিড, ক্ষার ও লবণ'), marks: 3 },
          ],
        },
        // Topic 2: Life Science - 5 marks
        {
          id: 'sci_topic2',
          name: ls('Life Science', 'জীব বিজ্ঞান'),
          marks: 5,
          subtopics: [
            { id: 'sci_sub5', name: ls('Plant & Animal Tissues', 'উদ্ভিদ ও প্রাণী টিস্যু'), marks: 2 },
            { id: 'sci_sub6', name: ls('Genetics & DNA', 'জেনেটিক্স ও ডিএনএ'), marks: 2 },
            { id: 'sci_sub7', name: ls('Bio-diversity', 'জীববৈচিত্র্য'), marks: 2 },
            { id: 'sci_sub8', name: ls('Viruses & Bacteria', 'ভাইরাস ও ব্যাকটেরিয়া'), marks: 3 },
          ],
        },
        // Topic 3: Modern Science - 5 marks
        {
          id: 'sci_topic3',
          name: ls('Modern Science', 'আধুনিক বিজ্ঞান'),
          marks: 5,
          subtopics: [
            { id: 'sci_sub9', name: ls('Creation of Earth & Universe', 'পৃথিবী ও মহাবিশ্বের সৃষ্টি'), marks: 2 },
            { id: 'sci_sub10', name: ls('Quarks', 'কসমিক রে'), marks: 1 },
            { id: 'sci_sub11', name: ls('Black Holes', 'হ্যাক হোল'), marks: 1 },
            { id: 'sci_sub12', name: ls('Higgs Boson Particle', 'হিগস বোসন কণা'), marks: 2 },
          ],
        },
      ],
    },
    // 7. Computer & ICT - 15 marks
    {
      id: 'computer_ict',
      name: ls('Computer & ICT', 'কম্পিউটার ও তথ্যপ্রযুক্তি'),
      marks: 15,
      topics: [
        // Topic 1: Computer Architecture & Peripherals - 10 marks
        {
          id: 'comp_topic1',
          name: ls('Computer Architecture & Peripherals', 'কম্পিউটার অঙ্গসংগঠন ও পেরিফেরালস'),
          marks: 10,
          subtopics: [
            { id: 'comp_sub1', name: ls('Hardware', 'হার্ডওয়্যার'), marks: 3 },
            { id: 'comp_sub2', name: ls('Memory & Bus Architecture', 'মেমোরি ও বাস কাঠামো'), marks: 3 },
            { id: 'comp_sub3', name: ls('CPU', 'সিপিইউ'), marks: 3 },
            { id: 'comp_sub4', name: ls('Database', 'ডাটাবেজ'), marks: 3 },
          ],
        },
        // Topic 2: ICT - Network & Communication - 5 marks
        {
          id: 'comp_topic2',
          name: ls('ICT - Network & Communication', 'তথ্যপ্রযুক্তি - নেটওয়ার্ক ও যোগাযোগ'),
          marks: 5,
          subtopics: [
            { id: 'comp_sub5', name: ls('LAN/WAN', 'LAN/WAN'), marks: 2 },
            { id: 'comp_sub6', name: ls('Cellular Data (4G/5G)', 'সেলুলার ডাটা (4G/5G)'), marks: 1 },
            { id: 'comp_sub7', name: ls('Internet & E-commerce', 'ইন্টারনেট ও ই-কমার্স'), marks: 2 },
          ],
        },
        // Topic 3: ICT - Modern Services & Cyber Security - 5 marks
        {
          id: 'comp_topic3',
          name: ls('ICT - Modern Services & Cyber Security', 'তথ্যপ্রযুক্তি - আধুনিক সেবা ও সাইবার সিকিউরিটি'),
          marks: 5,
          subtopics: [
            { id: 'comp_sub8', name: ls('Cloud Computing', 'ক্লাউড কম্পিউটিং'), marks: 2 },
            { id: 'comp_sub9', name: ls('AI & Robotics', 'AI ও রোবটিক্স'), marks: 1 },
            { id: 'comp_sub10', name: ls('Cyber Crime & Security', 'সাইবার অপরাধ ও নিরাপত্তা'), marks: 2 },
          ],
        },
      ],
    },
    // 8. Mathematical Logic - 15 marks
    {
      id: 'mathematical_logic',
      name: ls('Mathematical Logic', 'গাণিতিক যুক্তি'),
      marks: 15,
      topics: [
        // Topic 1: Arithmetic - 3 marks
        {
          id: 'math_topic1',
          name: ls('Arithmetic', 'পাটিগণিত'),
          marks: 3,
          subtopics: [
            { id: 'math_sub1', name: ls('Real Numbers', 'বাস্তব সংখ্যা'), marks: 1 },
            { id: 'math_sub2', name: ls('LCM-GCD', 'লসাগু-গসাগু'), marks: 1 },
            { id: 'math_sub3', name: ls('Percentage', 'শতকরা'), marks: 1 },
            { id: 'math_sub4', name: ls('Profit-Loss', 'লাভ-ক্ষতি'), marks: 1 },
            { id: 'math_sub5', name: ls('Simple & Compound Interest', 'সারল ও যৌগিক মুনাফা'), marks: 2 },
          ],
        },
        // Topic 2: Algebra - 3 marks
        {
          id: 'math_topic2',
          name: ls('Algebra', 'বীজগণিত'),
          marks: 3,
          subtopics: [
            { id: 'math_sub6', name: ls('Algebraic Formulas', 'বীজগাণিতিক সূত্রাবলি'), marks: 1 },
            { id: 'math_sub7', name: ls('Polynomial Factors', 'বহুপদী উৎপাদক'), marks: 1 },
            { id: 'math_sub8', name: ls('Equations & Inequalities', 'সমীকরণ ও অসমতা'), marks: 2 },
          ],
        },
        // Topic 3: Indices, Logarithms & Equations - 3 marks
        {
          id: 'math_topic3',
          name: ls('Indices, Logarithms & Equations', 'সূচক, লগারিদম ও ধারা'),
          marks: 3,
          subtopics: [
            { id: 'math_sub9', name: ls('Indices & Logarithms', 'সূচক ও লগারিদম'), marks: 2 },
            { id: 'math_sub10', name: ls('Arithmetic & Geometric Progression', 'সমান্তর ও গুণোত্তর অনুক্রম ও ধারা'), marks: 3 },
            { id: 'math_sub11', name: ls('Series', 'ধারা'), marks: 1 },
          ],
        },
        // Topic 4: Geometry & Measurement - 3 marks
        {
          id: 'math_topic4',
          name: ls('Geometry & Measurement', 'জ্যামিতি ও পরিমিতি'),
          marks: 3,
          subtopics: [
            { id: 'math_sub12', name: ls('Angle', 'কোণ'), marks: 1 },
            { id: 'math_sub13', name: ls('Triangle & Quadrilateral Theorems', 'ত্রিভুজ ও চতুর্ভুজ সংক্রান্ত উপপাদ্য'), marks: 2 },
            { id: 'math_sub14', name: ls('Pythagoras Theorem', 'পিথাগোরাসের সূত্র'), marks: 1 },
            { id: 'math_sub15', name: ls('Measurement', 'পরিমিতি'), marks: 2 },
          ],
        },
        // Topic 5: Set, Permutation & Combination - 3 marks
        {
          id: 'math_topic5',
          name: ls('Set, Permutation & Combination', 'সেট, বিন্যাস ও সমাবেশ'),
          marks: 3,
          subtopics: [
            { id: 'math_sub16', name: ls('Set & Venn Diagram', 'সেট ও ভেনচিত্র'), marks: 1 },
            { id: 'math_sub17', name: ls('Permutation & Combination', 'বিন্যাস ও সমাবেশ'), marks: 1 },
            { id: 'math_sub18', name: ls('Statistics & Probability', 'পরিসংখ্যান ও সম্ভাব্যতা'), marks: 2 },
          ],
        },
      ],
    },
    // 9. Mental Ability - 15 marks
    {
      id: 'mental_ability',
      name: ls('Mental Ability', 'মানসিক দক্ষতা'),
      marks: 15,
      topics: [
        // Topic 1: Verbal Reasoning
        {
          id: 'mental_topic1',
          name: ls('Verbal Reasoning', 'ভাষাগত যৌক্তিক বিচার'),
          marks: 8,
          subtopics: [
            { id: 'mental_sub1', name: ls('Word Coding', 'শব্দ কোডিং'), marks: 2 },
            { id: 'mental_sub2', name: ls('Blood Relation', 'রক্তের সম্পর্ক'), marks: 2 },
            { id: 'mental_sub3', name: ls('Analogy', 'অ্যানালজি'), marks: 3 },
            { id: 'mental_sub15', name: ls('Series', undefined), marks: 1 },
          ],
        },
        // Topic 2: Problem Solving
        {
          id: 'mental_topic2',
          name: ls('Problem Solving', 'সমস্যা সমাধান'),
          marks: 6,
          subtopics: [
            { id: 'mental_sub4', name: ls('Direction & Distance', 'দিক ও দূরত্ব সংক্রান্ত প্রশ্ন'), marks: 3 },
            { id: 'mental_sub5', name: ls('Decision Making', 'সিদ্ধান্ত গ্রহণ'), marks: 3 },
          ],
        },
        // Topic 3: Spelling & Language
        {
          id: 'mental_topic3',
          name: ls('Spelling & Language', 'বানান ও ভাষা'),
          marks: 6,
          subtopics: [
            { id: 'mental_sub6', name: ls('Correct Spelling Determination', 'সঠিক বানান নির্ণয়'), marks: 3 },
            { id: 'mental_sub7', name: ls('Language Purity', 'ভাষার শুদ্ধতা'), marks: 3 },
          ],
        },
        // Topic 4: Mechanical Ability
        {
          id: 'mental_topic4',
          name: ls('Mechanical Ability', 'যান্ত্রিক দক্ষতা'),
          marks: 8,
          subtopics: [
            { id: 'mental_sub8', name: ls('Gear', 'গিয়ার'), marks: 2 },
            { id: 'mental_sub9', name: ls('Lever', 'লিভার'), marks: 2 },
            { id: 'mental_sub10', name: ls('Physical Mechanical Rules', 'ভৌত যান্ত্রিক নিয়ম'), marks: 3 },
            { id: 'mental_sub15', name: ls('Series', undefined), marks: 1 },
          ],
        },
        // Topic 5: Space Relation
        {
          id: 'mental_topic5',
          name: ls('Space Relation', 'স্থানাঙ্ক সম্পর্ক'),
          marks: 9,
          subtopics: [
            { id: 'mental_sub11', name: ls('Mental Image', 'আয়নায় প্রতিবিম্ব'), marks: 3 },
            { id: 'mental_sub12', name: ls('Reflection', 'প্রতিচ্ছবি'), marks: 3 },
            { id: 'mental_sub13', name: ls('Geometric Patterns', 'জ্যামিতিক প্যাটার্ন'), marks: 3 },
          ],
        },
        // Topic 6: Numerical Ability
        {
          id: 'mental_topic6',
          name: ls('Numerical Ability', 'সংখ্যাগত ক্ষমতা'),
          marks: 6,
          subtopics: [
            { id: 'mental_sub14', name: ls('Missing Number Series', 'মিসিং নম্বর সিরিজ'), marks: 3 },
            { id: 'mental_sub15', name: ls('Mathematical Tricks', 'গাণিতিক ধাঁধা'), marks: 3 },
          ],
        },
      ],
    },
    // 10. Ethics, Values & Good Governance - 10 marks
    {
      id: 'ethics_governance',
      name: ls('Ethics, Values & Good Governance', 'নৈতিকতা, মূল্যবোধ ও সু-শাসন'),
      marks: 10,
      topics: [
        // Topic 1: Definition & Relationship of Values & Governance - 1 mark
        {
          id: 'eth_topic1',
          name: ls('Definition & Relationship of Values & Governance', 'মূল্যবোধ ও সুশাসনের সংজ্ঞায়ন ও সম্পর্ক'),
          marks: 1,
          subtopics: [
            { id: 'eth_sub1', name: ls('Source of Values', 'মূল্যবোধের উৎস'), marks: 1 },
            { id: 'eth_sub2', name: ls('Components of Governance', 'সুশাসনের উপাদান'), marks: 1 },
            { id: 'eth_sub3', name: ls('Mutual Relationship', 'পারস্পরিক সম্পর্ক'), marks: 1 },
          ],
        },
        // Topic 2: Importance of Values & Governance Establishment - 3 marks
        {
          id: 'eth_topic2',
          name: ls('Importance of Values & Governance Establishment', 'মূল্যবোধের গুরুত্ব ও সুশাসন প্রতিষ্ঠা'),
          marks: 3,
          subtopics: [
            { id: 'eth_sub4', name: ls('Establishment of Good Governance in Civil Life', 'নাগরিক জীবনে সুশাসন প্রতিষ্ঠা'), marks: 2 },
            { id: 'eth_sub5', name: ls('Democratic Values', 'গণতান্ত্রিক মূল্যবোধ'), marks: 1 },
          ],
        },
        // Topic 3: National Development & Deficit - 6 marks
        {
          id: 'eth_topic3',
          name: ls('National Development & Deficit', 'জাতীয় উন্নয়ন ও অনুপস্থিতির মাশুল'),
          marks: 6,
          subtopics: [
            { id: 'eth_sub6', name: ls('Role of Good Governance in National Development', 'জাতীয় উন্নয়নে সুশাসনের ভূমিকা'), marks: 2 },
            { id: 'eth_sub7', name: ls('Corruption & Remedies', 'দুর্নীতি ও অব্যবস্থাপনার প্রতিকার'), marks: 4 },
          ],
        },
      ],
    },
  ];

  const bcsExam: Exam = {
    id: 'bcs',
    name: 'BCS Preliminary',
    title: ls('BCS Preliminary', 'বিসিএস প্রাথমিক'),
    totalMarks: 200,
    domains: bcsDomains,
    examType: 'bcs',
  };

  // Bangladesh Bank & Bank Recruitment - 100 marks
  const bankDomains: Domain[] = [
    {
      id: 'bn_lang_bank',
      name: ls('Bangla Language & Literature', 'বাংলা ভাষা ও সাহিত্য'),
      marks: 20, // 20% of 100 marks
      topics: [
        {
          id: 'bn_bank_topic1',
          name: ls('Bangla Grammar'),
          marks: 8,
          subtopics: [
            { id: 'bn_bank_sub1', name: ls('Sandhi, Samas, Karok'), marks: 3 },
            { id: 'bn_bank_sub2', name: ls('Spelling & Correction'), marks: 2 },
            { id: 'bn_bank_sub3', name: ls('Bangla Literature History'), marks: 3 },
          ],
        },
        {
          id: 'bn_bank_topic2',
          name: ls('Bangla Literature'),
          marks: 12,
          subtopics: [
            { id: 'bn_bank_sub4', name: ls('Literary Figures'), marks: 4 },
            { id: 'bn_bank_sub5', name: ls('Historical Literary Works'), marks: 4 },
            { id: 'bn_bank_sub6', name: ls('Major Literary Movements'), marks: 4 },
          ],
        },
      ],
    },
    {
      id: 'en_lang_bank',
      name: ls('English Language & Literature'),
      marks: 25, // 25% of 100 marks
      topics: [
        {
          id: 'en_bank_topic1',
          name: ls('Grammar & Sentence Correction'),
          marks: 10,
          subtopics: [
            { id: 'en_bank_sub1', name: ls('Grammar'), marks: 4 },
            { id: 'en_bank_sub2', name: ls('Sentence Correction'), marks: 3 },
            { id: 'en_bank_sub3', name: ls('Prepositions'), marks: 3 },
          ],
        },
        {
          id: 'en_bank_topic2',
          name: ls('Vocabulary & Comprehension'),
          marks: 9,
          subtopics: [
            { id: 'en_bank_sub4', name: ls('Synonyms & Antonyms'), marks: 4 },
            { id: 'en_bank_sub5', name: ls('Analogies'), marks: 3 },
            { id: 'en_bank_sub6', name: ls('Literature'), marks: 2 },
          ],
        },
      ],
    },
    {
      id: 'math_bank',
      name: ls('Mathematics & Quantitative Aptitude'),
      marks: 30, // 30% of 100 marks
      topics: [
        {
          id: 'math_bank_topic1',
          name: ls('Arithmetic & Algebra'),
          marks: 15,
          subtopics: [
            { id: 'math_bank_sub1', name: ls('Arithmetic'), marks: 5 },
            { id: 'math_bank_sub2', name: ls('Equations'), marks: 5 },
            { id: 'math_bank_sub3', name: ls('Work-Time'), marks: 5 },
          ],
        },
        {
          id: 'math_bank_topic2',
          name: ls('Data Interpretation & Geometry'),
          marks: 15,
          subtopics: [
            { id: 'math_bank_sub4', name: ls('Speed-Distance'), marks: 5 },
            { id: 'math_bank_sub5', name: ls('Tables & Pie Charts'), marks: 5 },
            { id: 'math_bank_sub6', name: ls('Probability & Geometry'), marks: 5 },
          ],
        },
      ],
    },
    {
      id: 'gk_bank',
      name: ls('General Knowledge'),
      marks: 15, // 15% of 100 marks
      topics: [
        {
          id: 'gk_bank_topic1',
          name: ls('Bangladesh Affairs & Banking'),
          marks: 8,
          subtopics: [
            { id: 'gk_bank_sub1', name: ls('Bangladesh Affairs'), marks: 4 },
            { id: 'gk_bank_sub2', name: ls('International Banking (IMF/WB)'), marks: 4 },
            { id: 'gk_bank_sub3', name: ls('Monetary Policy'), marks: 2 },
            { id: 'gk_bank_sub4', name: ls('FinTech'), marks: 2 },
          ],
        },
        {
          id: 'gk_bank_topic2',
          name: ls('Geopolitics & Current Affairs'),
          marks: 7,
          subtopics: [
            { id: 'gk_bank_sub5', name: ls('Geopolitics'), marks: 4 },
            { id: 'gk_bank_sub6', name: ls('Current Global Events'), marks: 3 },
          ],
        },
      ],
    },
    {
      id: 'ict_bank',
      name: ls('Computer & ICT'),
      marks: 10, // 10% of 100 marks
      topics: [
        {
          id: 'ict_bank_topic1',
          name: ls('Hardware, Architecture, Networking'),
          marks: 5,
          subtopics: [
            { id: 'ict_bank_sub1', name: ls('Hardware'), marks: 2 },
            { id: 'ict_bank_sub2', name: ls('Architecture'), marks: 2 },
            { id: 'ict_bank_sub3', name: ls('SWIFT, RTGS'), marks: 1 },
          ],
        },
        {
          id: 'ict_bank_topic2',
          name: ls('Security & Services'),
          marks: 5,
          subtopics: [
            { id: 'ict_bank_sub4', name: ls('Core Banking'), marks: 2 },
            { id: 'ict_bank_sub5', name: ls('Cyber Security'), marks: 3 },
          ],
        },
      ],
    },
  ];

  const bankExam: Exam = {
    id: 'bank',
    name: 'Bangladesh Bank & Bank Recruitment',
    title: ls('Bangladesh Bank & Bank Recruitment', 'বাংলাদেশ ব্যাংক ও ব্যাংক আয়োজন'),
    totalMarks: 100,
    domains: bankDomains,
    examType: 'bank',
  };

  return [bcsExam, bankExam];
}

// Generate the syllabus data
export const examSyllabus = createExamData();