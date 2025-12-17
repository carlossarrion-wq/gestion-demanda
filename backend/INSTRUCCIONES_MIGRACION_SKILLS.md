# Instrucciones de Migración: Skills a Resource Skills

## Resumen

Esta migración transforma la estructura de la base de datos para:
1. **Eliminar la tabla `skills`** completamente
2. **Modificar `resource_skills`**: Cambiar de referencia por ID (`skill_id`) a nombre directo (`skill_name`)
3. **Modificar `assignments`**: Añadir campos para tareas (title, description, skillName, domainName) y hacer `resourceId` nullable
4. **Modificar `project_skill_breakdown`**: Cambiar de `skill_id` a `skill_name`

## ⚠️ IMPORTANTE - Antes de Ejecutar

### 1. Backup de la Base de Datos
```bash
# Crear backup completo
pg_dump -h <host> -U <usuario> -d <database> -F c -b -v -f backup_antes_migracion_skills_$(date +%Y%m%d_%H%M%S).backup
```

### 2. Verificar Conexión a Base de Datos
Asegúrate de que el archivo `.env` tiene la configuración correcta:
```
DATABASE_URL="postgresql://usuario:password@host:5432/database?schema=public"
```

### 3. Verificar Estado Actual
```bash
cd backend
node prisma/apply-skills-migration.js
```
Este script verificará si la migración ya fue aplicada.

## Pasos de Ejecución

### Paso 1: Ejecutar la Migración

```bash
cd backend
node prisma/apply-skills-migration.js
```

El script:
- ✅ Verifica si la migración ya fue aplicada
- ✅ Muestra cuántos registros serán afectados
- ✅ Ejecuta la migración en una transacción (rollback automático si falla)
- ✅ Verifica que los cambios se aplicaron correctamente

### Paso 2: Generar Cliente Prisma

Después de la migración exitosa, regenera el cliente Prisma:

```bash
npm run prisma:generate
```

O directamente:
```bash
npx prisma generate
```

### Paso 3: Verificar Cambios en la Base de Datos

Conéctate a la base de datos y verifica:

```sql
-- Verificar que skills table no existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'skills';
-- Debe retornar 0 filas

-- Verificar estructura de resource_skills
\d resource_skills
-- Debe tener: id, resource_id, skill_name, proficiency, created_at

-- Verificar estructura de assignments
\d assignments
-- Debe tener: id, project_id, resource_id (nullable), title, description, 
--             skill_name, domain_name, month, year, hours, created_at, updated_at

-- Verificar datos migrados en resource_skills
SELECT rs.id, r.name as resource_name, rs.skill_name, rs.proficiency
FROM resource_skills rs
JOIN resources r ON rs.resource_id = r.id
LIMIT 5;

-- Verificar datos migrados en assignments
SELECT a.id, p.code as project_code, a.title, a.skill_name, a.domain_name
FROM assignments a
JOIN projects p ON a.project_id = p.id
LIMIT 5;
```

## Cambios Realizados por la Migración

### 1. Tabla `resource_skills`
**ANTES:**
```
- id (UUID)
- resource_id (UUID) → FK a resources
- skill_id (UUID) → FK a skills
- proficiency (VARCHAR)
- created_at (TIMESTAMP)
```

**DESPUÉS:**
```
- id (UUID)
- resource_id (UUID) → FK a resources
- skill_name (VARCHAR) ← NUEVO: nombre directo del skill
- proficiency (VARCHAR)
- created_at (TIMESTAMP)
```

### 2. Tabla `assignments`
**ANTES:**
```
- id, project_id, resource_id (NOT NULL), skill_id
- month, year, hours
- created_at, updated_at
```

**DESPUÉS:**
```
- id, project_id, resource_id (NULLABLE), skill_name
- title (VARCHAR 255) ← NUEVO
- description (TEXT) ← NUEVO
- domain_name (VARCHAR 100) ← NUEVO
- month, year, hours
- created_at, updated_at
```

### 3. Tabla `project_skill_breakdown`
**ANTES:**
```
- skill_id (UUID) → FK a skills
```

**DESPUÉS:**
```
- skill_name (VARCHAR) ← nombre directo del skill
```

### 4. Tabla `skills`
**ELIMINADA COMPLETAMENTE**

## Actualización del Código Backend

Después de la migración, necesitas actualizar los handlers que usan estas tablas:

### Archivos a Actualizar:
1. `src/functions/resourcesHandler.ts` - Actualizar queries de resource_skills
2. `src/functions/assignmentsHandler.ts` - Actualizar para nueva estructura de assignments
3. `src/functions/projectsHandler.ts` - Si usa project_skill_breakdown

### Ejemplo de Cambio en resourcesHandler.ts:

**ANTES:**
```typescript
const resourceSkills = await prisma.resourceSkill.findMany({
  where: { resourceId },
  include: { skill: true }
});
```

**DESPUÉS:**
```typescript
const resourceSkills = await prisma.resourceSkill.findMany({
  where: { resourceId }
  // Ya no hay relación con skill, skill_name está directamente en el registro
});
```

## Rollback (Si es Necesario)

Si necesitas revertir la migración:

```bash
# Restaurar desde backup
pg_restore -h <host> -U <usuario> -d <database> -v backup_antes_migracion_skills_YYYYMMDD_HHMMSS.backup
```

Luego revertir el schema de Prisma al estado anterior (usar git):
```bash
git checkout HEAD~1 -- prisma/schema.prisma
npm run prisma:generate
```

## Verificación Post-Migración

### 1. Verificar Integridad de Datos
```sql
-- Verificar que no hay resource_skills sin skill_name
SELECT COUNT(*) FROM resource_skills WHERE skill_name IS NULL;
-- Debe retornar 0

-- Verificar que no hay assignments sin title
SELECT COUNT(*) FROM assignments WHERE title IS NULL;
-- Debe retornar 0

-- Verificar constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'resource_skills'::regclass;

SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'assignments'::regclass;
```

### 2. Probar Queries Básicas
```sql
-- Listar skills únicos en resource_skills
SELECT DISTINCT skill_name FROM resource_skills ORDER BY skill_name;

-- Listar assignments con sus datos
SELECT 
  a.title,
  a.skill_name,
  a.domain_name,
  r.name as resource_name,
  p.code as project_code
FROM assignments a
LEFT JOIN resources r ON a.resource_id = r.id
JOIN projects p ON a.project_id = p.id
LIMIT 10;
```

## Próximos Pasos

1. ✅ Migración ejecutada
2. ✅ Cliente Prisma regenerado
3. ⏳ Actualizar handlers del backend
4. ⏳ Actualizar frontend para usar nueva estructura
5. ⏳ Probar funcionalidad completa
6. ⏳ Desplegar a producción

## Soporte

Si encuentras problemas durante la migración:
1. Revisa los logs del script de migración
2. Verifica la conexión a la base de datos
3. Asegúrate de tener permisos suficientes
4. Consulta el backup antes de intentar correcciones manuales
