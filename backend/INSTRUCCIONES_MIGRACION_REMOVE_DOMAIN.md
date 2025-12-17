# Instrucciones de Migración: Eliminar Domain de Assignments

## Descripción

Esta migración elimina el campo `domain_name` de la tabla `assignments` y su índice asociado. El dominio es un atributo del proyecto, no de las asignaciones/tareas individuales.

## Cambios Realizados

### 1. Schema de Prisma (`prisma/schema.prisma`)
- ✅ Eliminado campo `domainName` del modelo `Assignment`
- ✅ Eliminado índice `idx_assignments_domain_name`
- ✅ Los campos temporales (`createdAt`, `updatedAt`) ya tienen decoradores correctos
- ✅ Los campos `month` y `year` se manejan manualmente (no tienen defaults automáticos)

### 2. Handler de Assignments (`src/functions/assignmentsHandler.ts`)
- ✅ Eliminadas todas las referencias a `domainName` en:
  - Función `listAssignments()` - filtros de query
  - Función `createAssignment()` - creación de datos

### 3. Frontend (`assets/js/components/assignmentView.js`)
- ✅ Ya no incluye columna de dominio en Handsontable
- ✅ No envía `domainName` en las peticiones al backend

## Pasos de Despliegue

### Paso 1: Aplicar Migración a la Base de Datos

```powershell
# Desde el directorio backend
cd backend

# Ejecutar script de migración
node prisma/apply-remove-domain-migration.js
```

Este script:
1. Verifica si la columna `domain_name` existe
2. Elimina el índice `idx_assignments_domain_name`
3. Elimina la columna `domain_name` de la tabla `assignments`
4. Verifica la estructura final de la tabla
5. Regenera el cliente Prisma

### Paso 2: Verificar la Migración

El script mostrará una tabla con las columnas actuales de `assignments`. Verifica que:
- ✅ La columna `domain_name` NO aparece en la lista
- ✅ Las columnas esperadas están presentes:
  - `id`, `project_id`, `resource_id`, `title`, `description`
  - `skill_name`, `month`, `year`, `hours`
  - `created_at`, `updated_at`

### Paso 3: Redesplegar Lambda de Assignments

```powershell
# Desde el directorio backend
.\deploy-assignments.ps1
```

Este script:
1. Compila el código TypeScript actualizado
2. Empaqueta las dependencias
3. Crea el archivo ZIP
4. Actualiza la función Lambda en AWS

### Paso 4: Verificar el Despliegue

```powershell
# Probar la función Lambda
.\test-assignments-lambda.ps1
```

Verifica que:
- ✅ La función responde correctamente
- ✅ No hay errores relacionados con `domainName`
- ✅ Las asignaciones se listan sin el campo `domain_name`

## Verificación en la Aplicación

1. **Abrir la aplicación web** en el navegador
2. **Navegar a la tabla de proyectos**
3. **Hacer clic en el botón "Asignación de Recursos" (👤)** de cualquier proyecto
4. **Verificar que:**
   - ✅ El modal se abre correctamente
   - ✅ La tabla Handsontable muestra 9 columnas (sin dominio)
   - ✅ Las columnas son: ID, Título, Descripción, Mes, Año, Horas, Skill Requerida, Recurso Asignado, Estado
   - ✅ Los datos se cargan correctamente
   - ✅ Se pueden editar las celdas y guardar cambios
   - ✅ No hay errores en la consola del navegador

## Rollback (Si es necesario)

Si necesitas revertir la migración:

```sql
-- Agregar de nuevo la columna domain_name
ALTER TABLE assignments ADD COLUMN domain_name VARCHAR(100);

-- Recrear el índice
CREATE INDEX idx_assignments_domain_name ON assignments(domain_name);
```

Luego:
1. Revertir los cambios en `schema.prisma`
2. Revertir los cambios en `assignmentsHandler.ts`
3. Regenerar Prisma: `npx prisma generate`
4. Redesplegar Lambda

## Notas Importantes

### Campos Temporales (month, year, createdAt, updatedAt)

- **`month` y `year`**: Se deben proporcionar manualmente al crear una asignación. No tienen valores por defecto automáticos.
- **`createdAt`**: Se establece automáticamente con `@default(now())` al crear un registro
- **`updatedAt`**: Se actualiza automáticamente con `@updatedAt` cada vez que se modifica el registro

### Ejemplo de Creación de Assignment

```javascript
// Frontend - assignmentView.js
const newAssignment = {
  projectId: "uuid-del-proyecto",
  title: "Nueva tarea",
  description: "Descripción de la tarea",
  month: 12,  // Mes actual (debe proporcionarse)
  year: 2025, // Año actual (debe proporcionarse)
  hours: 40,
  skillName: "JavaScript",
  resourceId: "uuid-del-recurso" // Opcional
  // NO incluir domainName
  // createdAt y updatedAt se manejan automáticamente
};
```

## Archivos Modificados

```
backend/
├── prisma/
│   ├── schema.prisma                              [MODIFICADO]
│   ├── migrations/
│   │   └── remove_domain_from_assignments.sql     [NUEVO]
│   └── apply-remove-domain-migration.js           [NUEVO]
├── src/
│   └── functions/
│       └── assignmentsHandler.ts                  [MODIFICADO]
└── INSTRUCCIONES_MIGRACION_REMOVE_DOMAIN.md       [NUEVO]

gestion-demanda/
└── assets/
    └── js/
        └── components/
            └── assignmentView.js                  [YA ACTUALIZADO]
```

## Soporte

Si encuentras problemas durante la migración:

1. Verifica los logs del script de migración
2. Revisa los logs de CloudWatch de la función Lambda
3. Verifica la consola del navegador para errores de frontend
4. Asegúrate de que el cliente Prisma se regeneró correctamente

## Checklist de Despliegue

- [ ] Backup de la base de datos realizado
- [ ] Script de migración ejecutado exitosamente
- [ ] Columna `domain_name` eliminada de la tabla `assignments`
- [ ] Cliente Prisma regenerado
- [ ] Lambda de assignments redesplegada
- [ ] Pruebas de la función Lambda exitosas
- [ ] Interfaz de asignación de recursos funciona correctamente
- [ ] No hay errores en la consola del navegador
- [ ] Documentación actualizada
