# Mapa de Conexiones del Sistema de Gestión de Demanda

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Conexiones Frontend-Backend](#conexiones-frontend-backend)
3. [Conexiones de Base de Datos](#conexiones-de-base-de-datos)
4. [Flujos de Datos](#flujos-de-datos)
5. [Integraciones Externas](#integraciones-externas)
6. [Dependencias entre Módulos](#dependencias-entre-módulos)

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ index-modular│  │  login.html  │  │  assets/     │      │
│  │    .html     │  │              │  │  (css/js)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTPS
                             │ Headers: Authorization, x-user-team
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS API GATEWAY                           │
│              (API REST - CORS Enabled)                       │
│  https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod│
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     AWS LAMBDA                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  projects    │  │  resources   │  │ assignments  │      │
│  │  Handler     │  │  Handler     │  │  Handler     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│  ┌──────┴──────────────────┴──────────────────┴───────┐     │
│  │              Prisma ORM Client                      │     │
│  └──────────────────────────┬──────────────────────────┘     │
└─────────────────────────────┼─────────────────────────────────┘
                             │ PostgreSQL Protocol
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL DATABASE                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Projects │  │Resources │  │Assignments│ │ Domains  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │               │             │          │
│       └─────────────┴───────────────┴─────────────┘          │
│                    Relaciones FK                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Conexiones Frontend-Backend

### 1. Configuración de Conexión

**Archivo**: `gestion-demanda/assets/js/config/data.js`

```javascript
API_CONFIG = {
    BASE_URL: 'https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod',
    ENDPOINTS: {
        PROJECTS: '/projects',
        RESOURCES: '/resources',
        ASSIGNMENTS: '/assignments',
        CAPACITY: '/capacity'
    }
}
```

### 2. Headers de Autenticación

**Todos los requests incluyen:**
- `Authorization`: Token de acceso AWS (almacenado en sessionStorage)
- `x-user-team`: Identificador del equipo del usuario (almacenado en sessionStorage)

**Origen**: `login.html` → Almacena en sessionStorage tras login exitoso

### 3. Endpoints API y sus Conexiones

#### A. Proyectos (`/projects`)

**Frontend → Backend**

| Operación | Método | Endpoint | Archivo Frontend | Handler Backend |
|-----------|--------|----------|------------------|-----------------|
| Listar proyectos | GET | `/projects` | `main.js::loadProjectsFromAPI()` | `projectsHandler.ts::GET` |
| Obtener proyecto | GET | `/projects/:id` | `projectModal.js` | `projectsHandler.ts::GET` |
| Crear proyecto | POST | `/projects` | `projectModal.js::saveProject()` | `projectsHandler.ts::POST` |
| Actualizar proyecto | PUT | `/projects/:id` | `projectModal.js::saveProject()` | `projectsHandler.ts::PUT` |
| Eliminar proyecto | DELETE | `/projects/:id` | `projectModal.js::confirmDelete()` | `projectsHandler.ts::DELETE` |

**Flujo de datos:**
```
Frontend (main.js)
    ↓ fetch(API_CONFIG.BASE_URL + '/projects')
API Gateway
    ↓ invoke Lambda
projectsHandler.ts
    ↓ prisma.project.findMany({ where: { team: userTeam } })
PostgreSQL Database
    ↓ return filtered projects
projectsHandler.ts
    ↓ return { success: true, data: { projects, count } }
Frontend (main.js)
    ↓ updateProjectsTable(projects)
DOM Update
```

#### B. Recursos (`/resources`)

**Frontend → Backend**

| Operación | Método | Endpoint | Archivo Frontend | Handler Backend |
|-----------|--------|----------|------------------|-----------------|
| Listar recursos | GET | `/resources` | (Pendiente) | `resourcesHandler.ts::GET` |
| Crear recurso | POST | `/resources` | (Pendiente) | `resourcesHandler.ts::POST` |
| Actualizar recurso | PUT | `/resources/:id` | (Pendiente) | `resourcesHandler.ts::PUT` |
| Eliminar recurso | DELETE | `/resources/:id` | (Pendiente) | `resourcesHandler.ts::DELETE` |

#### C. Asignaciones (`/assignments`)

**Frontend → Backend**

| Operación | Método | Endpoint | Archivo Frontend | Handler Backend |
|-----------|--------|----------|------------------|-----------------|
| Listar asignaciones | GET | `/assignments` | (Pendiente) | `assignmentsHandler.ts::GET` |
| Crear asignación | POST | `/assignments` | (Pendiente) | `assignmentsHandler.ts::POST` |
| Actualizar asignación | PUT | `/assignments/:id` | (Pendiente) | `assignmentsHandler.ts::PUT` |
| Eliminar asignación | DELETE | `/assignments/:id` | (Pendiente) | `assignmentsHandler.ts::DELETE` |

#### D. Dominios (`/domains`)

**Frontend → Backend**

| Operación | Método | Endpoint | Archivo Frontend | Handler Backend |
|-----------|--------|----------|------------------|-----------------|
| Listar dominios | GET | `/domains` | `dropdownLoader.js::loadDomains()` | `domainsHandler.ts::GET` |
| Crear dominio | POST | `/domains` | (Admin) | `domainsHandler.ts::POST` |

#### E. Estados (`/statuses`)

**Frontend → Backend**

| Operación | Método | Endpoint | Archivo Frontend | Handler Backend |
|-----------|--------|----------|------------------|-----------------|
| Listar estados | GET | `/statuses` | `dropdownLoader.js::loadStatuses()` | `statusesHandler.ts::GET` |
| Crear estado | POST | `/statuses` | (Admin) | `statusesHandler.ts::POST` |

---

## Conexiones de Base de Datos

### 1. Esquema de Conexión Prisma

**Archivo**: `backend/src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})
```

**Variable de entorno**: `DATABASE_URL=postgresql://user:password@host:5432/database`

### 2. Relaciones entre Tablas

```
Projects (1) ←──────→ (N) Assignments
    │                        │
    │                        │
    ↓                        ↓
Domains (1)            Resources (1)
    │                        │
    ↓                        ↓
Statuses (1)           (N) Assignments
```

#### Relaciones Detalladas:

**Projects → Domains**
- Tipo: Many-to-One
- Campo: `domainId` (INTEGER, FK)
- Referencia: `domains.id`

**Projects → Statuses**
- Tipo: Many-to-One
- Campo: `statusId` (INTEGER, FK)
- Referencia: `statuses.id`

**Projects → Assignments**
- Tipo: One-to-Many
- Campo: `assignments.projectId` (FK)
- Referencia: `projects.id`

**Resources → Assignments**
- Tipo: One-to-Many
- Campo: `assignments.resourceId` (FK)
- Referencia: `resources.id`

### 3. Queries Prisma Comunes

**Listar proyectos con filtro por equipo:**
```typescript
await prisma.project.findMany({
  where: { team: userTeam },
  include: {
    domain: true,
    status: true
  }
})
```

**Crear proyecto:**
```typescript
await prisma.project.create({
  data: {
    code, title, description, type,
    domainId, priority, startDate, endDate,
    statusId, team
  }
})
```

**Actualizar proyecto:**
```typescript
await prisma.project.update({
  where: { id: projectId },
  data: { ...updateData }
})
```

**Eliminar proyecto:**
```typescript
await prisma.project.delete({
  where: { id: projectId }
})
```

---

## Flujos de Datos

### 1. Flujo de Autenticación

```
Usuario ingresa credenciales
    ↓
login.html::handleLogin()
    ↓
Validación local
    ↓
sessionStorage.setItem('aws_access_key', token)
sessionStorage.setItem('user_team', team)
    ↓
Redirección a index-modular.html
    ↓
main.js::initializeApp()
    ↓
Verifica tokens en sessionStorage
    ↓
loadProjectsFromAPI() con headers
```

### 2. Flujo de Carga de Proyectos

```
index-modular.html carga
    ↓
main.js::initializeApp()
    ↓
main.js::loadProjectsFromAPI()
    ↓
fetch(API_URL/projects, { headers })
    ↓
API Gateway → Lambda projectsHandler
    ↓
prisma.project.findMany({ where: { team } })
    ↓
PostgreSQL query
    ↓
Retorna proyectos filtrados
    ↓
main.js::updateProjectsTable(projects)
    ↓
Renderiza tabla HTML
    ↓
Actualiza KPIs y gráficos
```

### 3. Flujo de Creación de Proyecto

```
Usuario click "Añadir Proyecto"
    ↓
main.js::addProjectBtn.click
    ↓
projectModal.js::openCreateProjectModal()
    ↓
dropdownLoader.js::loadDomains()
    ↓ fetch(API_URL/domains)
API Gateway → domainsHandler
    ↓
Retorna lista de dominios
    ↓
dropdownLoader.js::loadStatuses()
    ↓ fetch(API_URL/statuses)
API Gateway → statusesHandler
    ↓
Retorna lista de estados
    ↓
Modal se muestra con dropdowns poblados
    ↓
Usuario completa formulario
    ↓
projectModal.js::saveProject()
    ↓
Validación de campos
    ↓
fetch(API_URL/projects, { method: 'POST', body })
    ↓
API Gateway → projectsHandler::POST
    ↓
Validación en backend
    ↓
prisma.project.create({ data })
    ↓
PostgreSQL INSERT
    ↓
Retorna proyecto creado
    ↓
projectModal.js cierra modal
    ↓
main.js::loadProjectsFromAPI()
    ↓
Actualiza tabla y dashboard
```

### 4. Flujo de Edición de Proyecto

```
Usuario click icono editar (✏️)
    ↓
main.js::editProject(projectCode)
    ↓
Busca proyecto en window.allProjects
    ↓
projectModal.js::openEditProjectModal(project)
    ↓
dropdownLoader.js carga dominios y estados
    ↓
Modal se muestra con datos pre-poblados
    ↓
Usuario modifica campos
    ↓
projectModal.js::saveProject()
    ↓
fetch(API_URL/projects/:id, { method: 'PUT', body })
    ↓
API Gateway → projectsHandler::PUT
    ↓
Validación en backend
    ↓
prisma.project.update({ where: { id }, data })
    ↓
PostgreSQL UPDATE
    ↓
Retorna proyecto actualizado
    ↓
projectModal.js cierra modal
    ↓
main.js::loadProjectsFromAPI()
    ↓
Actualiza tabla y dashboard
```

### 5. Flujo de Eliminación de Proyecto

```
Usuario click icono eliminar (🗑️)
    ↓
main.js::deleteProject(projectCode)
    ↓
Busca proyecto en window.allProjects
    ↓
projectModal.js::openDeleteModal(project)
    ↓
Modal de confirmación se muestra
    ↓
Usuario confirma eliminación
    ↓
projectModal.js::confirmDelete()
    ↓
fetch(API_URL/projects/:id, { method: 'DELETE' })
    ↓
API Gateway → projectsHandler::DELETE
    ↓
Validación de permisos (team match)
    ↓
prisma.project.delete({ where: { id } })
    ↓
PostgreSQL DELETE
    ↓
Retorna confirmación
    ↓
projectModal.js cierra modal
    ↓
main.js::loadProjectsFromAPI()
    ↓
Actualiza tabla y dashboard
```

### 6. Flujo de Actualización de Gráficos

```
main.js::loadProjectsFromAPI() completa
    ↓
window.allProjects actualizado
    ↓
main.js::updateMatrixKPIs()
    ↓
Cuenta proyectos por tipo
    ↓
Actualiza elementos DOM de KPIs
    ↓
main.js::initializeAllCharts()
    ↓
charts.js::initializeAllCharts()
    ↓
Procesa window.allProjects
    ↓
Agrupa por estado, prioridad, dominio
    ↓
Chart.js renderiza gráficos
    ↓
DOM actualizado con visualizaciones
```

---

## Integraciones Externas

### 1. AWS Services

**API Gateway**
- URL: `https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod`
- Región: `eu-west-1`
- CORS: Habilitado
- Autenticación: Headers personalizados

**Lambda Functions**
- Runtime: Node.js
- Handlers: TypeScript compilado
- Timeout: Configurado según necesidad
- Memory: Configurado según carga

**RDS PostgreSQL**
- Conexión: Via Prisma ORM
- Pool de conexiones: Gestionado por Prisma
- SSL: Habilitado

### 2. Librerías Frontend

**Chart.js**
- Versión: 3.x
- Uso: Gráficos de dona (doughnut)
- Conexión: `charts.js` importa desde CDN
- Datos: Procesados desde `window.allProjects`

**Módulos ES6**
- Sistema de importación/exportación
- Conexiones entre archivos JS

### 3. Dependencias Backend

**Prisma**
- ORM para PostgreSQL
- Cliente generado: `@prisma/client`
- Migraciones: `prisma migrate`

**TypeScript**
- Compilación a JavaScript
- Tipos para validación

---

## Dependencias entre Módulos

### Frontend

```
index-modular.html
    ├── main.js (entry point)
    │   ├── tabs.js
    │   ├── charts.js
    │   ├── kpi.js
    │   ├── projectModal.js
    │   │   ├── dropdownLoader.js
    │   │   └── helpers.js
    │   ├── data.js (API_CONFIG)
    │   └── helpers.js
    │
    ├── base.css
    ├── components.css
    ├── layout.css
    ├── tables.css
    ├── tabs.css
    └── responsive.css

login.html
    └── (inline JavaScript)
        └── sessionStorage
```

### Backend

```
Lambda Handler
    ├── projectsHandler.ts
    │   ├── prisma.ts
    │   ├── validators.ts
    │   ├── response.ts
    │   └── errors.ts
    │
    ├── resourcesHandler.ts
    │   ├── prisma.ts
    │   ├── validators.ts
    │   ├── response.ts
    │   └── errors.ts
    │
    ├── assignmentsHandler.ts
    │   ├── prisma.ts
    │   ├── validators.ts
    │   ├── response.ts
    │   └── errors.ts
    │
    ├── domainsHandler.ts
    │   ├── prisma.ts
    │   └── response.ts
    │
    └── statusesHandler.ts
        ├── prisma.ts
        └── response.ts

prisma.ts
    └── @prisma/client
        └── PostgreSQL Database
```

### Dependencias de Datos

```
sessionStorage (Browser)
    ├── aws_access_key → Todos los API calls
    └── user_team → Filtrado de datos

window.allProjects (Global)
    ├── updateProjectsTable()
    ├── editProject()
    ├── deleteProject()
    ├── updateMatrixKPIs()
    └── initializeAllCharts()

API_CONFIG (data.js)
    ├── loadProjectsFromAPI()
    ├── saveProject()
    ├── confirmDelete()
    ├── loadDomains()
    └── loadStatuses()
```

---

## Conexiones de Seguridad

### 1. Autenticación

```
Login
    ↓
Genera token
    ↓
sessionStorage.setItem('aws_access_key')
    ↓
Incluido en header 'Authorization'
    ↓
Validado en cada Lambda handler
```

### 2. Autorización por Equipo

```
Login
    ↓
Identifica equipo del usuario
    ↓
sessionStorage.setItem('user_team')
    ↓
Incluido en header 'x-user-team'
    ↓
Filtrado en queries Prisma
    ↓
WHERE team = userTeam
```

### 3. Validación en Capas

```
Frontend
    ↓ Validación de formulario
    ↓ Campos requeridos
    ↓
API Gateway
    ↓ Validación de headers
    ↓
Lambda Handler
    ↓ validators.ts
    ↓ Validación de datos
    ↓
Prisma
    ↓ Validación de schema
    ↓
PostgreSQL
    ↓ Constraints de BD
```

---

## Resumen de Conexiones Activas

### Conexiones Implementadas ✅

1. **Frontend → API Gateway**: HTTPS con headers de autenticación
2. **API Gateway → Lambda**: Invocación de funciones
3. **Lambda → PostgreSQL**: Via Prisma ORM
4. **Frontend → sessionStorage**: Almacenamiento de tokens
5. **Módulos JS**: Importación/exportación ES6
6. **Charts.js → DOM**: Renderizado de gráficos
7. **Prisma → Database**: Pool de conexiones PostgreSQL

### Endpoints Activos ✅

- `GET /projects` - Listar proyectos
- `POST /projects` - Crear proyecto
- `PUT /projects/:id` - Actualizar proyecto
- `DELETE /projects/:id` - Eliminar proyecto
- `GET /domains` - Listar dominios
- `GET /statuses` - Listar estados

### Conexiones Pendientes 🚧

- Frontend CRUD de recursos
- Frontend CRUD de asignaciones
- Gestión de capacidad
- Sincronización con Jira
- Webhooks de notificaciones

---

## Diagrama de Secuencia Completo

```
Usuario → Browser → Frontend → API Gateway → Lambda → Prisma → PostgreSQL
   │         │          │            │           │        │         │
   │         │          │            │           │        │         │
   ├─Login───┤          │            │           │        │         │
   │         ├─Store────┤            │           │        │         │
   │         │  Token   │            │           │        │         │
   │         │          │            │           │        │         │
   ├─Click───┤          │            │           │        │         │
   │  Button │          │            │           │        │         │
   │         ├─Fetch────┤            │           │        │         │
   │         │  +Headers│            │           │        │         │
   │         │          ├─Request────┤           │        │         │
   │         │          │  +CORS     │           │        │         │
   │         │          │            ├─Invoke────┤        │         │
   │         │          │            │           ├─Query──┤         │
   │         │          │            │           │        ├─Execute─┤
   │         │          │            │           │        │  WHERE  │
   │         │          │            │           │        │  team=X │
   │         │          │            │           │        ├─Return──┤
   │         │          │            │           ├─Format─┤         │
   │         │          │            │           │  JSON  │         │
   │         │          │            ├─Response──┤        │         │
   │         │          ├─JSON───────┤           │        │         │
   │         ├─Update───┤            │           │        │         │
   │         │   DOM    │            │           │        │         │
   ├─View────┤          │            │           │        │         │
   │ Result  │          │            │           │        │         │
```

---

## Conclusión

El sistema implementa una arquitectura de tres capas con conexiones bien definidas:

1. **Capa de Presentación**: Frontend HTML/CSS/JS con módulos ES6
2. **Capa de Aplicación**: AWS Lambda con TypeScript
3. **Capa de Datos**: PostgreSQL con Prisma ORM

Todas las conexiones están protegidas con autenticación y autorización basada en equipos, garantizando la seguridad y el aislamiento de datos entre diferentes equipos.
