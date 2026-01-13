# Despliegue de Lambda vía S3 (para archivos >50MB)

## ✅ Solución para ZIP de 80MB

AWS Lambda tiene límite de 50MB para upload directo, pero permite hasta **250MB** usando S3.

## 📋 Pasos para Desplegar

### Opción 1: Usando AWS CLI (Recomendado)

```bash
cd backend

# 1. Subir ZIP a S3
aws s3 cp lambda-assignments.zip s3://tu-bucket-name/lambda-deployments/

# 2. Actualizar Lambda desde S3
aws lambda update-function-code \
  --function-name gestiondemanda_assignmentsHandler \
  --s3-bucket tu-bucket-name \
  --s3-key lambda-deployments/lambda-assignments.zip \
  --region eu-west-1
```

### Opción 2: AWS Console

**Paso 1: Subir a S3**
1. Ir a: https://s3.console.aws.amazon.com/s3/
2. Seleccionar un bucket existente (o crear uno nuevo)
3. Crear carpeta: `lambda-deployments`
4. Upload → Subir `lambda-assignments.zip`
5. Copiar la URL del objeto S3

**Paso 2: Actualizar Lambda**
1. Ir a: https://console.aws.amazon.com/lambda
2. Función: `gestiondemanda_assignmentsHandler`
3. Code → Upload from → Amazon S3 location
4. Pegar la URL S3 del paso 1
5. Save

## 🎯 Nombres de Bucket Sugeridos

Si necesitas crear un bucket nuevo:
- `gestion-demanda-lambda-deployments`
- `gestiondemanda-artifacts`
- `lambda-code-gestiondemanda`

**Importante:** El bucket debe estar en la misma región (eu-west-1)

## 📝 Script Completo para CLI

```bash
#!/bin/bash

# Variables
BUCKET_NAME="gestion-demanda-lambda-deployments"
FUNCTION_NAME="gestiondemanda_assignmentsHandler"
REGION="eu-west-1"
ZIP_FILE="lambda-assignments.zip"

echo "📦 Subiendo a S3..."
aws s3 cp $ZIP_FILE s3://$BUCKET_NAME/lambda/$ZIP_FILE

echo "🚀 Actualizando Lambda..."
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --s3-bucket $BUCKET_NAME \
  --s3-key lambda/$ZIP_FILE \
  --region $REGION

echo "✅ Despliegue completado!"
```

## 🔍 Verificar Bucket Existente

Para ver si ya tienes buckets disponibles:

```bash
aws s3 ls
```

## 💡 Notas Importantes

1. **Permisos:** Lambda necesita permiso para leer del bucket S3
2. **Región:** Bucket y Lambda deben estar en misma región (eu-west-1)
3. **Tamaño:** Límite de 250MB descomprimido
4. **Costo:** S3 tiene costo mínimo de almacenamiento

## ⚠️ Si No Tienes Bucket

Crear uno nuevo:

```bash
aws s3 mb s3://gestion-demanda-lambda-deployments --region eu-west-1
```

Luego seguir con los pasos de arriba.
