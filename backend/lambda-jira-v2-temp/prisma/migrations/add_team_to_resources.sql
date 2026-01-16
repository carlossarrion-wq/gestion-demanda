-- Add team column to resources table
ALTER TABLE resources ADD COLUMN team VARCHAR(50);

-- Create index on team column for better query performance
CREATE INDEX idx_resources_team ON resources(team);

-- Distribute existing resources among the 4 teams: darwin, mulesoft, sap, saplcorp
-- This distributes resources evenly across all 4 teams
WITH numbered_resources AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM resources
)
UPDATE resources r
SET team = CASE 
  WHEN nr.rn % 4 = 1 THEN 'darwin'
  WHEN nr.rn % 4 = 2 THEN 'mulesoft'
  WHEN nr.rn % 4 = 3 THEN 'sap'
  ELSE 'saplcorp'
END
FROM numbered_resources nr
WHERE r.id = nr.id;

-- Set NOT NULL constraint after populating the data
ALTER TABLE resources ALTER COLUMN team SET NOT NULL;
