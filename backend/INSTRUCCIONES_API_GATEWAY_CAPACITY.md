# Instrucciones para Configurar API Gateway - Capacity Endpoint

## ✅ Estado Actual
- Lambda function desplegada: `gestiondemanda_capacityHandler`
- Tamaño del paquete: 48.59 MB (optimizado)
- Runtime: nodejs18.x
- Timeout: 30s

## 🎯 Objetivo
Configurar el endpoint `/capacity/overview` en API Gateway para conectar con la Lambda function.

---

## 📋 Pasos de Configuración

### 1. Acceder a API Gateway Console
```
https://console.aws.amazon.com/apigateway
```
- Región: **eu-west-1** (Ireland)
- Seleccionar API: **gestiondemanda-api**

### 2. Crear Recurso `/capacity`
1. En el árbol de recursos, seleccionar la raíz `/`
2. Click en **Actions** → **Create Resource**
3. Configurar:
   - Resource Name: `capacity`
   - Resource Path: `/capacity`
   - Enable API Gateway CORS: ☑️ (marcar)
4. Click **Create Resource**

### 3. Crear Recurso `/overview` bajo `/capacity`
1. Seleccionar el recurso `/capacity` recién creado
2. Click en **Actions** → **Create Resource**
3. Configurar:
   - Resource Name: `overview`
   - Resource Path: `/overview`
   - Enable API Gateway CORS: ☑️ (marcar)
4. Click **Create Resource**

### 4. Configurar Método GET en `/capacity/overview`
1. Seleccionar el recurso `/capacity/overview`
2. Click en **Actions** → **Create Method**
3. Seleccionar **GET** del dropdown
4. Click en el checkmark ✓
5. Configurar integración:
   - Integration type: **Lambda Function**
   - Use Lambda Proxy integration: ☑️ **IMPORTANTE: Marcar esta opción**
   - Lambda Region: **eu-west-1**
   - Lambda Function: `gestiondemanda_capacityHandler`
6. Click **Save**
7. Confirmar permisos cuando aparezca el popup

### 5. Configurar Método OPTIONS para CORS
1. Con `/capacity/overview` seleccionado
2. Click en **Actions** → **Create Method**
3. Seleccionar **OPTIONS** del dropdown
4. Click en el checkmark ✓
5. Configurar:
   - Integration type: **Mock**
6. Click **Save**

### 6. Configurar Method Response para OPTIONS
1. Click en **Method Response** del método OPTIONS
2. Expandir **200** response
3. Añadir los siguientes headers:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`

### 7. Configurar Integration Response para OPTIONS
1. Click en **Integration Response** del método OPTIONS
2. Expandir la respuesta **200**
3. Expandir **Header Mappings**
4. Configurar los valores:
   - `Access-Control-Allow-Origin`: `'*'`
   - `Access-Control-Allow-Methods`: `'GET,OPTIONS'`
   - `Access-Control-Allow-Headers`: `'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'`

### 8. Desplegar la API
1. Click en **Actions** → **Deploy API**
2. Deployment stage: **prod**
3. Click **Deploy**

### 9. Verificar el Endpoint
Después del despliegue, obtendrás una URL como:
```
https://[api-id].execute-api.eu-west-1.amazonaws.com/prod/capacity/overview
```

---

## 🧪 Prueba Rápida

### Usando curl (PowerShell):
```powershell
$headers = @{
    "x-user-team" = "sap"
}
Invoke-RestMethod -Uri "https://[api-id].execute-api.eu-west-1.amazonaws.com/prod/capacity/overview" -Headers $headers -Method Get
```

### Usando curl (bash):
```bash
curl -H "x-user-team: sap" https://[api-id].execute-api.eu-west-1.amazonaws.com/prod/capacity/overview
```

---

## ⚠️ Verificaciones Importantes

### Antes de probar desde el frontend:

1. **Verificar DATABASE_URL en Lambda**
   ```powershell
   aws lambda get-function-configuration --function-name gestiondemanda_capacityHandler --region eu-west-1 --query 'Environment.Variables.DATABASE_URL'
   ```
   
   Si no está configurada:
   ```powershell
   aws lambda update-function-configuration --function-name gestiondemanda_capacityHandler --region eu-west-1 --environment "Variables={DATABASE_URL=postgresql://[tu-connection-string]}"
   ```

2. **Verificar datos en base de datos**
   - Ejecutar las queries de verificación del documento ESTADO_IMPLEMENTACION_CAPACIDAD.md
   - Asegurarse de que existen recursos con team asignado
   - Verificar que hay datos de Capacity y Assignment para 2025

3. **Actualizar config/data.js si es necesario**
   - Verificar que la URL base apunta al API Gateway correcto
   - El endpoint `/capacity` ya está configurado en el código

---

## 🐛 Troubleshooting

### Error: "Missing Authentication Token"
- Verificar que la URL es correcta
- Verificar que el stage es 'prod'
- Verificar que el método GET está desplegado

### Error: CORS
- Verificar que OPTIONS está configurado correctamente
- Verificar los headers en Integration Response
- Verificar que Lambda Proxy Integration está habilitado en GET

### Error: "Internal Server Error"
- Revisar logs en CloudWatch: `/aws/lambda/gestiondemanda_capacityHandler`
- Verificar que DATABASE_URL está configurada
- Verificar que la base de datos es accesible desde Lambda

### No se muestran datos
- Verificar que el header `x-user-team` se está enviando
- Verificar que existen recursos para ese team en la BD
- Verificar que hay datos de capacidad para el año 2025

---

## 📝 Notas

- El endpoint requiere el header `x-user-team` para filtrar recursos
- Valores válidos para team: `darwin`, `mulesoft`, `sap`, `saplcorp`
- El año por defecto es 2025, pero se puede cambiar con query param `?year=2024`
- La respuesta incluye KPIs, datos para gráficos y matriz de recursos

---

**Fecha:** 11/12/2025
**Autor:** Cline AI Assistant
