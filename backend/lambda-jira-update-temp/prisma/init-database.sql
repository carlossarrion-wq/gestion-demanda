-- ============================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Sistema de Gestión de Demanda y Capacidad
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TRIGGERS Y FUNCIONES
-- ============================================

-- Función: Actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacity_updated_at 
    BEFORE UPDATE ON capacity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at 
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psb_updated_at 
    BEFORE UPDATE ON project_skill_breakdown
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función: Validar que las horas asignadas no excedan capacidad
CREATE OR REPLACE FUNCTION validate_assignment_hours()
RETURNS TRIGGER AS $$
DECLARE
    total_assigned DECIMAL(10,2);
    resource_capacity DECIMAL(10,2);
BEGIN
    -- Calcular total de horas asignadas para el recurso en ese mes
    SELECT COALESCE(SUM(hours), 0) INTO total_assigned
    FROM assignments
    WHERE resource_id = NEW.resource_id 
      AND month = NEW.month 
      AND year = NEW.year
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- Obtener capacidad del recurso para ese mes
    SELECT total_hours INTO resource_capacity
    FROM capacity
    WHERE resource_id = NEW.resource_id 
      AND month = NEW.month 
      AND year = NEW.year;
    
    -- Si no existe capacidad definida, usar default_capacity del recurso
    IF resource_capacity IS NULL THEN
        SELECT default_capacity INTO resource_capacity
        FROM resources
        WHERE id = NEW.resource_id;
    END IF;
    
    -- Validar que no se exceda la capacidad
    IF (total_assigned + NEW.hours) > resource_capacity THEN
        RAISE EXCEPTION 'Assignment exceeds resource capacity for % (month %, year %). Available: % hours, Trying to assign: % hours', 
            NEW.resource_id, NEW.month, NEW.year,
            (resource_capacity - total_assigned), NEW.hours;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_assignment_capacity 
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION validate_assignment_hours();

-- Función: Validar que el recurso tenga el skill asignado
CREATE OR REPLACE FUNCTION validate_resource_skill()
RETURNS TRIGGER AS $$
DECLARE
    has_skill BOOLEAN;
BEGIN
    -- Verificar que el recurso tenga el skill
    SELECT EXISTS(
        SELECT 1 FROM resource_skills
        WHERE resource_id = NEW.resource_id
        AND skill_id = NEW.skill_id
    ) INTO has_skill;
    
    IF NOT has_skill THEN
        RAISE EXCEPTION 'Resource % does not have skill %. Cannot create assignment.',
            NEW.resource_id, NEW.skill_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_resource_skill 
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION validate_resource_skill();

-- ============================================
-- VISTAS MATERIALIZADAS
-- ============================================

-- Vista 1: Resumen mensual de capacidad del equipo
CREATE MATERIALIZED VIEW mv_monthly_capacity_summary AS
SELECT 
    c.month,
    c.year,
    COUNT(DISTINCT r.id) as total_resources,
    COUNT(DISTINCT CASE WHEN a.resource_id IS NOT NULL THEN r.id END) as assigned_resources,
    COUNT(DISTINCT CASE WHEN occupation_ratio > 80 THEN r.id END) as resources_over_80,
    SUM(c.total_hours) as total_capacity_hours,
    ROUND(SUM(c.total_hours) / 160.0, 2) as total_capacity_ftes,
    SUM(COALESCE(committed.hours, 0)) as committed_hours,
    ROUND(SUM(COALESCE(committed.hours, 0)) / 160.0, 2) as committed_ftes,
    SUM(c.total_hours) - SUM(COALESCE(committed.hours, 0)) as available_hours,
    ROUND((SUM(c.total_hours) - SUM(COALESCE(committed.hours, 0))) / 160.0, 2) as available_ftes,
    ROUND((SUM(COALESCE(committed.hours, 0)) / NULLIF(SUM(c.total_hours), 0) * 100), 2) as efficiency_percentage,
    ROUND(((SUM(c.total_hours) - SUM(COALESCE(committed.hours, 0))) / 160.0), 2) as inefficiency_ftes
FROM capacity c
JOIN resources r ON c.resource_id = r.id
LEFT JOIN (
    SELECT resource_id, month, year, SUM(hours) as hours
    FROM assignments
    GROUP BY resource_id, month, year
) committed ON c.resource_id = committed.resource_id 
    AND c.month = committed.month 
    AND c.year = committed.year
LEFT JOIN assignments a ON c.resource_id = a.resource_id 
    AND c.month = a.month 
    AND c.year = a.year
LEFT JOIN LATERAL (
    SELECT ROUND((SUM(a2.hours) / NULLIF(c.total_hours, 0) * 100), 2) as occupation_ratio
    FROM assignments a2
    WHERE a2.resource_id = c.resource_id 
        AND a2.month = c.month 
        AND a2.year = c.year
) occupation ON TRUE
WHERE r.active = TRUE
GROUP BY c.month, c.year;

CREATE UNIQUE INDEX idx_mv_monthly_capacity ON mv_monthly_capacity_summary(year, month);

-- Vista 2: Utilización y métricas por proyecto
CREATE MATERIALIZED VIEW mv_project_utilization AS
SELECT 
    p.id as project_id,
    p.code,
    p.title,
    p.type,
    p.priority,
    d.name as domain_name,
    s.name as status_name,
    SUM(psb.hours) as total_committed_hours,
    COUNT(DISTINCT a.resource_id) as assigned_resources_count,
    MIN(psb.year * 100 + psb.month) as start_period,
    MAX(psb.year * 100 + psb.month) as end_period,
    p.start_date,
    p.end_date
FROM projects p
LEFT JOIN project_skill_breakdown psb ON p.id = psb.project_id
LEFT JOIN assignments a ON p.id = a.project_id
LEFT JOIN domains d ON p.domain_id = d.id
LEFT JOIN statuses s ON p.status_id = s.id
GROUP BY p.id, p.code, p.title, p.type, p.priority, d.name, s.name, p.start_date, p.end_date;

CREATE UNIQUE INDEX idx_mv_project_util ON mv_project_utilization(project_id);

-- Vista 3: Asignación y ocupación por recurso
CREATE MATERIALIZED VIEW mv_resource_allocation AS
SELECT 
    r.id as resource_id,
    r.code,
    r.name,
    c.month,
    c.year,
    c.total_hours,
    COALESCE(SUM(a.hours), 0) as committed_hours,
    c.total_hours - COALESCE(SUM(a.hours), 0) as available_hours,
    ROUND((COALESCE(SUM(a.hours), 0) / NULLIF(c.total_hours, 0) * 100), 2) as occupation_ratio,
    COUNT(DISTINCT a.project_id) as projects_count,
    ARRAY_AGG(DISTINCT sk.name) FILTER (WHERE sk.name IS NOT NULL) as skills
FROM resources r
JOIN capacity c ON r.id = c.resource_id
LEFT JOIN assignments a ON r.id = a.resource_id 
    AND c.month = a.month 
    AND c.year = a.year
LEFT JOIN resource_skills rs ON r.id = rs.resource_id
LEFT JOIN skills sk ON rs.skill_id = sk.id
WHERE r.active = TRUE
GROUP BY r.id, r.code, r.name, c.month, c.year, c.total_hours;

CREATE UNIQUE INDEX idx_mv_resource_alloc ON mv_resource_allocation(resource_id, year, month);

-- Vista 4: Capacidad por skill/perfil
CREATE MATERIALIZED VIEW mv_skill_capacity AS
SELECT 
    sk.id as skill_id,
    sk.name as skill_name,
    c.month,
    c.year,
    COUNT(DISTINCT r.id) as resources_with_skill,
    SUM(c.total_hours) as total_capacity_hours,
    COALESCE(SUM(a.hours), 0) as committed_hours,
    SUM(c.total_hours) - COALESCE(SUM(a.hours), 0) as available_hours,
    ROUND((COALESCE(SUM(a.hours), 0) / NULLIF(SUM(c.total_hours), 0) * 100), 2) as utilization_percentage
FROM skills sk
JOIN resource_skills rs ON sk.id = rs.skill_id
JOIN resources r ON rs.resource_id = r.id
JOIN capacity c ON r.id = c.resource_id
LEFT JOIN assignments a ON r.id = a.resource_id 
    AND sk.id = a.skill_id 
    AND c.month = a.month 
    AND c.year = a.year
WHERE r.active = TRUE
GROUP BY sk.id, sk.name, c.month, c.year;

CREATE UNIQUE INDEX idx_mv_skill_capacity ON mv_skill_capacity(skill_id, year, month);

-- Función: Refrescar vistas materializadas
CREATE OR REPLACE FUNCTION refresh_capacity_views()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_capacity_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_utilization;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resource_allocation;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skill_capacity;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers para refrescar vistas
CREATE TRIGGER refresh_views_on_assignment 
    AFTER INSERT OR UPDATE OR DELETE ON assignments
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_capacity_views();

CREATE TRIGGER refresh_views_on_capacity 
    AFTER INSERT OR UPDATE OR DELETE ON capacity
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_capacity_views();

CREATE TRIGGER refresh_views_on_psb 
    AFTER INSERT OR UPDATE OR DELETE ON project_skill_breakdown
    FOR EACH STATEMENT EXECUTE FUNCTION refresh_capacity_views();

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
