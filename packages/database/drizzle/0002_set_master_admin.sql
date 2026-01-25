-- Migration: Set bisynth@gmail.com as SUPER_ADMIN
-- Created: 2026-01-25
-- Purpose: Set the master admin role for the platform owner

-- Update the user to SUPER_ADMIN role
-- Note: This will only work if the user already exists in the database
UPDATE users
SET
  role = 'SUPER_ADMIN',
  roles = '["SUPER_ADMIN"]'::jsonb,
  updated_at = NOW()
WHERE email = 'bisynth@gmail.com';

-- Verify the update (this is a SELECT that won't modify data, just for confirmation)
-- You can run this separately to check:
-- SELECT id, email, role, roles, is_active, updated_at
-- FROM users
-- WHERE email = 'bisynth@gmail.com';
