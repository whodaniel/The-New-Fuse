ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "verification_token" varchar(255),
  ADD COLUMN IF NOT EXISTS "verification_expires" timestamp;
