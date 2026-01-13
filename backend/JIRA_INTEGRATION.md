# Integración con Jira - Guía Completa

## Resumen

Esta integración permite importar proyectos y tareas desde Jira de Naturgy directamente a la aplicación de Gestión de Demanda.

## Configuración

### Credenciales de Jira

- **URL de Jira**: https://naturgy-adn.atlassian.net
- **API Token**: Preconfigurado en la aplicación
- **Email**: El usuario debe proporcionar su email corporativo de Naturgy

### Base de Datos

Los siguientes campos han sido agregados a las tablas:

#### Tabla `projects`:
- `jira_project_key` (TEXT): Clave del proyecto en Jira (ej: NC)
- `jira_url` (TEXT): URL base de la instancia de Jira

#### Tabla `assignments`:
- `jira_issue_key` (TEXT, UNIQUE): Clave del issue en Jira (ej: NC-123)
- `jira_issue_id` (TEXT): ID numérico del issue en Jira

## Endpoints API

### 1. Listar Proyectos de Jira

```
GET /jira/projects?jiraUrl={url}&apiToken={token}&email={email}
```

**Parámetros Query**:
- `jiraUrl`: URL de la instancia de Jira
- `apiToken`: Token de API de Jira
- `email`: Email del usuario en Jira

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "10000",
        "key": "NC",
        "name": "Nombre del Proyecto",
        "projectTypeKey": "software",
        "style": "classic"
      }
    ]
  }
}
```

### 2. Importar Proyectos desde Jira

```
POST /jira/import
```

**Body**:
```json
{
  "jiraUrl": "https://naturgy-adn.atlassian.net",
  "apiToken": "tu_token_api",
  "email": "tu.email@naturgy.com",
  "team": "EQUIPO",
  "projectKeys": ["NC", "PROJ"],  // Opcional
  "jqlQuery": "project = 'NC' AND status != 'Closed'"  // Opcional
}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "message": "Importados 5 proyectos con éxito",
    "imported": [
      {
        "code": "NC",
        "title": "NC",
        "assignmentsCount": 45
      }
    ],
    "totalIssues": 150
  }
}
```

### 3. Sincronizar Proyecto con Jira

```
POST /jira/sync/{projectId}
```

**Parámetros Path**:
- `projectId`: ID del proyecto en la base de datos

**Body**:
```json
{
  "jiraUrl": "https://naturgy-adn.atlassian.net",
  "apiToken": "tu_token_api",
  "email": "tu.email@naturgy.com"
}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "message": "Proyecto sincronizado con éxito",
    "projectCode": "NC",
    "updated": 10,
    "created": 5,
    "total": 15
  }
}
```

## Mapeo de Datos

### Tipos de Issue → Tipos de Proyecto

- Epic / Project → "Proyecto"
- Story / Task / Bug → "Evolutivo"

### Prioridades de Jira → Prioridades Locales

| Jira | Local |
|------|-------|
| Highest / Critical | Crítica |
| High | Alta |
| Medium | Normal |
| Low | Baja |
| Lowest | Muy Baja |

### Estados de Jira → Estados Locales

| Jira | Local (Proyecto) | Local (Assignment) |
|------|------------------|-------------------|
| To Do / Open | 0 (Planificado) | Pendiente |
| In Progress / Development | 1 (En progreso) | En Progreso |
| Blocked | 1 (En progreso) | Bloqueada |
| In Review | 0 (Planificado) | En Revisión |
| Done / Closed / Resolved | 3 (Completado) | Completada |

### Story Points → Horas Estimadas

- Story points se multiplican por 8 para obtener horas estimadas
- Si no hay story points, se asignan 8 horas por defecto

## Uso en la Aplicación

### Frontend

1. El usuario hace clic en "Importar desde Jira"
2. Se abre un modal con:
   - URL de Jira (preconfigurada)
   - Campo para email
   - Campo opcional para consulta JQL
3. El usuario ingresa su email y opcionalmente una consulta JQL
4. Al hacer clic en "Importar":
   - Se realiza la petición POST a `/jira/import`
   - Se muestra un spinner de carga
   - Al completar, se muestran los resultados
   - Se recarga la lista de proyectos

### Componentes Creados

- **`assets/js/components/jiraModal.js`**: Modal de importación
- **`backend/src/functions/jiraHandler.ts`**: Handler Lambda para endpoints de Jira

## Consideraciones de Seguridad

1. El API Token está preconfigurado en el modal pero no se guarda en ningún lugar
2. Las credenciales solo se usan durante la sesión de importación
3. Se usa autenticación básica con Jira (email + API token)
4. Los datos se transmiten a través de HTTPS

## Limitaciones Actuales

1. La importación crea nuevos proyectos, no actualiza existentes
2. Los proyectos duplicados (mismo código y team) se omiten
3. Solo se importan los campos principales de los issues
4. La paginación de Jira está limitada a 100 issues por petición

## Despliegue

### Migración de Base de Datos

```bash
cd backend
node apply-jira-migration.js
npx prisma generate
```

### Lambda Function

El handler de Jira debe ser desplegado y configurado en API Gateway:

```bash
# Compilar TypeScript
npm run build

# Desplegar Lambda
# (incluir jiraHandler en el paquete de despliegue)
```

### Rutas API Gateway

Configurar las siguientes rutas:

- `GET /jira/projects` → `jiraHandler`
- `POST /jira/import` → `jiraHandler`
- `POST /jira/sync/{projectId}` → `jiraHandler`

## Testing

### Prueba Manual

1. Abrir la aplicación
2. Ir a la pestaña "Proyectos"
3. Hacer clic en "Importar desde Jira"
4. Ingresar email de Naturgy
5. Opcionalmente agregar JQL: `project = 'NC' AND created >= -30d`
6. Hacer clic en "Importar"
7. Verificar que los proyectos se crean correctamente

### Ejemplo de JQL

```jql
project = 'NC' AND status != 'Closed' AND created >= -60d
```

## Troubleshooting

### Error: "no pg_hba.conf entry"
- Asegurarse de que el script de migración usa SSL
- Verificar DATABASE_URL en .env

### Error: "Error de Jira: 401"
- Verificar que el email sea correcto
- Verificar que el API token sea válido
- Verificar permisos de acceso en Jira

### Error: "Project already exists"
- El proyecto con ese código ya existe para el equipo
- Esto es esperado y se omite automáticamente

### No se importan issues
- Verificar la consulta JQL
- Verificar permisos del usuario en Jira
- Revisar logs del Lambda

## Futuras Mejoras

1. Sincronización bidireccional (actualizar Jira desde la app)
2. Sincronización automática periódica
3. Mapeo de campos personalizados de Jira
4. Importación de comentarios y attachments
5. Historial de sincronizaciones
6. Configuración de mapeos personalizados

## Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.
