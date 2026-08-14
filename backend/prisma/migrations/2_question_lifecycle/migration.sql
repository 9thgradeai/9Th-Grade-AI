-- Migrate legacy status values to the production lifecycle
-- IMPORTED → NEEDS_REVIEW → VALIDATED → PUBLISHED → ARCHIVED → REJECTED

UPDATE "Question" SET status = 'IMPORTED' WHERE status = 'draft';
UPDATE "Question" SET status = 'NEEDS_REVIEW' WHERE status = 'review';
UPDATE "Question" SET status = 'VALIDATED' WHERE status = 'approved';

-- Ensure no unknown statuses remain (safety net)
UPDATE "Question" SET status = 'IMPORTED' WHERE status NOT IN ('IMPORTED', 'NEEDS_REVIEW', 'VALIDATED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');
