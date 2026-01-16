-- Migration: Make month and year nullable
-- This allows assignments to use either date (new) OR month/year (legacy)

ALTER TABLE assignments 
ALTER COLUMN month DROP NOT NULL,
ALTER COLUMN year DROP NOT NULL;

COMMENT ON COLUMN assignments.month IS 'Month for legacy monthly assignments (nullable)';
COMMENT ON COLUMN assignments.year IS 'Year for legacy monthly assignments (nullable)';
