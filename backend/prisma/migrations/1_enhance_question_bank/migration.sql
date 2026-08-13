-- Add new columns to Question table
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "subTopicId" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "questionType" TEXT NOT NULL DEFAULT 'mcq-single';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "bloomLevel" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "contentHash" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "canonicalId" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "isCanonical" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- Create SubTopic table
CREATE TABLE IF NOT EXISTS "SubTopic" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SubTopic_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SubTopic" ADD CONSTRAINT "SubTopic_topicId_fkey"
    FOREIGN KEY ("topicId") REFERENCES "Topic"(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "SubTopic_topicId_idx" ON "SubTopic"("topicId");

-- Create QuestionContent table
CREATE TABLE IF NOT EXISTS "QuestionContent" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL UNIQUE,
    "prompt" TEXT NOT NULL,
    "promptBn" TEXT,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "explanationBn" TEXT,
    "detailedExplanation" TEXT,
    CONSTRAINT "QuestionContent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuestionContent" ADD CONSTRAINT "QuestionContent_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Create QuestionSource table
CREATE TABLE IF NOT EXISTS "QuestionSource" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL UNIQUE,
    "examYear" INTEGER,
    "questionNumber" INTEGER,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    CONSTRAINT "QuestionSource_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuestionSource" ADD CONSTRAINT "QuestionSource_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Create QuestionVersion table
CREATE TABLE IF NOT EXISTS "QuestionVersion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "promptBn" TEXT,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,
    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "QuestionVersion_questionId_version_key" ON "QuestionVersion"("questionId", "version");
CREATE INDEX IF NOT EXISTS "QuestionVersion_questionId_idx" ON "QuestionVersion"("questionId");

-- Create QuestionStats table
CREATE TABLE IF NOT EXISTS "QuestionStats" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL UNIQUE,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "avgTimeSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficultyRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "QuestionStats_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "QuestionStats" ADD CONSTRAINT "QuestionStats_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Create CurrentAffairsQuestion table
CREATE TABLE IF NOT EXISTS "CurrentAffairsQuestion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL UNIQUE,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "publicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "CurrentAffairsQuestion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CurrentAffairsQuestion" ADD CONSTRAINT "CurrentAffairsQuestion_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "CurrentAffairsQuestion_validUntil_idx" ON "CurrentAffairsQuestion"("validUntil");
CREATE INDEX IF NOT EXISTS "CurrentAffairsQuestion_status_idx" ON "CurrentAffairsQuestion"("status");

-- Add new indexes on Question table
CREATE INDEX IF NOT EXISTS "Question_subTopicId_idx" ON "Question"("subTopicId");
CREATE INDEX IF NOT EXISTS "Question_status_idx" ON "Question"("status");
CREATE INDEX IF NOT EXISTS "Question_contentHash_idx" ON "Question"("contentHash");
CREATE INDEX IF NOT EXISTS "Question_canonicalId_idx" ON "Question"("canonicalId");
CREATE INDEX IF NOT EXISTS "Question_topicId_status_difficulty_idx" ON "Question"("topicId", "status", "difficulty");
CREATE INDEX IF NOT EXISTS "Question_subTopicId_status_difficulty_idx" ON "Question"("subTopicId", "status", "difficulty");

-- Add foreign key for subTopicId
ALTER TABLE "Question" ADD CONSTRAINT "Question_subTopicId_fkey"
    FOREIGN KEY ("subTopicId") REFERENCES "SubTopic"(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Migrate existing Question data to QuestionContent
INSERT INTO "QuestionContent" ("id", "questionId", "prompt", "promptBn", "options", "correctIndex", "explanation", "explanationBn")
SELECT
    gen_random_uuid()::text,
    "id",
    "prompt",
    "promptBn",
    ("options")::jsonb,
    "correctIndex",
    "explanation",
    NULL
FROM "Question"
WHERE NOT EXISTS (
    SELECT 1 FROM "QuestionContent" WHERE "QuestionContent"."questionId" = "Question"."id"
);

-- Create default SubTopic for existing topics
INSERT INTO "SubTopic" ("id", "topicId", "name", "sortOrder")
SELECT
    gen_random_uuid()::text,
    "id",
    'General' || ' - ' || "name",
    0
FROM "Topic"
WHERE NOT EXISTS (
    SELECT 1 FROM "SubTopic" WHERE "SubTopic"."topicId" = "Topic"."id"
);

-- Update existing Questions to point to default SubTopic
UPDATE "Question" q
SET "subTopicId" = s.id
FROM "SubTopic" s
WHERE q."subTopicId" IS NULL AND s."topicId" = q."topicId";

-- Create QuestionStats for existing questions
INSERT INTO "QuestionStats" ("id", "questionId", "attemptCount", "correctCount", "avgTimeSeconds", "difficultyRating")
SELECT
    gen_random_uuid()::text,
    "id",
    0, 0, 0, 0
FROM "Question"
WHERE NOT EXISTS (
    SELECT 1 FROM "QuestionStats" WHERE "QuestionStats"."questionId" = "Question"."id"
);