# Backend - Sistema de Gestión de Demanda y Capacidad

Backend serverless para el sistema de gestión de demanda y capacidad de Naturgy LCS, implementado con AWS Lambda, API Gateway, PostgreSQL RDS y Prisma ORM.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Configuración del Entorno](#configuración-del-entorno)
- [Instalación](#instalación)
- [Desarrollo Local](#desarrollo-local)
- [Despliegue a AWS](#despliegue-a-aws)
- [API Endpoints](#api-endpoints)
- [Base de Datos](#base-de-datos)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🏗️ Arquitectura

```
Frontend (Vanilla JS)
        ↓
API Gateway (REST API)
        ↓
Lambda Functions (Node.js 18+)
        ↓
Prisma ORM
        ↓
PostgreSQL RDS (AWS)
```

### Componentes Principales

- **AWS Lambda**: Funciones serverless para lógica de negocio
- **API Gateway**: Punto de entrada REST API con CORS
- **PostgreSQL RDS**: Base de datos relacional en AWS
- **Prisma ORM**: ORM type-safe para TypeScript
- **AWS Secrets Manager**: Gestión segura de credenciales
- **RDS Proxy** (opcional): Connection pooling para Lambda

## 🛠️ Stack Tecnológico

### Runtime y Lenguajes
- **Node.js**: 18+ LTS
- **TypeScript**: 5.9.3
- **Prisma**: 5.22.0
- **PostgreSQL**: 15+

### AWS Services
- AWS Lambda
- API Gateway
- RDS PostgreSQL
- VPC & Security Groups
- Secrets Manager
- CloudWatch Logs
- RDS Proxy (opcional)

### Herramientas de Desarrollo
- AWS SAM CLI / Serverless Framework
- esbuild (bundling)
- ts-node (desarrollo)
- DBeaver (gestión de BD)

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma           # Esquema de base de datos
│   ├── migrations/             # Migraciones (si se usan)
│   └── seed.ts                 # Script de datos iniciales
│
├── src/
│   ├── functions/              # Lambda Functions
│   │   ├── projects/
│   │   │   ├── getProjects.ts
│   │   │   ├── getProject.ts
│   │   │   ├── createProject.ts
│   │   │   ├── updateProject.ts
│   │   │   └── deleteProject.ts
│   │   ├── resources/
│   │   │   ├── getResources.ts
│   │   │   ├── getResource.ts
│   │   │   ├── createResource.ts
│   │   │   └── updateResource.ts
│   │   ├── assignments/
│   │   │   ├── getAssignments.ts
│   │   │   ├── createAssignment.ts
│   │   │   └── deleteAssignment.ts
│   │   ├── capacity/
│   │   │   ├── getCapacity.ts
│   │   │   └── updateCapacity.ts
│   │   └── kpis/
│   │       ├── getDashboardKPIs.ts
│   │       └── getUtilizationKPIs.ts
│   │
│   ├── lib/                    # Código compartido
│   │   ├── prisma.ts           # Cliente Prisma singleton
│   │   ├── response.ts         # Helpers de respuesta HTTP
│   │   ├── errors.ts           # Manejo de errores
│   │   └── validators.ts       # Validaciones de negocio
│   │
│   └── types/                  # TypeScript types
│       ├── api.ts
│       └── database.ts
│
├── dist/                       # Código compilado (generado)
├── node_modules/               # Dependencias (generado)
│
├── template.yaml               # AWS SAM template
├── serverless.yml              # Serverless Framework config (alternativa)
├── package.json
├── tsconfig.json
├── .env                        # Variables de entorno (NO commitear)
├── .env.example                # Template de variables
└── README.md                   # Este archivo
```

## 📦 Requisitos Previos

### Software Necesario

1. **Node.js 18+ LTS**
   ```bash
   node --version  # debe ser v18.x.x o superior
   ```

2. **AWS CLI v2**
   ```bash
   aws --version  # debe ser aws-cli/2.x.x
   aws configure  # configurar credenciales
   ```

3. **AWS SAM CLI** (recomendado)
   ```bash
   sam --version  # debe ser SAM CLI, version 1.x.x
   ```

4. **PostgreSQL Client** (para gestión local)
   ```bash
   psql --version
   ```

5. **DBeaver** (opcional, para visualización)
   - Descargar desde: https://dbeaver.io/

### Permisos AWS Necesarios

Tu usuario/rol de AWS debe tener permisos para:
- Lambda (crear, actualizar, eliminar funciones)
- API Gateway (crear, configurar APIs)
- RDS (crear, gestionar instancias)
- VPC (crear, configurar redes)
- IAM (crear roles para Lambda)
- CloudFormation (desplegar stacks)
- Secrets Manager (leer/escribir secrets)
- CloudWatch Logs (ver logs)

## ⚙️ Configuración del Entorno

### 1. Clonar el Repositorio

```bash
cd gestion-demanda/backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copiar el archivo de ejemplo y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/gestion_demanda

# AWS
AWS_REGION=eu-west-1
AWS_ACCOUNT_ID=123456789012

# Secrets Manager
DB_SECRET_ARN=arn:aws:secretsmanager:eu-west-1:123456789012:secret:gestion-demanda/rds/credentials

# RDS Proxy (opcional)
USE_RDS_PROXY=false
RDS_PROXY_ENDPOINT=
```

### 4. Generar Prisma Client

```bash
npx prisma generate
```

## 🚀 Instalación

### Instalación Completa (Primera Vez)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Generar Prisma Client
npx prisma generate

# 4. (Opcional) Sincronizar esquema con BD
npx prisma db push

# 5. (Opcional) Poblar base de datos con datos iniciales
npx ts-node prisma/seed.ts
```

## 💻 Desarrollo Local

### Iniciar API Gateway Local

```bash
# Compilar TypeScript
npm run build

# Iniciar API local con SAM
sam local start-api --port 3001
```

La API estará disponible en: `http://localhost:3001`

### Probar Endpoints Localmente

```bash
# Obtener todos los proyectos
curl http://localhost:3001/projects

# Obtener KPIs del dashboard
curl "http://localhost:3001/kpis/dashboard?month=6&year=2025"

# Obtener recursos
curl http://localhost:3001/resources
```

### Desarrollo con Hot Reload

Para desarrollo activo, puedes usar `ts-node` directamente:

```bash
# Ejecutar una función específica
npx ts-node src/functions/projects/getProjects.ts
```

### Gestión de Base de Datos

```bash
# Ver estado del esquema
npx prisma db pull

# Sincronizar esquema con BD
npx prisma db push

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio (GUI para BD)
npx prisma studio
```

## 🚢 Despliegue a AWS

### Primera Vez (Configuración Guiada)

```bash
# 1. Compilar código
npm run build

# 2. Desplegar con SAM (configuración guiada)
sam deploy --guided
```

Responder a las preguntas:
- **Stack Name**: `gestion-demanda-api`
- **AWS Region**: `eu-west-1` (o tu región)
- **Parameter VpcId**: [tu VPC ID]
- **Parameter LambdaSubnet1**: [tu Subnet ID 1]
- **Parameter LambdaSubnet2**: [tu Subnet ID 2]
- **Parameter LambdaSecurityGroup**: [tu Security Group ID]
- **Parameter DBSecretArn**: [tu Secret ARN]
- **Confirm changes before deploy**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Save arguments to configuration file**: Y

### Deploys Posteriores

```bash
# Compilar y desplegar
npm run build
sam deploy
```

### Verificar Despliegue

```bash
# Obtener URL de la API
aws cloudformation describe-stacks \
  --stack-name gestion-demanda-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

### Ver Logs en CloudWatch

```bash
# Ver logs de una función específica
aws logs tail /aws/lambda/gestion-demanda-api-GetProjectsFunction --follow

# Ver logs de todas las funciones
sam logs --stack-name gestion-demanda-api --tail
```

## 📡 API Endpoints

### Proyectos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/projects` | Listar todos los proyectos |
| GET | `/projects/{id}` | Obtener proyecto por ID |
| POST | `/projects` | Crear nuevo proyecto |
| PUT | `/projects/{id}` | Actualizar proyecto |
| DELETE | `/projects/{id}` | Eliminar proyecto |

### Recursos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/resources` | Listar todos los recursos |
| GET | `/resources/{id}` | Obtener recurso por ID |
| POST | `/resources` | Crear nuevo recurso |
| PUT | `/resources/{id}` | Actualizar recurso |

### Asignaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/assignments` | Listar asignaciones |
| POST | `/assignments` | Crear asignación |
| DELETE | `/assignments/{id}` | Eliminar asignación |

### Capacidad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/capacity` | Obtener capacidad |
| PUT | `/capacity/{resourceId}/{year}/{month}` | Actualizar capacidad |

### KPIs

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/kpis/dashboard?month=X&year=Y` | KPIs del dashboard |
| GET | `/kpis/utilization?month=X&year=Y` | KPIs de utilización |

### Formato de Respuesta

Todas las respuestas siguen este formato:

**Éxito:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "details": { ... }  // Solo en desarrollo
  }
}
```

## 🗄️ Base de Datos

### Esquema

El esquema incluye 9 tablas principales:

1. **domains** - Dominios funcionales
2. **statuses** - Estados de proyectos
3. **skills** - Habilidades/perfiles
4. **projects** - Proyectos y evolutivos
5. **resources** - Recursos humanos
6. **resource_skills** - Relación recursos-skills
7. **project_skill_breakdown** - Desglose de horas por skill
8. **capacity** - Capacidad mensual de recursos
9. **assignments** - Asignaciones de recursos a proyectos

### Vistas Materializadas (KPIs)

1. **mv_monthly_capacity_summary** - Resumen mensual de capacidad
2. **mv_project_utilization** - Utilización por proyecto
3. **mv_resource_allocation** - Asignación por recurso
4. **mv_skill_capacity** - Capacidad por skill

### Conectar con DBeaver

1. Abrir DBeaver
2. Nueva conexión → PostgreSQL
3. Configurar:
   - **Host**: [RDS Endpoint]
   - **Port**: 5432
   - **Database**: gestion_demanda
   - **Username**: postgres
   - **Password**: [tu password]
   - **SSL**: require
4. Test Connection → Finish

### Refrescar Vistas Materializadas

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_capacity_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_utilization;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_resource_allocation;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skill_capacity;
```

## 🧪 Testing

### Testing Local

```bash
# Iniciar API local
sam local start-api --port 3001

# En otra terminal, ejecutar tests
curl http://localhost:3001/projects
curl "http://localhost:3001/kpis/dashboard?month=6&year=2025"
```

### Testing en AWS

```bash
# Obtener endpoint
export API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name gestion-demanda-api \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Probar endpoints
curl "${API_ENDPOINT}projects"
curl "${API_ENDPOINT}kpis/dashboard?month=6&year=2025"
```

### Validar Base de Datos

```bash
# Conectar a RDS
psql -h [RDS_ENDPOINT] -U postgres -d gestion_demanda

# Verificar datos
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM resources;
SELECT * FROM mv_monthly_capacity_summary WHERE year = 2025 AND month = 6;
```

## 🔧 Troubleshooting

### Error: "Cannot connect to database"

**Causa**: DATABASE_URL incorrecta o RDS no accesible

**Solución**:
```bash
# Verificar DATABASE_URL en .env
cat .env | grep DATABASE_URL

# Verificar conectividad a RDS
psql -h [RDS_ENDPOINT] -U postgres -d gestion_demanda

# Verificar Security Group permite tu IP
aws ec2 describe-security-groups --group-ids [SG_ID]
```

### Error: "Prisma Client not generated"

**Causa**: Prisma Client no está generado

**Solución**:
```bash
npx prisma generate
```

### Error: "Lambda timeout"

**Causa**: Función Lambda excede timeout de 30s

**Solución**:
1. Optimizar queries de Prisma
2. Aumentar timeout en `template.yaml`:
   ```yaml
   Globals:
     Function:
       Timeout: 60  # Aumentar a 60s
   ```
3. Considerar usar RDS Proxy para connection pooling

### Error: "Too many connections"

**Causa**: Lambda crea demasiadas conexiones a RDS

**Solución**:
1. Implementar RDS Proxy (recomendado)
2. Usar connection pooling en Prisma:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connection_limit = 5
   }
   ```

### Ver Logs Detallados

```bash
# Logs de una función específica
aws logs tail /aws/lambda/[FUNCTION_NAME] --follow

# Logs de todas las funciones del stack
sam logs --stack-name gestion-demanda-api --tail

# Filtrar logs por error
aws logs filter-log-events \
  --log-group-name /aws/lambda/[FUNCTION_NAME] \
  --filter-pattern "ERROR"
```

## 📚 Recursos Adicionales

- [Prisma Documentation](https://www.prisma.io/docs)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca commitear credenciales**
   - `.env` está en `.gitignore`
   - Usar AWS Secrets Manager para producción

2. **Revisar Security Groups**
   - Permitir solo IPs necesarias
   - Usar VPC privada para RDS

3. **Actualizar dependencias**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Habilitar encryption**
   - RDS encryption at rest (KMS)
   - SSL/TLS para conexiones

5. **Implementar autenticación**
   - AWS Cognito para usuarios
   - API Keys para servicios

## 📝 Scripts Disponibles

```json
{
  "build": "Compilar TypeScript a JavaScript",
  "deploy": "Compilar y desplegar a AWS",
  "local": "Iniciar API Gateway local",
  "prisma:generate": "Generar Prisma Client",
  "prisma:migrate": "Crear migración de BD",
  "prisma:push": "Sincronizar esquema con BD",
  "prisma:studio": "Abrir Prisma Studio (GUI)"
}
```

## 🤝 Contribución

Para contribuir al proyecto:

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios y commit: `git commit -m "Descripción"`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

## 📄 Licencia

Este proyecto es propiedad de Naturgy LCS.

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2025  
**Mantenedor**: Equipo de Desarrollo Naturgy LCS
