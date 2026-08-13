-- Migration: Fix master admin email typo and ensure correct SUPER_ADMIN role
-- Created: 2026-01-25
-- Purpose: Correct the email from bisynth@gmail.com to owner@example.com and set SUPER_ADMIN role

-- Update the user to SUPER_ADMIN role with the correct email
-- This will only work if the user already exists in the database
UPDATE users
SET
  role = 'SUPER_ADMIN',
  roles = '["SUPER_ADMIN"]'::jsonb,
  updated_at = NOW()
WHERE email = 'owner@example.com';

-- Verify the update (this is a SELECT that won't modify data, just for confirmation)
-- You can run this separately to check:
-- SELECT id, email, role, roles, is_active, updated_at
-- FROM users
-- WHERE email = 'owner@example.com';
