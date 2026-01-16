#!/bin/bash

# Script de despliegue de Lambda Jira v2 (con endpoint /jira/issues)
# Cada issue de Jira se importa como un proyecto individual

set -e

echo "=========================================="
echo "Desplegando Lambda Jira Handler v2"
echo "=========================================="

# Variables
FUNCTION_NAME="gestion-demanda-jira-handler"
REGION="eu-west-1"
TEMP_DIR="lambda-jira-v2-temp"

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
zip -r ../lambda-jira-v2.zip . > /dev/null
cd ..

echo "Tamaño del paquete: $(ls -lh lambda-jira-v2.zip | awk '{print $5}')"

# Actualizar código de la Lambda
echo "Actualizando código de Lambda..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://lambda-jira-v2.zip \
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
echo "Endpoints configurados:"
echo "  GET  /jira/issues - Listar issues para selección"
echo "  POST /jira/import - Importar issues seleccionados"
echo "  POST /jira/sync/{id} - Sincronizar proyecto"
echo ""
echo "IMPORTANTE: Configurar endpoint /jira/issues en API Gateway"
echo ""
