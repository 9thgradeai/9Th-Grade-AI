-- Add unique constraint to prevent duplicate question attempts within a test
CREATE UNIQUE INDEX IF NOT EXISTS "QuestionAttempt_testId_questionId_key"
  ON "QuestionAttempt"("testId", "questionId");

-- Add index for performance on test completion queries
CREATE INDEX IF NOT EXISTS "QuestionAttempt_testId_idx"
  ON "QuestionAttempt"("testId");
