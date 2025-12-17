# Definiciones del Sistema de Gestión de Demanda

## Entidades Principales

### 1. Proyectos (Projects)
Representa las iniciativas o trabajos que se gestionan en el sistema.

**Campos:**
- `id`: Identificador único (INTEGER, autoincremental)
- `code`: Código único del proyecto (STRING, único, requerido)
- `type`: Tipo de proyecto (STRING, opcional) - Valores: "Proyecto", "Evolutivo"
- `title`: Título del proyecto (STRING, requerido)
- `description`: Descripción detallada (TEXT, opcional)
- `domain`: Dominio o área (STRING/INTEGER, referencia a Domains)
- `priority`: Prioridad (INTEGER, 1-5)
- `startDate`: Fecha de inicio (DATETIME, opcional)
- `endDate`: Fecha de fin (DATETIME, opcional)
- `status`: Estado del proyecto (STRING/INTEGER, referencia a Statuses)
- `team`: Equipo responsable (STRING, requerido)
- `createdAt`: Fecha de creación (DATETIME, automático)
- `updatedAt`: Fecha de actualización (DATETIME, automático)

**Relaciones:**
- Tiene muchas asignaciones (Assignments)
- Pertenece a un dominio (Domain)
- Tiene un estado (Status)

### 2. Recursos (Resources)
Representa a las personas o equipos que trabajan en los proyectos.

**Campos:**
- `id`: Identificador único (INTEGER, autoincremental)
- `name`: Nombre del recurso (STRING, requerido)
- `role`: Rol o posición (STRING, opcional)
- `team`: Equipo al que pertenece (STRING, requerido)
- `availability`: Disponibilidad (DECIMAL, 0-100%)
- `createdAt`: Fecha de creación (DATETIME, automático)
- `updatedAt`: Fecha de actualización (DATETIME, automático)

**Relaciones:**
- Tiene muchas asignaciones (Assignments)

### 3. Asignaciones (Assignments)
Representa la asignación de recursos a proyectos con su capacidad.

**Campos:**
- `id`: Identificador único (INTEGER, autoincremental)
- `projectId`: ID del proyecto (INTEGER, requerido, FK)
- `resourceId`: ID del recurso (INTEGER, requerido, FK)
- `hours`: Horas asignadas (DECIMAL, requerido)
- `startDate`: Fecha de inicio de la asignación (DATETIME, opcional)
- `endDate`: Fecha de fin de la asignación (DATETIME, opcional)
- `createdAt`: Fecha de creación (DATETIME, automático)
- `updatedAt`: Fecha de actualización (DATETIME, automático)

**Relaciones:**
- Pertenece a un proyecto (Project)
- Pertenece a un recurso (Resource)

### 4. Dominios (Domains)
Representa las áreas o dominios de negocio.

**Campos:**
- `id`: Identificador único (INTEGER, autoincremental)
- `name`: Nombre del dominio (STRING, único, requerido)
- `description`: Descripción (TEXT, opcional)
- `createdAt`: Fecha de creación (DATETIME, automático)
- `updatedAt`: Fecha de actualización (DATETIME, automático)

**Relaciones:**
- Tiene muchos proyectos (Projects)

### 5. Estados (Statuses)
Representa los posibles estados de un proyecto.

**Campos:**
- `id`: Identificador único (INTEGER, autoincremental)
- `name`: Nombre del estado (STRING, único, requerido)
- `description`: Descripción (TEXT, opcional)
- `createdAt`: Fecha de creación (DATETIME, automático)
- `updatedAt`: Fecha de actualización (DATETIME, automático)

**Relaciones:**
- Tiene muchos proyectos (Projects)

## Valores de Referencia

### Prioridades
1. **Muy Baja** (1)
2. **Baja** (2)
3. **Media** (3)
4. **Alta** (4)
5. **Muy Alta** (5)

### Tipos de Proyecto
- **Proyecto**: Iniciativa con inicio y fin definidos
- **Evolutivo**: Mejora continua o mantenimiento

### Estados Predefinidos
1. **Planificado**: Proyecto en fase de planificación
2. **En Progreso**: Proyecto activo en desarrollo
3. **En Pausa**: Proyecto temporalmente detenido
4. **Completado**: Proyecto finalizado exitosamente
5. **Cancelado**: Proyecto cancelado

### Dominios Predefinidos
1. **Tecnología**: Proyectos de infraestructura y tecnología
2. **Negocio**: Proyectos de procesos de negocio
3. **Datos**: Proyectos relacionados con datos y analytics
4. **Seguridad**: Proyectos de seguridad y compliance
5. **Innovación**: Proyectos de I+D e innovación

## Reglas de Negocio

### Proyectos
1. El código del proyecto debe ser único en el sistema
2. El campo `team` es obligatorio para control de acceso
3. La prioridad debe estar entre 1 y 5
4. Si se especifica `endDate`, debe ser posterior a `startDate`
5. Los usuarios solo pueden ver proyectos de su equipo

### Recursos
1. El nombre del recurso debe ser único
2. La disponibilidad debe estar entre 0 y 100
3. El campo `team` es obligatorio
4. Los usuarios solo pueden ver recursos de su equipo

### Asignaciones
1. No puede haber asignaciones duplicadas (mismo proyecto + recurso)
2. Las horas asignadas deben ser positivas
3. Si se especifica `endDate`, debe ser posterior a `startDate`
4. Las asignaciones solo son visibles para el equipo del proyecto

### Control de Acceso
1. Todos los endpoints requieren autenticación (header `Authorization`)
2. Todos los endpoints requieren el header `x-user-team`
3. Los usuarios solo pueden acceder a datos de su equipo
4. Las operaciones CRUD están restringidas por equipo

## API Endpoints

### Proyectos
- `GET /projects` - Listar proyectos del equipo
- `GET /projects/:id` - Obtener proyecto específico
- `POST /projects` - Crear nuevo proyecto
- `PUT /projects/:id` - Actualizar proyecto
- `DELETE /projects/:id` - Eliminar proyecto

### Recursos
- `GET /resources` - Listar recursos del equipo
- `GET /resources/:id` - Obtener recurso específico
- `POST /resources` - Crear nuevo recurso
- `PUT /resources/:id` - Actualizar recurso
- `DELETE /resources/:id` - Eliminar recurso

### Asignaciones
- `GET /assignments` - Listar asignaciones del equipo
- `GET /assignments/:id` - Obtener asignación específica
- `POST /assignments` - Crear nueva asignación
- `PUT /assignments/:id` - Actualizar asignación
- `DELETE /assignments/:id` - Eliminar asignación

### Dominios
- `GET /domains` - Listar todos los dominios
- `GET /domains/:id` - Obtener dominio específico
- `POST /domains` - Crear nuevo dominio
- `PUT /domains/:id` - Actualizar dominio
- `DELETE /domains/:id` - Eliminar dominio

### Estados
- `GET /statuses` - Listar todos los estados
- `GET /statuses/:id` - Obtener estado específico
- `POST /statuses` - Crear nuevo estado
- `PUT /statuses/:id` - Actualizar estado
- `DELETE /statuses/:id` - Eliminar estado

## Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {
    // Datos solicitados
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje descriptivo del error"
  }
}
```

## Códigos de Error Comunes

- `UNAUTHORIZED`: Falta autenticación o token inválido
- `FORBIDDEN`: Usuario no tiene permisos para la operación
- `NOT_FOUND`: Recurso no encontrado
- `VALIDATION_ERROR`: Datos de entrada inválidos
- `DUPLICATE_ENTRY`: Intento de crear registro duplicado
- `DATABASE_ERROR`: Error en la base de datos
- `INTERNAL_ERROR`: Error interno del servidor
