-- Migration: Add daily assignment support
-- This adds date field and team field to assignments table for daily tracking

-- Add new columns
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS team VARCHAR(50);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(date);
CREATE INDEX IF NOT EXISTS idx_assignments_resource_date ON assignments(resource_id, date);

-- Drop old unique constraint (projectId, title, month, year)
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_project_id_title_month_year_key;

-- Add new unique constraint for daily assignments (projectId, resourceId, title, date)
-- This allows same resource to have multiple tasks per project per day
ALTER TABLE assignments 
ADD CONSTRAINT assignments_project_resource_title_date_key 
UNIQUE NULLS NOT DISTINCT (project_id, resource_id, title, date);

-- Add check constraint to ensure either (month/year) OR date is provided
ALTER TABLE assignments
ADD CONSTRAINT assignments_period_check 
CHECK (
  (date IS NOT NULL) OR 
  (month IS NOT NULL AND year IS NOT NULL)
);

COMMENT ON COLUMN assignments.date IS 'Specific date for daily assignments (new system)';
COMMENT ON COLUMN assignments.team IS 'Team type for the assignment (PHP, Front, Mule, etc.)';
COMMENT ON CONSTRAINT assignments_period_check ON assignments IS 'Ensures either date (new) or month/year (legacy) is provided';
