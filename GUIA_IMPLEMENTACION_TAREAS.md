# Guía de Implementación - Sistema de Tareas

**Fecha de creación:** 16/12/2025 17:12
**Estado general:** 🟡 En progreso

---

## RESUMEN EJECUTIVO

Este documento guía la implementación completa del sistema de tareas, que incluye:
1. Eliminar la tabla `Skill` y migrar todo a `ResourceSkill` con campo proficiency
2. Modificar la tabla `Assignment` para que funcione como tabla de tareas
3. Conectar el frontend (modal Handsontable) con el backend

---

## FASE 1: MIGRACIÓN DE SKILLS A RESOURCE_SKILLS

### 1.1. Estado Actual
- ✅ Tabla `Skill` existe con: id, name, description
- ✅ Tabla `ResourceSkill` existe con: id, resourceId, skillId, proficiency, createdAt
- ⚠️ Necesitamos: Eliminar `Skill` y que `ResourceSkill` tenga el nombre directamente

### 1.2. Modificar Schema Prisma - ResourceSkill
**Estado:** ⏳ Pendiente

**Cambios en `ResourceSkill`:**
- Eliminar relación con `Skill`
- Eliminar campo `skillId`
- Añadir campo `skillName` (String)
- Mantener campo `proficiency` (String opcional: 'junior', 'mid', 'senior', o null)

**Nuevo modelo:**
```prisma
model ResourceSkill {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  resourceId  String   @map("resource_id") @db.Uuid
  skillName   String   @map("skill_name") @db.VarChar(100)
  proficiency String?  @db.VarChar(20)  // 'junior', 'mid', 'senior', o null
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  resource    Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([resourceId, skillName])
  @@index([resourceId], map: "idx_resource_skills_resource")
  @@map("resource_skills")
}
```

### 1.3. Eliminar modelo Skill del Schema
**Estado:** ⏳ Pendiente

- Eliminar modelo `Skill` completo
- Eliminar todas las relaciones con `Skill` en otros modelos

### 1.4. Script de Migración SQL
**Estado:** ⏳ Pendiente

**Archivo:** `backend/prisma/migrations/migrate_skills_to_resource_skills.sql`

**Pasos:**
1. Añadir columna `skill_name` a `resource_skills`
2. Copiar nombres de skills desde tabla `skills` usando el `skill_id`
3. Eliminar constraint de foreign key `skill_id`
4. Eliminar columna `skill_id`
5. Eliminar todas las referencias a `skills` en otras tablas
6. Eliminar tabla `skills`
7. Crear nuevo unique constraint en (resource_id, skill_name)

---

## FASE 2: MODIFICACIÓN DE TABLA ASSIGNMENT PARA TAREAS

### 2.1. Estado Actual de Assignment
**Campos actuales:**
- id, projectId, resourceId, skillId, month, year, hours, createdAt, updatedAt

**Problema:** Está diseñada para asignaciones de recursos, no para tareas

### 2.2. Modificar Schema Prisma - Assignment
**Estado:** ⏳ Pendiente

**Campos a AÑADIR:**
- `title` - String(255) - Título de la tarea (REQUERIDO)
- `description` - String opcional - Descripción de la tarea
- `skillName` - String opcional(100) - Nombre de la skill (nullable)
- `domainName` - String opcional(100) - Nombre del dominio (nullable)

**Campos a MODIFICAR:**
- `resourceId` - Hacer NULLABLE (puede estar sin asignar)
- `skillId` - ELIMINAR (reemplazado por skillName)

**Campos a MANTENER:**
- id, projectId, month, year, hours, createdAt, updatedAt

**Nuevo modelo:**
```prisma
model Assignment {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId   String    @map("project_id") @db.Uuid
  resourceId  String?   @map("resource_id") @db.Uuid  // NULLABLE
  title       String    @db.VarChar(255)              // NUEVO
  description String?                                  // NUEVO
  skillName   String?   @map("skill_name") @db.VarChar(100)  // NUEVO
  domainName  String?   @map("domain_name") @db.VarChar(100) // NUEVO
  month       Int
  year        Int
  hours       Decimal   @db.Decimal(10, 2)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamp(6)
  updatedAt   DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamp(6)
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  resource    Resource? @relation(fields: [resourceId], references: [id], onDelete: SetNull)

  @@unique([projectId, title, month, year])
  @@index([projectId], map: "idx_assignments_project")
  @@index([resourceId], map: "idx_assignments_resource")
  @@index([year, month], map: "idx_assignments_period")
  @@map("assignments")
}
```

### 2.3. Actualizar modelo Project
**Estado:** ⏳ Pendiente

Eliminar relación con `Skill`:
```prisma
model Project {
  // ... otros campos
  assignments            Assignment[]
  // ELIMINAR: projectSkillBreakdowns ProjectSkillBreakdown[]
}
```

### 2.4. Script de Migración SQL para Assignment
**Estado:** ⏳ Pendiente

**Archivo:** `backend/prisma/migrations/modify_assignments_for_tasks.sql`

**Pasos:**
1. Añadir columnas: title, description, skill_name, domain_name
2. Modificar resourceId para permitir NULL
3. Migrar datos existentes (si los hay):
   - Copiar nombre de skill desde tabla skills usando skill_id
   - Generar títulos temporales para registros existentes
4. Eliminar constraint de foreign key skill_id
5. Eliminar columna skill_id
6. Modificar unique constraint

---

## FASE 3: BACKEND - API DE TAREAS

### 3.1. Actualizar assignmentsHandler.ts
**Estado:** ⏳ Pendiente

**Archivo:** `backend/src/functions/assignmentsHandler.ts`

**Endpoints a implementar:**

#### GET /assignments?projectId={uuid}
**Descripción:** Obtener todas las tareas de un proyecto
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "title": "Tarea 1",
      "description": "Descripción",
      "skillName": "Desarrollo",
      "domainName": null,
      "month": 12,
      "year": 2025,
      "hours": 40,
      "resourceId": null,
      "createdAt": "2025-12-16T...",
      "updatedAt": "2025-12-16T..."
    }
  ]
}
```

#### POST /assignments
**Descripción:** Crear nueva tarea
**Body:**
```json
{
  "projectId": "uuid",
  "title": "Nueva tarea",
  "description": "Descripción opcional",
  "skillName": "Desarrollo",
  "domainName": null,
  "month": 12,  // Auto-generar si no se proporciona
  "year": 2025, // Auto-generar si no se proporciona
  "hours": 40
}
```
**Lógica:**
- resourceId = null por defecto
- Si month/year no se proporcionan, usar fecha actual
- Auto-generar: id, createdAt, updatedAt

#### PUT /assignments/{id}
**Descripción:** Actualizar tarea existente
**Body:** Campos a actualizar
**Lógica:**
- Permitir modificar: title, description, skillName, domainName, month, year, hours
- Auto-actualizar: updatedAt
- NO permitir cambiar: projectId, resourceId (eso se hace en otra vista)

#### DELETE /assignments/{id}
**Descripción:** Eliminar tarea
**Validaciones:**
- Verificar que la tarea existe
- Verificar permisos (opcional)

### 3.2. Implementar auto-llenado de month/year
**Estado:** ⏳ Pendiente

**Lógica en el backend:**
```typescript
const currentDate = new Date();
const month = body.month || currentDate.getMonth() + 1;
const year = body.year || currentDate.getFullYear();
```

---

## FASE 4: FRONTEND - CONECTAR MODAL CON BACKEND

### 4.1. Actualizar taskModal.js
**Estado:** ⏳ Pendiente

**Archivo:** `assets/js/components/taskModal.js`

**Cambios necesarios:**

#### 4.1.1. Cargar tareas desde API
Reemplazar `projectTasks` en memoria por llamada a API:
```javascript
async function loadTasksFromAPI(projectId) {
    const response = await fetch(`${API_BASE}/assignments?projectId=${projectId}`);
    const data = await response.json();
    return data.data || [];
}
```

#### 4.1.2. Guardar tarea en API (POST)
```javascript
async function saveTaskToAPI(task) {
    const response = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    return response.json();
}
```

#### 4.1.3. Actualizar tarea en API (PUT)
```javascript
async function updateTaskInAPI(taskId, task) {
    const response = await fetch(`${API_BASE}/assignments/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    return response.json();
}
```

#### 4.1.4. Eliminar tarea en API (DELETE)
```javascript
async function deleteTaskFromAPI(taskId) {
    const response = await fetch(`${API_BASE}/assignments/${taskId}`, {
        method: 'DELETE'
    });
    return response.json();
}
```

### 4.2. Modificar columnas de Handsontable
**Estado:** ⏳ Pendiente

**Cambios:**
- Eliminar columna "Sel." (checkbox) - no necesaria con API
- Cambiar "ID Tarea" a solo lectura (generado por backend)
- Añadir columna "Dominio" (dropdown con dominios de la BD)
- Modificar columna "Equipo" por "Skill" (dropdown con skills de resource_skills)
- Añadir columna "Mes" (numérico 1-12)
- Añadir columna "Año" (numérico, default 2025)

**Nuevas columnas:**
1. ID Tarea (readonly)
2. Título
3. Descripción
4. Skill (dropdown)
5. Dominio (dropdown)
6. Mes (numeric)
7. Año (numeric)
8. Horas (numeric)

### 4.3. Cargar dropdowns dinámicamente
**Estado:** ⏳ Pendiente

**Skills:** Obtener de `resource_skills` (nombres únicos)
**Dominios:** Obtener de tabla `domains`

---

## FASE 5: CONFIGURACIÓN Y DESPLIEGUE

### 5.1. Añadir endpoint a config/data.js
**Estado:** ⏳ Pendiente

```javascript
ASSIGNMENTS: '/assignments'
```

### 5.2. Compilar TypeScript
**Estado:** ⏳ Pendiente

```bash
cd backend
npm run build
```

### 5.3. Ejecutar migraciones
**Estado:** ⏳ Pendiente

```bash
cd backend
npx prisma migrate dev --name migrate_skills_and_modify_assignments
npx prisma generate
```

### 5.4. Desplegar Lambda (si aplica)
**Estado:** ⏳ Pendiente

### 5.5. Configurar API Gateway
**Estado:** ⏳ Pendiente

Añadir rutas:
- GET /assignments
- POST /assignments
- PUT /assignments/{id}
- DELETE /assignments/{id}

---

## FASE 6: PRUEBAS

### 6.1. Pruebas de Base de Datos
**Estado:** ⏳ Pendiente

- [ ] Verificar que tabla `skills` fue eliminada
- [ ] Verificar que `resource_skills` tiene skill_name
- [ ] Verificar que `assignments` tiene nuevos campos
- [ ] Verificar que datos fueron migrados correctamente

### 6.2. Pruebas de Backend
**Estado:** ⏳ Pendiente

- [ ] GET /assignments?projectId={id} retorna tareas
- [ ] POST /assignments crea tarea correctamente
- [ ] PUT /assignments/{id} actualiza tarea
- [ ] DELETE /assignments/{id} elimina tarea
- [ ] Month/year se auto-generan si no se proporcionan

### 6.3. Pruebas de Frontend
**Estado:** ⏳ Pendiente

- [ ] Modal se abre correctamente
- [ ] Tareas se cargan desde API
- [ ] Añadir tarea guarda en BD
- [ ] Editar tarea actualiza en BD
- [ ] Eliminar tarea borra de BD
- [ ] Dropdowns de Skill y Dominio funcionan
- [ ] Validaciones funcionan correctamente

---

## CHECKLIST GENERAL

### Fase 1: Skills Migration
- [ ] Modificar schema ResourceSkill
- [ ] Eliminar modelo Skill del schema
- [ ] Crear script de migración SQL
- [ ] Ejecutar migración
- [ ] Verificar datos migrados

### Fase 2: Assignment Modification
- [ ] Modificar schema Assignment
- [ ] Actualizar modelo Project
- [ ] Crear script de migración SQL
- [ ] Ejecutar migración
- [ ] Verificar estructura de tabla

### Fase 3: Backend API
- [ ] Implementar GET /assignments
- [ ] Implementar POST /assignments
- [ ] Implementar PUT /assignments/{id}
- [ ] Implementar DELETE /assignments/{id}
- [ ] Implementar auto-llenado month/year
- [ ] Compilar TypeScript

### Fase 4: Frontend
- [ ] Actualizar taskModal.js con llamadas API
- [ ] Modificar columnas Handsontable
- [ ] Implementar carga de dropdowns
- [ ] Eliminar lógica de memoria
- [ ] Añadir manejo de errores

### Fase 5: Deployment
- [ ] Añadir endpoint a config
- [ ] Ejecutar migraciones Prisma
- [ ] Desplegar Lambda
- [ ] Configurar API Gateway
- [ ] Probar endpoints

### Fase 6: Testing
- [ ] Pruebas de BD
- [ ] Pruebas de Backend
- [ ] Pruebas de Frontend
- [ ] Pruebas End-to-End

---

## NOTAS IMPORTANTES

1. **Backup de BD:** Hacer backup antes de ejecutar migraciones
2. **Orden de ejecución:** Seguir el orden de las fases estrictamente
3. **Proficiency values:** 'junior', 'mid', 'senior', o null
4. **Month/Year:** Auto-generar en backend si no se proporciona
5. **ResourceId:** Siempre null al crear tarea (se asigna después)

---

**Última actualización:** 16/12/2025 17:12
**Actualizado por:** Cline AI Assistant
