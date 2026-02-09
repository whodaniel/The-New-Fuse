-- CreateTable
CREATE TABLE "OnboardingConfig" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OnboardingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingAnalytics" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userType" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "completionStatus" TEXT NOT NULL DEFAULT 'in_progress',
  "stepsCompleted" INTEGER NOT NULL DEFAULT 0,
  "totalSteps" INTEGER NOT NULL,
  "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
  "dropOffStep" TEXT,
  "deviceInfo" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OnboardingAnalytics_pkey" PRIMARY KEY ("id")
);

-- Add onboarding fields to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingData" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userType" TEXT NOT NULL DEFAULT 'human';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingConfig_type_key" ON "OnboardingConfig"("type");
