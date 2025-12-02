# Setup Guide - Sistema de Gestión de Demanda y Capacidad

## 📋 Resumen

Esta guía te ayudará a configurar el entorno de desarrollo local con PostgreSQL y posteriormente desplegar a AWS RDS.

## 🎯 Opción Recomendada: PostgreSQL Local

Dado que el RDS está en una red privada (sin acceso público), usaremos PostgreSQL local para desarrollo y luego desplegaremos a AWS.

---

## 🚀 Paso 1: Instalar PostgreSQL Localmente

### Windows

1. **Descargar PostgreSQL:**
   - Visita: https://www.postgresql.org/download/windows/
   - Descarga el instalador de PostgreSQL 15.x o superior
   - Ejecuta el instalador

2. **Durante la instalación:**
   - Puerto: `5432` (por defecto)
   - Usuario: `postgres`
   - Contraseña: Elige una contraseña (ej: `postgres123`)
   - Instala pgAdmin 4 (herramienta gráfica)

3. **Verificar instalación:**
   ```cmd
   psql --version
   ```

### Alternativa: Docker (Recomendado para desarrollo)

```cmd
docker run --name gestion-demanda-postgres ^
  -e POSTGRES_PASSWORD=postgres123 ^
  -e POSTGRES_DB=gestion_demanda ^
  -p 5432:5432 ^
  -d postgres:15
```

---

## 🔧 Paso 2: Configurar Variables de Entorno

1. **Editar el archivo `.env` en la carpeta `backend`:**

```env
# Para desarrollo local
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/gestion_demanda?schema=public"

# Para AWS RDS (usar cuando despliegues)
# DATABASE_URL="postgresql://postgres:GestionDemanda2024!@gestion-demanda-db.czuimyk2qu10.eu-west-1.rds.amazonaws.com:5432/gestion_demanda?schema=public"

NODE_ENV=development
PORT=3000
```

2. **Crear la base de datos (si no existe):**

```cmd
cd gestion-demanda\backend
psql -U postgres -c "CREATE DATABASE gestion_demanda;"
```

---

## 📦 Paso 3: Instalar Dependencias

```cmd
cd gestion-demanda\backend
npm install
```

---

## 🗄️ Paso 4: Aplicar el Schema de Prisma

Este comando creará todas las tablas en tu base de datos local:

```cmd
npm run prisma:push
```

**Salida esperada:**
```
✔ Generated Prisma Client
✔ The database is now in sync with the Prisma schema
```

---

## 🌱 Paso 5: Ejecutar el Seed (Datos Iniciales)

Este comando poblará la base de datos con los datos de ejemplo:

```cmd
npm run prisma:seed
```

**Salida esperada:**
```
🌱 Starting database seeding...
📁 Creating domains...
✅ Created 6 domains
📊 Creating statuses...
✅ Created 7 statuses
🎯 Creating skills...
✅ Created 6 skills
📋 Creating projects...
✅ Created 7 projects
📊 Creating project skill breakdowns...
✅ Created XX project skill breakdown entries
👥 Creating sample resources...
✅ Created 5 resources
🎯 Assigning skills to resources...
✅ Created XX resource-skill assignments
📅 Creating capacity entries for 2025...
✅ Created 60 capacity entries
✨ Database seeding completed successfully!
```

---

## 🔨 Paso 6: Ejecutar SQL Adicional (Triggers y Vistas)

Ejecuta el script SQL que crea triggers y vistas materializadas:

### Opción A: Usando psql

```cmd
cd gestion-demanda\backend
psql -U postgres -d gestion_demanda -f prisma\init-database.sql
```

### Opción B: Usando pgAdmin

1. Abre pgAdmin 4
2. Conecta a tu servidor local
3. Selecciona la base de datos `gestion_demanda`
4. Abre Query Tool (Tools > Query Tool)
5. Carga el archivo `prisma/init-database.sql`
6. Ejecuta el script (F5)

**Verificar que se crearon las vistas:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'VIEW';
```

Deberías ver:
- `mv_monthly_capacity_summary`
- `mv_project_utilization`
- `mv_resource_allocation`
- `mv_skill_capacity`

---

## 🧪 Paso 7: Probar el Servidor Local

```cmd
npm run dev
```

**Salida esperada:**
```
[nodemon] starting `ts-node src/server.ts`
🚀 Server running on http://localhost:3000
✅ Database connected successfully
```

### Probar los endpoints:

```cmd
# Listar proyectos
curl http://localhost:3000/api/projects

# Listar recursos
curl http://localhost:3000/api/resources

# Ver capacidad
curl http://localhost:3000/api/capacity

# Ver asignaciones
curl http://localhost:3000/api/assignments
```

---

## 🔍 Paso 8: Explorar la Base de Datos

### Usando Prisma Studio (Recomendado)

```cmd
npm run prisma:studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde podrás:
- Ver todas las tablas
- Editar datos
- Ejecutar consultas

### Usando pgAdmin

1. Abre pgAdmin 4
2. Conecta a `localhost:5432`
3. Navega a: Servers > PostgreSQL 15 > Databases > gestion_demanda > Schemas > public > Tables

---

## 📊 Verificar Datos Iniciales

### Verificar proyectos:
```sql
SELECT code, title, type, priority, status.name as status
FROM projects
JOIN statuses status ON projects.status_id = status.id;
```

### Verificar recursos y sus skills:
```sql
SELECT r.name, s.name as skill, rs.proficiency
FROM resources r
JOIN resource_skills rs ON r.id = rs.resource_id
JOIN skills s ON rs.skill_id = s.id
ORDER BY r.name, s.name;
```

### Verificar capacidad mensual:
```sql
SELECT r.name, c.month, c.year, c.total_hours
FROM capacity c
JOIN resources r ON c.resource_id = r.id
WHERE c.year = 2025
ORDER BY r.name, c.month;
```

### Verificar vistas materializadas:
```sql
-- Resumen de capacidad mensual
SELECT * FROM mv_monthly_capacity_summary;

-- Utilización de proyectos
SELECT * FROM mv_project_utilization;

-- Asignación de recursos
SELECT * FROM mv_resource_allocation;

-- Capacidad por skill
SELECT * FROM mv_skill_capacity;
```

---

## 🚀 Paso 9: Desplegar a AWS (Cuando estés listo)

### 9.1. Preparar el entorno AWS

1. **Actualizar `.env` para usar RDS:**
```env
DATABASE_URL="postgresql://postgres:GestionDemanda2024!@gestion-demanda-db.czuimyk2qu10.eu-west-1.rds.amazonaws.com:5432/gestion_demanda?schema=public"
```

2. **Conectar a RDS desde una instancia EC2 o usar AWS Systems Manager Session Manager**

### 9.2. Aplicar Schema a RDS

Desde una instancia EC2 en la misma VPC:

```bash
# Instalar Node.js y npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar el proyecto o copiar archivos
cd /tmp
# ... copiar archivos del backend

# Instalar dependencias
npm install

# Aplicar schema
npm run prisma:push

# Ejecutar seed
npm run prisma:seed

# Ejecutar SQL adicional
psql -h gestion-demanda-db.czuimyk2qu10.eu-west-1.rds.amazonaws.com \
     -U postgres \
     -d gestion_demanda \
     -f prisma/init-database.sql
```

### 9.3. Empaquetar y Desplegar Lambdas

```cmd
cd gestion-demanda\backend

# Generar Prisma Client
npm run prisma:generate

# Empaquetar Lambdas
.\package-lambdas.ps1

# Desplegar con SAM
sam deploy --guided
```

### 9.4. Configurar API Gateway

```cmd
.\configure-api-gateway.ps1
```

---

## 🛠️ Comandos Útiles

### Prisma

```cmd
# Generar Prisma Client
npm run prisma:generate

# Aplicar cambios al schema (desarrollo)
npm run prisma:push

# Crear una migración (producción)
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio

# Ejecutar seed
npm run prisma:seed
```

### Desarrollo

```cmd
# Iniciar servidor en modo desarrollo
npm run dev

# Compilar TypeScript
npm run build

# Iniciar servidor compilado
npm start
```

### Base de Datos

```cmd
# Conectar a PostgreSQL local
psql -U postgres -d gestion_demanda

# Backup de la base de datos
pg_dump -U postgres gestion_demanda > backup.sql

# Restaurar backup
psql -U postgres -d gestion_demanda < backup.sql

# Refrescar vistas materializadas manualmente
psql -U postgres -d gestion_demanda -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_capacity_summary;"
```

---

## 🐛 Troubleshooting

### Error: "relation does not exist"
- Ejecuta `npm run prisma:push` para crear las tablas

### Error: "password authentication failed"
- Verifica las credenciales en `.env`
- Asegúrate de que PostgreSQL esté corriendo

### Error: "port 5432 already in use"
- Otro servicio está usando el puerto
- Cambia el puerto en PostgreSQL o detén el otro servicio

### Error al ejecutar seed
- Asegúrate de que las tablas estén creadas (`npm run prisma:push`)
- Verifica que no haya datos duplicados

### Las vistas materializadas no se actualizan
- Los triggers deberían actualizarlas automáticamente
- Puedes refrescarlas manualmente con `REFRESH MATERIALIZED VIEW`

---

## 📚 Recursos Adicionales

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)

---

## ✅ Checklist de Setup

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `gestion_demanda` creada
- [ ] Archivo `.env` configurado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Schema aplicado (`npm run prisma:push`)
- [ ] Datos iniciales cargados (`npm run prisma:seed`)
- [ ] Triggers y vistas creadas (`init-database.sql`)
- [ ] Servidor local funcionando (`npm run dev`)
- [ ] Endpoints probados
- [ ] Datos verificados en Prisma Studio

---

## 🎉 ¡Listo!

Tu entorno de desarrollo local está configurado. Ahora puedes:
1. Desarrollar y probar localmente
2. Hacer cambios al schema y aplicarlos con `prisma:push`
3. Cuando estés listo, desplegar a AWS siguiendo el Paso 9
