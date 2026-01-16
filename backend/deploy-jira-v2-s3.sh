#!/bin/bash

# Script de despliegue de Lambda Jira v2 via S3
# Cada issue de Jira se importa como un proyecto individual

set -e

echo "=========================================="
echo "Desplegando Lambda Jira Handler v2 via S3"
echo "=========================================="

# Variables
FUNCTION_NAME="gestion-demanda-jira-handler"
REGION="eu-west-1"
S3_BUCKET="gestion-demanda-lambda-deployments"
TEMP_DIR="lambda-jira-v2-temp"
ZIP_NAME="lambda-jira-v2.zip"
S3_KEY="jira/$ZIP_NAME"

# Limpiar directorio temporal si existe
if [ -d "$TEMP_DIR" ]; then
    echo "Limpiando directorio temporal..."
    rm -rf "$TEMP_DIR"
fi

# Crear directorio temporal
echo "Creando directorio temporal..."
mkdir -p "$TEMP_DIR"

# Copiar archivos necesarios
echo "Copiando archivos..."
cp dist/functions/jiraHandler.js "$TEMP_DIR/"
cp -r dist/lib "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp -r node_modules "$TEMP_DIR/"
cp -r prisma "$TEMP_DIR/"

# Crear ZIP
echo "Creando paquete ZIP..."
cd "$TEMP_DIR"
zip -r ../$ZIP_NAME . > /dev/null
cd ..

echo "Tamaño del paquete: $(ls -lh $ZIP_NAME | awk '{print $5}')"

# Subir a S3
echo "Subiendo a S3..."
aws s3 cp $ZIP_NAME s3://$S3_BUCKET/$S3_KEY --region $REGION

# Actualizar Lambda desde S3
echo "Actualizando Lambda desde S3..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --s3-bucket "$S3_BUCKET" \
    --s3-key "$S3_KEY" \
    --region "$REGION" \
    --no-cli-pager

echo "Esperando a que la Lambda esté actualizada..."
aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

# Limpiar
echo "Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"
rm $ZIP_NAME

echo ""
echo "=========================================="
echo "✅ Lambda actualizada correctamente"
echo "=========================================="
echo ""
echo "Nuevos endpoints implementados:"
echo "  GET  /jira/issues - Listar issues para selección"
echo "  POST /jira/import - Importar issues seleccionados (cada issue = 1 proyecto)"
echo "  POST /jira/sync/{id} - Sincronizar proyecto"
echo ""
echo "Cambios principales:"
echo "  - Cada issue de Jira se importa como un proyecto individual"
echo "  - ID del proyecto = Issue Key (NC-780, NC-779, etc.)"
echo "  - Título = Summary del issue"
echo "  - Custom fields de Jira soportados"
echo ""
echo "SIGUIENTE PASO: Configurar endpoint GET /jira/issues en API Gateway"
echo ""
