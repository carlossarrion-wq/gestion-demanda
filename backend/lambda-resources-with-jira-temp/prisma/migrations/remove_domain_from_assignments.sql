-- Migration: Remove domain_name field from assignments table
-- Date: 2025-12-17
-- Description: Removes the domain_name column and its index from assignments table
--              Domain is a project attribute, not an assignment attribute

-- Drop the index first
DROP INDEX IF EXISTS idx_assignments_domain_name;

-- Remove the domain_name column
ALTER TABLE assignments DROP COLUMN IF EXISTS domain_name;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assignments'
ORDER BY ordinal_position;
