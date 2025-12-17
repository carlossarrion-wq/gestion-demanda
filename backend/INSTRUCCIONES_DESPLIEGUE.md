# 📦 INSTRUCCIONES DE DESPLIEGUE MANUAL - LAMBDA

## ⚠️ PROBLEMA IDENTIFICADO Y SOLUCIONADO

**Error:** 400 Bad Request al crear proyectos sin el campo `type`
**Causa:** La validación no manejaba correctamente el valor `null` en el campo opcional `type`
**Solución:** Actualizada la validación en `validators.ts` para manejar correctamente `null`, `undefined` y strings vacíos

---

## 🔧 CAMBIOS REALIZADOS

### 1. Backend (`validators.ts`)
- ✅ Corregida validación del campo `type` para aceptar `null`
- ✅ Dominios y Estados ya estaban correctamente configurados con IDs numéricos

### 2. Archivos Compilados
- ✅ TypeScript compilado a JavaScript en `lambda-package/`
- ✅ Archivo `lambda-package/lib/validators.js` actualizado

---

## 📋 OPCIONES DE DESPLIEGUE

### OPCIÓN A: Despliegue Directo con AWS CLI (RECOMENDADO)

Este método actualiza solo el código sin crear un ZIP completo:

```powershell
# Navegar al directorio backend
cd gestion-demanda/backend

# Crear ZIP solo con los archivos compilados (más ligero)
Compress-Archive -Path lambda-package\* -DestinationPath lambda-update.zip -Force

# Subir directamente a Lambda
aws lambda update-function-code `
  --function-name gestion-demanda-api `
  --zip-file fileb://lambda-update.zip `
  --region eu-west-1

# Verificar el despliegue
aws lambda get-function --function-name gestion-demanda-api --region eu-west-1
```

---

### OPCIÓN B: Despliegue vía S3 (Para archivos grandes)

Si el ZIP es muy grande para subirlo directamente:

```powershell
# 1. Crear el ZIP
cd gestion-demanda/backend
Compress-Archive -Path lambda-package\* -DestinationPath lambda-update.zip -Force

# 2. Subir a S3 (reemplaza 'tu-bucket' con tu bucket real)
$BUCKET_NAME = "tu-bucket-temporal"
aws s3 cp lambda-update.zip s3://$BUCKET_NAME/lambda-update.zip

# 3. Actualizar Lambda desde S3
aws lambda update-function-code `
  --function-name gestion-demanda-api `
  --s3-bucket $BUCKET_NAME `
  --s3-key lambda-update.zip `
  --region eu-west-1

# 4. Limpiar (opcional)
aws s3 rm s3://$BUCKET_NAME/lambda-update.zip
```

---

### OPCIÓN C: Despliegue Manual desde Consola AWS

1. **Crear el ZIP:**
   ```powershell
   cd gestion-demanda/backend
   Compress-Archive -Path lambda-package\* -DestinationPath lambda-update.zip -Force
   ```

2. **Subir desde la Consola AWS:**
   - Ve a AWS Lambda Console
   - Selecciona la función `gestion-demanda-api`
   - En la pestaña "Code", haz clic en "Upload from" → ".zip file"
   - Selecciona `lambda-update.zip`
   - Haz clic en "Save"

---

## 🎯 VERIFICACIÓN POST-DESPLIEGUE

### 1. Verificar que la Lambda se actualizó:
```powershell
aws lambda get-function-configuration `
  --function-name gestion-demanda-api `
  --region eu-west-1 `
  --query 'LastModified'
```

### 2. Probar la creación de proyecto:

**Desde PowerShell:**
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "TU_AWS_ACCESS_KEY"
    "x-user-team" = "TU_EQUIPO"
}

$body = @{
    code = "NC-TEST"
    type = $null
    title = "Proyecto de Prueba"
    description = "Descripción de prueba"
    domain = 10
    priority = "Media"
    status = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://xrqo2gedpl.execute-api.eu-west-1.amazonaws.com/prod/projects" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

### 3. Verificar desde el Frontend:
1. Abre la aplicación en el navegador
2. Ve a "Gestión de Proyectos"
3. Haz clic en "Añadir Proyecto"
4. Rellena los campos obligatorios (deja Tipo, Fecha Inicio y Fecha Fin vacíos)
5. Haz clic en "Guardar"
6. ✅ Debería crearse sin errores

---

## 📊 INFORMACIÓN DEL PAQUETE

- **Ubicación:** `gestion-demanda/backend/lambda-package/`
- **Archivos principales modificados:**
  - `lib/validators.js` (validación corregida)
  - `lib/validators.d.ts` (tipos TypeScript)
  
- **Tamaño estimado del ZIP:** ~50-100 MB (debido a node_modules de Prisma)

---

## 🚨 TROUBLESHOOTING

### Error: "RequestEntityTooLargeException"
**Solución:** Usa la OPCIÓN B (despliegue vía S3)

### Error: "Access Denied"
**Solución:** Verifica que tienes permisos de Lambda y S3:
```powershell
aws sts get-caller-identity
```

### Error: "Function not found"
**Solución:** Verifica el nombre de la función:
```powershell
aws lambda list-functions --region eu-west-1 --query 'Functions[].FunctionName'
```

---

## 📝 NOTAS IMPORTANTES

1. **Backup:** El código anterior de la Lambda se mantiene en las versiones de AWS Lambda
2. **Rollback:** Si algo falla, puedes volver a la versión anterior desde la consola AWS
3. **Testing:** Prueba primero en un entorno de desarrollo si es posible
4. **Logs:** Monitorea CloudWatch Logs después del despliegue para detectar errores

---

## ✅ CHECKLIST DE DESPLIEGUE

- [ ] Compilación TypeScript completada (`npm run build`)
- [ ] ZIP creado correctamente
- [ ] Lambda actualizada (vía CLI o Consola)
- [ ] Verificación de última modificación
- [ ] Prueba de creación de proyecto sin campo `type`
- [ ] Verificación en frontend
- [ ] Revisión de logs en CloudWatch

---

## 🆘 SOPORTE

Si encuentras problemas durante el despliegue:
1. Revisa los logs de CloudWatch
2. Verifica que el archivo `validators.js` se actualizó correctamente
3. Confirma que la región es `eu-west-1`
4. Asegúrate de tener las credenciales AWS configuradas

**Comando para ver logs recientes:**
```powershell
aws logs tail /aws/lambda/gestion-demanda-api --follow --region eu-west-1
