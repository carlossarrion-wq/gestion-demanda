-- Migration Script: Migrate Skills to Resource Skills
-- This script migrates data from the skills table to resource_skills table
-- by replacing skill_id foreign key with skill_name

-- Step 0a: Drop function that refreshes materialized views (if exists)
DROP FUNCTION IF EXISTS refresh_capacity_views() CASCADE;

-- Step 0b: Drop materialized views that depend on skill_id
DROP MATERIALIZED VIEW IF EXISTS mv_resource_allocation CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_skill_capacity CASCADE;

-- Step 1: Add skill_name column to resource_skills table
ALTER TABLE resource_skills 
ADD COLUMN skill_name VARCHAR(100);

-- Step 2: Populate skill_name from skills table
UPDATE resource_skills rs
SET skill_name = s.name
FROM skills s
WHERE rs.skill_id = s.id;

-- Step 3: Make skill_name NOT NULL (after data is populated)
ALTER TABLE resource_skills 
ALTER COLUMN skill_name SET NOT NULL;

-- Step 4: Drop the foreign key constraint to skills table
ALTER TABLE resource_skills 
DROP CONSTRAINT IF EXISTS resource_skills_skill_id_fkey;

-- Step 5: Drop the old skill_id column
ALTER TABLE resource_skills 
DROP COLUMN skill_id;

-- Step 6: Drop the old unique constraint
ALTER TABLE resource_skills 
DROP CONSTRAINT IF EXISTS resource_skills_resource_id_skill_id_key;

-- Step 7: Create new unique constraint on resource_id and skill_name
ALTER TABLE resource_skills 
ADD CONSTRAINT resource_skills_resource_id_skill_name_key 
UNIQUE (resource_id, skill_name);

-- Step 8: Drop the old index on skill_id
DROP INDEX IF EXISTS idx_resource_skills_skill;

-- Step 9: Create new index on skill_name
CREATE INDEX idx_resource_skills_skill_name ON resource_skills(skill_name);

-- Step 10: Handle assignments table - add skill_name column
ALTER TABLE assignments 
ADD COLUMN skill_name VARCHAR(100);

-- Step 11: Populate skill_name in assignments from skills table
UPDATE assignments a
SET skill_name = s.name
FROM skills s
WHERE a.skill_id = s.id;

-- Step 12: Handle project_skill_breakdown table - add skill_name column
ALTER TABLE project_skill_breakdown 
ADD COLUMN skill_name VARCHAR(100);

-- Step 13: Populate skill_name in project_skill_breakdown from skills table
UPDATE project_skill_breakdown psb
SET skill_name = s.name
FROM skills s
WHERE psb.skill_id = s.id;

-- Step 14: Drop foreign key constraints from assignments
ALTER TABLE assignments 
DROP CONSTRAINT IF EXISTS assignments_skill_id_fkey;

-- Step 15: Drop foreign key constraints from project_skill_breakdown
ALTER TABLE project_skill_breakdown 
DROP CONSTRAINT IF EXISTS project_skill_breakdown_skill_id_fkey;

-- Step 16: Drop skill_id column from assignments
ALTER TABLE assignments 
DROP COLUMN skill_id;

-- Step 17: Drop skill_id column from project_skill_breakdown
ALTER TABLE project_skill_breakdown 
DROP COLUMN skill_id;

-- Step 18: Drop the skills table (no longer needed)
DROP TABLE IF EXISTS skills CASCADE;

-- Step 19: Update assignments table for task functionality
-- Add new columns for task management
ALTER TABLE assignments 
ADD COLUMN title VARCHAR(255),
ADD COLUMN description TEXT,
ADD COLUMN domain_name VARCHAR(100);

-- Step 20: Make resourceId nullable in assignments
ALTER TABLE assignments 
ALTER COLUMN resource_id DROP NOT NULL;

-- Step 21: Update the resource foreign key to SET NULL on delete
ALTER TABLE assignments 
DROP CONSTRAINT IF EXISTS assignments_resource_id_fkey;

ALTER TABLE assignments 
ADD CONSTRAINT assignments_resource_id_fkey 
FOREIGN KEY (resource_id) 
REFERENCES resources(id) 
ON DELETE SET NULL;

-- Step 22: Drop old unique constraint on assignments
ALTER TABLE assignments 
DROP CONSTRAINT IF EXISTS assignments_project_id_resource_id_skill_id_month_year_key;

-- Step 23: For existing assignments, populate title with a default value
UPDATE assignments 
SET title = CONCAT('Task-', SUBSTRING(id::text, 1, 8))
WHERE title IS NULL;

-- Step 24: Make title NOT NULL after populating
ALTER TABLE assignments 
ALTER COLUMN title SET NOT NULL;

-- Step 25: Create new unique constraint on assignments
ALTER TABLE assignments 
ADD CONSTRAINT assignments_project_id_title_month_year_key 
UNIQUE (project_id, title, month, year);

-- Step 26: Drop old index on skill_id
DROP INDEX IF EXISTS idx_assignments_skill;

-- Step 27: Create new indexes on assignments
CREATE INDEX idx_assignments_skill_name ON assignments(skill_name);
CREATE INDEX idx_assignments_domain_name ON assignments(domain_name);

-- Step 28: Update project_skill_breakdown indexes
DROP INDEX IF EXISTS idx_psb_skill;
CREATE INDEX idx_psb_skill_name ON project_skill_breakdown(skill_name);

-- Step 29: Recreate mv_resource_allocation with new structure
CREATE MATERIALIZED VIEW mv_resource_allocation AS
SELECT 
  r.id AS resource_id,
  r.code,
  r.name,
  c.month,
  c.year,
  c.total_hours,
  COALESCE(SUM(a.hours), 0::numeric) AS committed_hours,
  (c.total_hours - COALESCE(SUM(a.hours), 0::numeric)) AS available_hours,
  ROUND(((COALESCE(SUM(a.hours), 0::numeric) / NULLIF(c.total_hours, 0::numeric)) * 100::numeric), 2) AS occupation_ratio,
  COUNT(DISTINCT a.project_id) AS projects_count,
  ARRAY_AGG(DISTINCT rs.skill_name) FILTER (WHERE rs.skill_name IS NOT NULL) AS skills
FROM resources r
JOIN capacity c ON r.id = c.resource_id
LEFT JOIN assignments a ON r.id = a.resource_id AND c.month = a.month AND c.year = a.year
LEFT JOIN resource_skills rs ON r.id = rs.resource_id
WHERE r.active = true
GROUP BY r.id, r.code, r.name, c.month, c.year, c.total_hours;

-- Step 30: Recreate mv_skill_capacity with new structure
CREATE MATERIALIZED VIEW mv_skill_capacity AS
SELECT 
  rs.skill_name,
  c.month,
  c.year,
  COUNT(DISTINCT r.id) AS resources_with_skill,
  SUM(c.total_hours) AS total_capacity_hours,
  COALESCE(SUM(a.hours), 0::numeric) AS committed_hours,
  (SUM(c.total_hours) - COALESCE(SUM(a.hours), 0::numeric)) AS available_hours,
  ROUND(((COALESCE(SUM(a.hours), 0::numeric) / NULLIF(SUM(c.total_hours), 0::numeric)) * 100::numeric), 2) AS utilization_percentage
FROM resource_skills rs
JOIN resources r ON rs.resource_id = r.id
JOIN capacity c ON r.id = c.resource_id
LEFT JOIN assignments a ON r.id = a.resource_id AND rs.skill_name = a.skill_name AND c.month = a.month AND c.year = a.year
WHERE r.active = true
GROUP BY rs.skill_name, c.month, c.year;

-- Step 31: Create indexes on materialized views
CREATE INDEX idx_mv_resource_allocation_resource ON mv_resource_allocation(resource_id);
CREATE INDEX idx_mv_resource_allocation_period ON mv_resource_allocation(year, month);
CREATE INDEX idx_mv_skill_capacity_skill ON mv_skill_capacity(skill_name);
CREATE INDEX idx_mv_skill_capacity_period ON mv_skill_capacity(year, month);

-- Step 32: Recreate the refresh function with new structure
CREATE OR REPLACE FUNCTION refresh_capacity_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resource_allocation;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skill_capacity;
END;
$$ LANGUAGE plpgsql;

-- Migration complete
-- Summary:
-- - resource_skills now uses skill_name instead of skill_id
-- - assignments now uses skill_name instead of skill_id
-- - assignments has new fields: title, description, domain_name
-- - assignments.resource_id is now nullable
-- - project_skill_breakdown now uses skill_name instead of skill_id
-- - skills table has been dropped
-- - Materialized views recreated with new structure
-- - refresh_capacity_views() function recreated
