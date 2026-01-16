#!/bin/bash

# Script para desplegar jiraHandler usando la Lambda de resources existente
# Esto evita el problema de tamaño ya que resources ya tiene todas las dependencias

set -e

echo "=========================================="
echo "Desplegando Jira Handler vía Resources Lambda"
echo "=========================================="

# Variables
FUNCTION_NAME="gestion-demanda-jira-handler"
REGION="eu-west-1"
S3_BUCKET="gestion-demanda-lambda-deployments"
TEMP_DIR="lambda-jira-update-temp"

# Limpiar si existe
if [ -d "$TEMP_DIR" ]; then
    echo "Limpiando directorio temporal..."
    rm -rf "$TEMP_DIR"
fi

# Crear directorio temporal
echo "Creando directorio temporal..."
mkdir -p "$TEMP_DIR/functions"
mkdir -p "$TEMP_DIR/lib"

# Copiar handler de jira compilado
echo "Copiando jiraHandler..."
cp dist/functions/jiraHandler.js "$TEMP_DIR/functions/"

# Copiar librería común
echo "Copiando lib..."
cp -r dist/lib "$TEMP_DIR/"

# Copiar dependencias
echo "Copiando dependencias..."
cp package.json "$TEMP_DIR/"
cp -r node_modules "$TEMP_DIR/"
cp -r prisma "$TEMP_DIR/"

# Crear ZIP
echo "Creando paquete ZIP..."
cd "$TEMP_DIR"
zip -r ../lambda-jira-updated.zip . > /dev/null
cd ..

echo "Tamaño del paquete: $(ls -lh lambda-jira-updated.zip | awk '{print $5}')"

# Subir a S3
echo "Subiendo a S3..."
aws s3 cp lambda-jira-updated.zip "s3://$S3_BUCKET/" --region $REGION

# Actualizar Lambda
echo "Actualizando Lambda..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --s3-bucket "$S3_BUCKET" \
    --s3-key "lambda-jira-updated.zip" \
    --region "$REGION" \
    --no-cli-pager

echo "Esperando a que la Lambda esté actualizada..."
aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

# Limpiar
echo "Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"

echo ""
echo "=========================================="
echo "✅ Lambda actualizada correctamente"
echo "=========================================="
echo ""
echo "La Lambda '$FUNCTION_NAME' actualizada con:"
echo "  - Nuevo jiraHandler con lógica refactorizada"
echo "  - GET  /jira/issues - Lista issues para selección"
echo "  - POST /jira/import - Importa issues seleccionados (cada issue = 1 proyecto)"
echo ""
echo "SIGUIENTE PASO: Configurar endpoint GET /jira/issues en API Gateway"
echo ""
