-- Clear all existing plaintext reset tokens and verification tokens.
-- After this migration, tokens are stored as SHA-256 hashes only.
-- Users with pending resets/verifications will need to request new ones.

UPDATE "User" SET "resetToken" = NULL, "resetTokenExpires" = NULL WHERE "resetToken" IS NOT NULL;
UPDATE "User" SET "verificationToken" = NULL WHERE "verificationToken" IS NOT NULL;
