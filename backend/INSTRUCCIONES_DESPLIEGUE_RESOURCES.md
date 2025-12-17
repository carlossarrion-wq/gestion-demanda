# 📦 INSTRUCCIONES DE DESPLIEGUE - CORS FIX PARA /RESOURCES

## ⚠️ PROBLEMA IDENTIFICADO

**Error:** CORS error al intentar cargar recursos desde el frontend
```
Access to fetch at 'https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod/resources?team=saplcorp' 
from origin 'http://localhost:8000' has been blocked by CORS policy: Response to preflight request doesn't 
pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Causa:** El endpoint `/resources` no tiene configurado el manejo de CORS (OPTIONS method)

**Solución:** Añadido manejo de OPTIONS en `resourcesHandler.ts` siguiendo el mismo patrón que `projectsHandler.ts`

---

## 🔧 CAMBIOS REALIZADOS

### 1. Backend (`resourcesHandler.ts`)
- ✅ Añadido manejo de método OPTIONS para CORS preflight
- ✅ Headers CORS configurados:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET,POST,PUT,OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-user-team`

### 2. Prisma Client
- ✅ Regenerado Prisma client con campo `team` en Resource

### 3. Compilación TypeScript
- ✅ Código compilado sin errores a JavaScript en `lambda-package/`

---

## 📋 PASOS DE DESPLIEGUE

### PASO 1: Crear el paquete de despliegue

```powershell
# Navegar al directorio backend
cd gestion-demanda/backend

# Crear ZIP con los archivos compilados
Compress-Archive -Path lambda-package\* -DestinationPath lambda-resources-cors-fix.zip -Force
```

### PASO 2: Desplegar a AWS Lambda

**Opción A - AWS CLI (Recomendado):**
```powershell
aws lambda update-function-code `
  --function-name gestion-demanda-api `
  --zip-file fileb://lambda-resources-cors-fix.zip `
  --region eu-west-1
```

**Opción B - Consola AWS:**
1. Ve a AWS Lambda Console
2. Selecciona la función `gestion-demanda-api`
3. En la pestaña "Code", haz clic en "Upload from" → ".zip file"
4. Selecciona `lambda-resources-cors-fix.zip`
5. Haz clic en "Save"

### PASO 3: Configurar API Gateway (IMPORTANTE)

Aunque el Lambda ahora maneja OPTIONS, también necesitas configurar API Gateway:

1. **Ve a API Gateway Console**
2. **Selecciona tu API:** `gestion-demanda-api`
3. **Navega al recurso `/resources`**
4. **Añadir método OPTIONS:**
   - Haz clic en "Actions" → "Create Method"
   - Selecciona "OPTIONS" del dropdown
   - Haz clic en el checkmark
   - En "Integration type", selecciona "Lambda Function"
   - Marca "Use Lambda Proxy integration"
   - Selecciona la función `gestion-demanda-api`
   - Haz clic en "Save"

5. **Habilitar CORS:**
   - Selecciona el recurso `/resources`
   - Haz clic en "Actions" → "Enable CORS"
   - Verifica que los headers incluyan:
     - `Access-Control-Allow-Origin: *`
     - `Access-Control-Allow-Methods: GET,POST,PUT,OPTIONS`
     - `Access-Control-Allow-Headers: Content-Type,Authorization,x-user-team`
   - Haz clic en "Enable CORS and replace existing CORS headers"

6. **Desplegar los cambios:**
   - Haz clic en "Actions" → "Deploy API"
   - Selecciona el stage "prod"
   - Haz clic en "Deploy"

---

## 🎯 VERIFICACIÓN POST-DESPLIEGUE

### 1. Verificar Lambda actualizada:
```powershell
aws lambda get-function-configuration `
  --function-name gestion-demanda-api `
  --region eu-west-1 `
  --query 'LastModified'
```

### 2. Probar OPTIONS request:
```powershell
curl -X OPTIONS `
  -H "Origin: http://localhost:8000" `
  -H "Access-Control-Request-Method: GET" `
  -H "Access-Control-Request-Headers: Content-Type,Authorization,x-user-team" `
  -v `
  https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod/resources
```

**Respuesta esperada:**
- Status: 200 OK
- Headers incluyen `Access-Control-Allow-Origin: *`

### 3. Probar GET request con team:
```powershell
$headers = @{
    "Authorization" = "TU_AWS_ACCESS_KEY"
    "x-user-team" = "saplcorp"
}

Invoke-RestMethod -Uri "https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod/resources?team=saplcorp" `
  -Method GET `
  -Headers $headers
```

### 4. Verificar desde el Frontend:
1. Abre la aplicación en el navegador (http://localhost:8000)
2. Inicia sesión con un usuario del equipo "saplcorp"
3. Ve a la pestaña "Gestión de Capacidad"
4. ✅ Los recursos deberían cargarse sin errores CORS
5. ✅ Deberías ver solo los recursos del equipo "saplcorp"

---

## 🚨 TROUBLESHOOTING

### Error: "CORS error persiste después del despliegue"
**Causa:** API Gateway no tiene configurado el método OPTIONS
**Solución:** Sigue el PASO 3 para configurar OPTIONS en API Gateway

### Error: "No 'Access-Control-Allow-Origin' header"
**Causa:** API Gateway no está devolviendo los headers CORS
**Solución:** 
1. Verifica que el método OPTIONS existe en `/resources`
2. Verifica que CORS está habilitado en el recurso
3. Asegúrate de haber desplegado los cambios al stage "prod"

### Error: "Method not allowed"
**Causa:** El método OPTIONS no está configurado correctamente
**Solución:** Elimina y vuelve a crear el método OPTIONS siguiendo el PASO 3

### Los recursos no se filtran por equipo
**Causa:** El header `x-user-team` no se está enviando
**Solución:** Verifica que `sessionStorage.getItem('user_team')` tiene un valor válido

---

## 📊 INFORMACIÓN DEL DESPLIEGUE

- **Función Lambda:** `gestion-demanda-api`
- **Región:** `eu-west-1`
- **API Gateway:** `https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod`
- **Endpoint afectado:** `/resources`
- **Métodos soportados:** GET, POST, PUT, OPTIONS

---

## ✅ CHECKLIST DE DESPLIEGUE

- [ ] Compilación TypeScript completada
- [ ] Prisma client regenerado
- [ ] ZIP creado correctamente
- [ ] Lambda actualizada (vía CLI o Consola)
- [ ] Método OPTIONS añadido en API Gateway
- [ ] CORS habilitado en API Gateway
- [ ] Cambios desplegados al stage "prod"
- [ ] Verificación de OPTIONS request
- [ ] Verificación de GET request con team
- [ ] Prueba desde frontend
- [ ] Recursos se cargan sin errores CORS
- [ ] Filtrado por equipo funciona correctamente

---

## 📝 NOTAS IMPORTANTES

1. **API Gateway es crítico:** Aunque el Lambda maneja OPTIONS, API Gateway debe estar configurado correctamente
2. **Despliegue en dos pasos:** Primero actualiza Lambda, luego configura API Gateway
3. **Cache de API Gateway:** Puede tardar 1-2 minutos en propagarse
4. **Testing:** Prueba primero con curl/Postman antes de probar en el frontend
5. **Logs:** Monitorea CloudWatch Logs para detectar errores

---

## 🆘 SOPORTE

**Ver logs recientes:**
```powershell
aws logs tail /aws/lambda/gestion-demanda-api --follow --region eu-west-1
```

**Ver configuración de API Gateway:**
```powershell
aws apigateway get-resources --rest-api-id xrqo2gedpl --region eu-west-1
