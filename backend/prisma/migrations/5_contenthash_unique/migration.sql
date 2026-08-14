-- Add unique constraint on contentHash to prevent duplicate questions
-- PostgreSQL allows multiple NULLs in a unique index, so questions without
-- a contentHash are unaffected. Only non-null hashes must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS "Question_contentHash_key"
  ON "Question" ("contentHash")
  WHERE "contentHash" IS NOT NULL;
