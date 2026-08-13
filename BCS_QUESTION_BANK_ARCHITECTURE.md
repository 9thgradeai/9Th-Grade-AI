# BCS Question Bank Engine — Complete Technical Architecture

## Executive Summary

This document presents the complete technical architecture for a production-grade BCS (Bangladesh Civil Service) Question Bank Engine. The design follows the principle that **static question content must be stored in the database and served quickly**, while **AI is reserved for dynamic content like current affairs, personalized explanations, and adaptive learning**.

---

## PHASE 1 — CURRENT ARCHITECTURE AUDIT

### 1.1 Database Technology

**EXISTING:** PostgreSQL hosted on Neon with Prisma ORM

| Aspect | Current State |
|--------|---------------|
| Database | PostgreSQL 15+ on Neon |
| ORM | Prisma 6.9.0 |
| Connection | Pooled + Direct |
| Migrations | Schema-push strategy |
| Cache | Upstash Redis (optional) |

**ASSESSMENT:** Neon PostgreSQL is optimal for this use case.

**RECOMMENDATION:** Continue with Neon PostgreSQL. No migration needed.

---

### 1.2 Existing Schema Analysis

**EXISTING HIERARCHY:**
```
Exam → Subject → Topic → Question
                      ├── options: String[]
                      ├── correctIndex: Int
                      ├── explanation: String
                      └── difficulty: Int (1-5)
```

**CURRENT MODELS (18 total):**
- Users & Auth: User, Account, Session
- Exams & Syllabus: Exam, Subject, Topic
- Questions & Tests: Question, Test, QuestionAttempt
- Results & Performance: TestResult, Performance
- User Progress: UserSubject, UserTopic
- AI & Strategy: AIRecommendation, DailyTask, Roadmap
- Memory & Revision: RevisionItem, StudySession
- Payments: Subscription, Invoice

**EXISTING QUESTION MODEL:**
```prisma
model Question {
  id            String   @id @default(cuid())
  topicId       String
  prompt        String
  promptBn      String?
  options       String[]
  optionsBn     String[] @default([])
  correctIndex  Int
  explanation   String
  difficulty    Int      @default(2) // 1-5
  targetSeconds Int      @default(40)
  tags          String[]
  topic         Topic    @relation(...)
  attempts      QuestionAttempt[]
  @@index([topicId])
  @@index([difficulty])
}
```

**GAPS IDENTIFIED:**
| Missing | Impact |
|---------|--------|
| Sub-topic hierarchy | Cannot classify at granular level |
| Source/reference | No provenance for historical questions |
| Exam year/number | Cannot identify BCS year/question |
| Question versions | No audit trail for corrections |
| Verification status | No quality workflow |
| Duplicate detection | No hash/fingerprint field |
| Current affairs support | No expiration field |

---

## PHASE 2 — PROPOSED DATA MODEL

### 2.1 Enhanced Hierarchy

**RECOMMENDED HIERARCHY:**
```
Exam → Subject → Topic → SubTopic → Question
                                      ├── QuestionOption[] (normalized)
                                      ├── QuestionSource
                                      ├── QuestionVersion[]
                                      └── QuestionStats
```

### 2.2 New Tables

#### SubTopic (NEW)
```prisma
model SubTopic {
  id          String   @id @default(cuid())
  topicId     String
  name        String
  nameBn      String?
  sortOrder   Int      @default(0)
  
  topic       Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)
  questions   Question[]
  
  @@index([topicId])
}
```

**WHY:** BCS questions need granular classification. For example, within "Bangla Grammar" → "Sandhi" → "Swar-Sandhi", "Vyanjan-Sandhi", etc.

#### QuestionSource (NEW)
```prisma
model QuestionSource {
  id            String   @id @default(cuid())
  questionId    String   @unique
  examYear      Int?           // BCS year (e.g., 40, 41, 42)
  questionNumber Int?          // Question number in that exam
  sourceType    String         // 'bcs-official' | 'bcs-unofficial' | 'curated' | 'ai-generated'
  sourceName    String?        // Source publication name
  sourceUrl     String?
  verifiedAt    DateTime?
  verifiedBy    String?        // User ID of verifier
  
  question      Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

**WHY:** Provenance is critical for trust. Students need to know if a question is from BCS 40th, official vs curated.

#### QuestionVersion (NEW)
```prisma
model QuestionVersion {
  id            String   @id @default(cuid())
  questionId    String
  version       Int
  prompt        String
  promptBn      String?
  options       String[]
  optionsBn     String[]
  correctIndex  Int
  explanation   String
  changedBy     String?        // User ID
  changedAt     DateTime @default(now())
  changeReason  String?
  
  question      Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  @@unique([questionId, version])
  @@index([questionId])
}
```

**WHY:** When answers are corrected, we need audit trail. Never lose historical accuracy.

#### QuestionContent (NEW - Extracted from Question)
```prisma
model QuestionContent {
  id            String   @id @default(cuid())
  questionId    String   @unique
  prompt        String
  promptBn      String?
  options       Json            // [{text: "...", textBn: "..."}, ...]
  correctIndex  Int
  explanation   String
  explanationBn String?
  detailedExplanation String?   // For AI Tutor context
  
  question      Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

**WHY:** Separate content from metadata for cleaner caching and versioning.

#### QuestionStats (NEW)
```prisma
model QuestionStats {
  id               String   @id @default(cuid())
  questionId       String   @unique
  attemptCount     Int      @default(0)
  correctCount     Int      @default(0)
  avgTimeSeconds   Float    @default(0)
  difficultyRating Float    @default(0)   // Computed from actual performance
  
  question         Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}
```

**WHY:** Real-time statistics for adaptive difficulty and quality metrics.

#### CurrentAffairsQuestion (NEW)
```prisma
model CurrentAffairsQuestion {
  id              String   @id @default(cuid())
  questionId      String   @unique
  eventDate       DateTime
  publicationDate DateTime @default(now())
  validUntil      DateTime?
  sourceType      String         // 'newspaper' | 'government' | 'international' | 'ai-generated'
  sourceName      String?
  sourceUrl       String?
  status          String   @default('active')  // 'active' | 'expired' | 'archived'
  
  question        Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  @@index([validUntil])
  @@index([status])
}
```

**WHY:** Current affairs have temporal validity. They expire and should not be mixed with historical questions.

---

## PHASE 3 — ENHANCED QUESTION MODEL

### 3.1 Updated Question Model

```prisma
model Question {
  id               String   @id @default(cuid())
  subTopicId       String?
  topicId          String          // Keep for backward compatibility
  
  // Content (normalized)
  content          QuestionContent?
  
  // Metadata
  questionType     String   @default('mcq-single')  // 'mcq-single' | 'mcq-multiple' | 'fill-blank'
  difficulty       Int      @default(2)             // 1-5, AI-adjustable
  targetSeconds    Int      @default(40)
  
  // Classification
  tags             String[]
  bloomLevel       String?                          // 'remember' | 'understand' | 'apply' | 'analyze'
  
  // Quality & Status
  status           String   @default('draft')       // 'draft' | 'review' | 'approved' | 'published' | 'archived'
  verificationStatus String @default('unverified')  // 'unverified' | 'verified' | 'disputed'
  
  // Deduplication
  contentHash      String?                          // SHA-256 of normalized prompt
  canonicalId      String?                          // Points to canonical if duplicate
  
  // Timestamps
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  publishedAt      DateTime?
  
  // Relations
  topic            Topic             @relation(fields: [topicId], references: [id], onDelete: Cascade)
  subTopic         SubTopic?         @relation(fields: [subTopicId], references: [id], onDelete: SetNull)
  source           QuestionSource?
  versions         QuestionVersion[]
  stats            QuestionStats?
  currentAffairs   CurrentAffairsQuestion?
  attempts         QuestionAttempt[]
  
  @@index([topicId])
  @@index([subTopicId])
  @@index([status])
  @@index([contentHash])
  @@index([canonicalId])
}
```

### 3.2 Field Decisions

| Field | Storage | Rationale |
|-------|---------|-----------|
| prompt, options, correctIndex | Normalized (QuestionContent) | Enables versioning, caching |
| tags | String[] in Question | Array querying supported in PostgreSQL |
| bloomLevel | String field | Cognitive taxonomy for AI Tutor |
| contentHash | String (SHA-256) | Deduplication without embeddings |
| canonicalId | String? | Points to original if duplicate |

---

## PHASE 4 — CONTENT INGESTION PIPELINE

### 4.1 Pipeline Stages

```
SOURCE → EXTRACTION → PARSING → STRUCTURING → VALIDATION → 
DEDUPLICATION → CLASSIFICATION → HUMAN REVIEW → APPROVAL → DATABASE
```

### 4.2 Recommended Format: JSONL

**WHY JSONL over CSV/SQL:**
- Preserves Unicode (Bangla text)
- Supports nested structures (options array)
- Line-delimited for streaming large files
- Easy validation with JSON Schema
- Human-readable for review

**Example Record:**
```json
{
  "id": "bcs-40-bangla-001",
  "examYear": 40,
  "questionNumber": 1,
  "subject": "Bangla",
  "topic": "Sandhi",
  "subTopic": "Swar-Sandhi",
  "prompt": "স্বরসন্ধির উদাহরণ কোনটি?",
  "promptEn": "Which is an example of vowel sandhi?",
  "options": [
    {"text": "বিদ্যা", "textEn": "Vidya"},
    {"text": "পত্র", "textEn": "Patra"},
    {"text": "জ্ঞান", "textEn": "Gyan"},
    {"text": "পথ", "textEn": "Path"}
  ],
  "correctIndex": 0,
  "explanation": "বিদ্যা = বিদ্ + যা। এখানে 'ই' এবং 'য'-এর মিলনে 'বিদ্যা' হয়েছে।",
  "explanationEn": "Vidya = Vid + Ya. Here 'i' and 'y' merge to form 'vidya'.",
  "difficulty": 2,
  "source": "BCS 40th Preliminary",
  "verified": true
}
```

### 4.3 Validation Schema (Zod)

```typescript
const QuestionImportSchema = z.object({
  id: z.string().optional(),
  examYear: z.number().int().min(1).max(100).optional(),
  questionNumber: z.number().int().min(1).optional(),
  subject: z.string().min(1),
  topic: z.string().min(1),
  subTopic: z.string().optional(),
  prompt: z.string().min(1),
  promptEn: z.string().optional(),
  options: z.array(z.object({
    text: z.string().min(1),
    textEn: z.string().optional()
  })).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(10),
  explanationEn: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).default(2),
  source: z.string().optional(),
  verified: z.boolean().default(false)
});
```

---

## PHASE 5 — AI-ASSISTED INGESTION

### 5.1 Safe AI Integration Pattern

```
Raw PDF/Image
      ↓
AI Extraction (optional)
      ↓
Structured JSONL (staging)
      ↓
Validation Layer
      ↓
Human Review Queue
      ↓
Approved Data
      ↓
Production Database
```

### 5.2 AI Tasks (with Human Verification Required)

| Task | AI Role | Human Required |
|------|---------|----------------|
| Extract from PDF | Yes | Yes - verify extraction |
| Identify options | Yes | Yes - verify options |
| Determine correct answer | No | **Always human** |
| Generate explanation | Yes | Yes - verify accuracy |
| Classify subject/topic | Yes | Yes - verify classification |
| Assign difficulty | Suggest | Optional |
| Generate tags | Suggest | Optional |
| Detect duplicates | Flag | Human decision |

### 5.3 Fields Requiring Mandatory Human Verification

1. **correctIndex** - Never trust AI for answer correctness
2. **explanation** - AI can draft, human must verify
3. **source** - Always human-verified provenance
4. **examYear/questionNumber** - Must match official records

---

## PHASE 6 — DEDUPLICATION STRATEGY

### 6.1 Detection Levels

| Level | Method | Use Case |
|-------|--------|----------|
| Exact | SHA-256 hash | Identical text |
| Normalized | Lowercase + strip punctuation + Unicode normalize | Formatting differences |
| Near | pg_trgm similarity > 0.9 | Minor wording changes |
| Semantic | Embeddings (optional) | Translated/paraphrased |

### 6.2 Implementation

**Step 1: Content Hash (Exact)**
```typescript
function computeContentHash(prompt: string, options: string[]): string {
  const normalized = [prompt, ...options.sort()].join('|').toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
```

**Step 2: pg_trgm Extension (Near)**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_question_prompt_trgm ON "Question" USING gin (prompt gin_trgm_ops);
```

**Step 3: Similarity Query**
```sql
SELECT id, prompt, similarity(prompt, $1) as sim
FROM "Question"
WHERE similarity(prompt, $1) > 0.85
ORDER BY sim DESC
LIMIT 10;
```

### 6.3 Duplicate Resolution

```prisma
model Question {
  contentHash  String?
  canonicalId  String?    // If duplicate, points to original
  isCanonical  Boolean    @default(true)
}
```

**Resolution Flow:**
1. Compute hash on insert
2. Check for existing same hash → exact duplicate
3. Check pg_trgm similarity → near duplicate
4. If duplicate found, set `canonicalId` to original
5. Mark `isCanonical = false`

---

## PHASE 7 — DATABASE PERFORMANCE

### 7.1 Index Strategy

**Needed Now (100K questions):**
```sql
-- Core lookups
CREATE INDEX idx_question_topic ON "Question"(topicId);
CREATE INDEX idx_question_subtopic ON "Question"(subTopicId);
CREATE INDEX idx_question_status ON "Question"(status);
CREATE INDEX idx_question_difficulty ON "Question"(difficulty);

-- Composite for filtered queries
CREATE INDEX idx_question_topic_difficulty ON "Question"(topicId, difficulty);

-- Deduplication
CREATE INDEX idx_question_content_hash ON "Question"(contentHash);

-- Full-text search (Bangla + English)
CREATE INDEX idx_question_prompt_search ON "Question" USING gin(to_tsvector('simple', prompt));
```

**Needed Later (500K+ questions):**
```sql
-- Partial indexes for common queries
CREATE INDEX idx_question_published ON "Question"(id, topicId, difficulty) 
  WHERE status = 'published';

-- Covering index for question list
CREATE INDEX idx_question_list_cover ON "Question"(topicId, difficulty, status) 
  INCLUDE (id, prompt);
```

### 7.2 Random Question Selection

**PROBLEM:** `ORDER BY RANDOM()` is O(n) and slow for large tables.

**SOLUTION: Use Table Sampling**

```sql
-- Method 1: TABLESAMPLE (fast, approximate)
SELECT * FROM "Question"
WHERE topicId = $1 AND status = 'published'
TABLESAMPLE BERNOULLI(10)
LIMIT 20;

-- Method 2: Random offset (requires row count)
SELECT * FROM "Question"
WHERE topicId = $1 AND status = 'published'
OFFSET floor(random() * (SELECT count(*) FROM "Question" WHERE topicId = $1))
LIMIT 1;

-- Method 3: Pre-computed random column (best for high traffic)
ALTER TABLE "Question" ADD COLUMN randomSort float DEFAULT random();
CREATE INDEX idx_question_random ON "Question"(topicId, randomSort);
-- Query: SELECT * FROM "Question" WHERE topicId = $1 ORDER BY randomSort LIMIT 20;
-- Periodically: UPDATE "Question" SET randomSort = random();
```

**RECOMMENDATION:** Start with Method 2 (random offset), migrate to Method 3 at 500K+ questions.

### 7.3 Connection Pooling

**EXISTING:** Neon provides serverless pooling.

**RECOMMENDATION:** Continue using Neon's pooled endpoint. No additional pooling layer needed.

---

## PHASE 8 — API ARCHITECTURE

### 8.1 Question Bank Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | /api/v1/questions | List with filters | Public (limited) |
| GET | /api/v1/questions/:id | Get question | Authenticated |
| POST | /api/v1/admin/questions | Create | Admin |
| PUT | /api/v1/admin/questions/:id | Update | Admin |
| DELETE | /api/v1/admin/questions/:id | Soft delete | Admin |
| POST | /api/v1/admin/questions/import | Bulk import | Admin |
| GET | /api/v1/admin/questions/duplicates | Find duplicates | Admin |

### 8.2 Query Parameters

```
GET /api/v1/questions?
  topicId=xyz&
  subTopicId=abc&
  difficulty=3&
  status=published&
  limit=20&
  offset=0&
  random=true
```

### 8.3 Response Schema

```typescript
interface QuestionResponse {
  id: string;
  prompt: string;
  promptBn?: string;
  options: Array<{text: string; textBn?: string}>;
  // correctIndex NOT included (server-side grading only)
  difficulty: number;
  tags: string[];
}
```

---

## PHASE 9 — SECURITY MODEL

### 9.1 Access Control

| Role | Read Questions | Create/Edit | Delete | Import |
|------|---------------|-------------|--------|--------|
| Anonymous | Limited (preview) | No | No | No |
| User | Full (for practice) | No | No | No |
| Admin | Full | Yes | Yes | Yes |

### 9.2 Anti-Scraping Measures

1. **Rate Limiting:** 100 req/min/user for question endpoints
2. **No Bulk Export:** Questions never return > 50 per request
3. **Server-Side Grading:** `correctIndex` never exposed to client
4. **Watermarking (optional):** Embed subtle identifiers in explanations

---

## PHASE 10 — MIGRATION STRATEGY

### 10.1 Migration Sequence

```
Migration 001: Add SubTopic table
Migration 002: Add QuestionSource table
Migration 003: Add QuestionVersion table
Migration 004: Add QuestionContent table
Migration 005: Add QuestionStats table
Migration 006: Add CurrentAffairsQuestion table
Migration 007: Add new fields to Question
Migration 008: Add contentHash column
Migration 009: Create indexes
Migration 010: Migrate existing data
```

### 10.2 Backward Compatibility

- Keep `topicId` on Question for existing code
- Keep `options: String[]` format, migrate to normalized later
- Existing API responses remain unchanged
- New fields are additive, not breaking

---

## PHASE 11 — IMPLEMENTATION ROADMAP

### Phase 0: Foundation (Week 1)
- Create migration files
- Add new tables
- Update Prisma schema
- Create TypeScript types

### Phase 1: Core Schema (Week 2)
- Run migrations
- Update admin CRUD endpoints
- Add contentHash computation
- Implement basic deduplication

### Phase 2: Import Pipeline (Week 3)
- Create JSONL import script
- Build validation layer
- Create staging table
- Build admin import UI

### Phase 3: Classification (Week 4)
- Populate SubTopics
- Migrate existing questions
- Add source metadata
- Build classification API

### Phase 4: Quality System (Week 5)
- Add version history
- Implement verification workflow
- Add human review queue
- Build admin dashboard

### Phase 5: Performance (Week 6)
- Add indexes
- Implement random sampling
- Add caching for common queries
- Load test with 100K questions

### Phase 6: Current Affairs (Week 7)
- Add CurrentAffairsQuestion support
- Build expiration logic
- Create current affairs import
- Add validity checks

### Phase 7: AI Integration (Week 8)
- Integrate with AI Tutor
- Add trusted context loading
- Build explanation retrieval
- Test with sample sessions

---

## PHASE 12 — SUCCESS CRITERIA

### Before Launch
- [ ] All migrations run successfully
- [ ] Existing questions migrated without data loss
- [ ] Admin CRUD working
- [ ] Import pipeline tested with 1000+ questions
- [ ] Deduplication working
- [ ] Random question selection < 50ms
- [ ] API rate limiting active
- [ ] CorrectIndex never exposed to client

### Scale Targets
| Metric | Target |
|--------|--------|
| Question count | 100K initial, 1M+ eventual |
| Question fetch latency | < 50ms p95 |
| Random selection latency | < 100ms p95 |
| Import throughput | 1000 questions/minute |
| Duplicate detection | < 200ms per question |

---

## APPENDIX A: Files to Create/Modify

### New Files
- `backend/prisma/migrations/001_add_subtopic.sql`
- `backend/prisma/migrations/002_add_question_source.sql`
- `backend/prisma/migrations/003_add_question_version.sql`
- `backend/prisma/migrations/004_add_question_content.sql`
- `backend/prisma/migrations/005_add_question_stats.sql`
- `backend/prisma/migrations/006_add_current_affairs.sql`
- `backend/src/lib/questionHash.ts`
- `backend/src/lib/deduplication.ts`
- `backend/src/routes/admin/questions.ts`
- `backend/src/routes/admin/import.ts`
- `scripts/import-questions.ts`
- `scripts/validate-jsonl.ts`

### Modified Files
- `backend/prisma/schema.prisma` - Add new models
- `backend/src/routes/questions.ts` - Enhanced queries
- `backend/src/routes/tests.ts` - Use new question model
- `src/lib/types.ts` - Add new TypeScript types
- `src/lib/api.ts` - Add new API methods

---

## APPENDIX B: Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Migration fails | Test on staging branch first, backup before migration |
| Performance degradation | Add indexes incrementally, monitor query times |
| Duplicate imports | Hash-based detection before insert |
| Wrong answers in DB | Verification workflow, version history for corrections |
| Scraping | Rate limits, no bulk export, correctIndex hidden |
| Bangla text corruption | Use JSONL with UTF-8, validate Unicode |

---

**END OF ARCHITECTURE DOCUMENT**
