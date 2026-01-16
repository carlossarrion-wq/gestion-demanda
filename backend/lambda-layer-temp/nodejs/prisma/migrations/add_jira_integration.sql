-- Migración: Agregar campos de integración con Jira

-- Agregar campos de Jira a la tabla projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS jira_project_key TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS jira_url TEXT;

-- Agregar campos de Jira a la tabla assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS jira_issue_key TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS jira_issue_id TEXT;

-- Crear índice único para jira_issue_key en assignments (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'assignments_jira_issue_key_key'
    ) THEN
        CREATE UNIQUE INDEX assignments_jira_issue_key_key ON assignments(jira_issue_key);
    END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN projects.jira_project_key IS 'Clave del proyecto en Jira (ej: PROJ)';
COMMENT ON COLUMN projects.jira_url IS 'URL base de la instancia de Jira';
COMMENT ON COLUMN assignments.jira_issue_key IS 'Clave del issue en Jira (ej: PROJ-123)';
COMMENT ON COLUMN assignments.jira_issue_id IS 'ID numérico del issue en Jira';
