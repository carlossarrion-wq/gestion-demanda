# Guía de Implementación - Gestión de Capacidad

## Estado Actual
✅ Cambios en código completados
⏳ Pendiente: Aplicar cambios en base de datos y verificar

## Pasos a Ejecutar

### Paso 1: Verificar estructura del proyecto
- [x] Verificar que existe el directorio backend
- [x] Verificar que existe prisma/schema.prisma
- [ ] Verificar que existe .env con configuración de BD

### Paso 2: Aplicar migración de base de datos
- [ ] Ejecutar script SQL de migración
- [ ] Verificar que la columna team se agregó correctamente

### Paso 3: Regenerar Prisma Client
- [ ] Ejecutar `npx prisma generate` en directorio backend
- [ ] Verificar que no hay errores de TypeScript

### Paso 4: Actualizar datos de prueba (seed)
- [ ] Modificar seed.ts para incluir team en recursos
- [ ] Ejecutar seed para poblar datos de prueba

### Paso 5: Verificar backend
- [ ] Compilar TypeScript
- [ ] Verificar que no hay errores

### Paso 6: Probar la aplicación
- [ ] Iniciar sesión con usuario de prueba
- [ ] Verificar que la pestaña "Gestión de Capacidad" carga
- [ ] Verificar que solo se muestran recursos del equipo del usuario

## Comandos a Ejecutar

```bash
# Paso 2: Aplicar migración (desde directorio backend)
cd backend
psql -h <host> -U <user> -d <database> -f prisma/migrations/add_team_to_resources.sql

# Paso 3: Regenerar Prisma Client
npx prisma generate

# Paso 4: Ejecutar seed (opcional)
npx ts-node prisma/seed.ts

# Paso 5: Compilar TypeScript
npm run build
```

## Archivos Modificados

1. ✅ `backend/prisma/schema.prisma` - Agregado campo team a Resource
2. ✅ `backend/prisma/migrations/add_team_to_resources.sql` - Script de migración
3. ✅ `backend/src/functions/resourcesHandler.ts` - Filtrado por team
4. ✅ `backend/src/lib/validators.ts` - Validación de team
5. ✅ `assets/js/components/resourceCapacity.js` - Módulo frontend
6. ✅ `assets/js/main.js` - Inicialización del módulo
7. ✅ `index-modular.html` - Eliminados datos hardcodeados

## Notas Importantes

- El campo `team` acepta valores: darwin, mulesoft, sap, saplcorp
- La migración distribuye recursos existentes equitativamente entre los 4 equipos
- El filtrado se hace automáticamente usando el team del usuario en sessionStorage
- Los recursos pueden tener múltiples skills via tabla ResourceSkill
