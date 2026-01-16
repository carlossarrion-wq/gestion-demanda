#!/bin/bash

# Script para crear Lambda Layer con dependencias comunes
# Esto reduce el tamaño del paquete de cada Lambda

set -e

echo "=========================================="
echo "Creando Lambda Layer con Dependencias"
echo "=========================================="

# Variables
LAYER_NAME="gestion-demanda-dependencies"
REGION="eu-west-1"
LAYER_DIR="lambda-layer-temp"
S3_BUCKET="gestion-demanda-lambda-deployments"

# Limpiar si existe
if [ -d "$LAYER_DIR" ]; then
    echo "Limpiando directorio temporal..."
    rm -rf "$LAYER_DIR"
fi

# Crear estructura de layer
echo "Creando estructura de layer..."
mkdir -p "$LAYER_DIR/nodejs"

# Copiar dependencias
echo "Copiando node_modules..."
cp -r node_modules "$LAYER_DIR/nodejs/"

echo "Copiando prisma..."
cp -r prisma "$LAYER_DIR/nodejs/"

echo "Copiando package.json..."
cp package.json "$LAYER_DIR/nodejs/"

# Crear ZIP del layer
echo "Creando ZIP del layer..."
cd "$LAYER_DIR"
zip -r layer.zip nodejs/ > /dev/null
cd ..

LAYER_SIZE=$(ls -lh "$LAYER_DIR/layer.zip" | awk '{print $5}')
echo "Tamaño del layer: $LAYER_SIZE"

# Subir a S3
echo "Subiendo layer a S3..."
aws s3 cp "$LAYER_DIR/layer.zip" "s3://$S3_BUCKET/layers/layer.zip" --region $REGION

# Publicar layer desde S3
echo "Publicando Lambda Layer..."
LAYER_VERSION=$(aws lambda publish-layer-version \
    --layer-name "$LAYER_NAME" \
    --description "Dependencias comunes (node_modules + prisma) para lambdas de gestión de demanda" \
    --compatible-runtimes nodejs18.x nodejs20.x \
    --content S3Bucket="$S3_BUCKET",S3Key="layers/layer.zip" \
    --region "$REGION" \
    --query 'Version' \
    --output text)

echo ""
echo "✅ Layer creado exitosamente!"
echo "   Nombre: $LAYER_NAME"
echo "   Versión: $LAYER_VERSION"
echo ""

# Obtener ARN del layer
LAYER_ARN=$(aws lambda list-layer-versions \
    --layer-name "$LAYER_NAME" \
    --region "$REGION" \
    --query "LayerVersions[0].LayerVersionArn" \
    --output text)

echo "Layer ARN: $LAYER_ARN"

# Guardar ARN para uso posterior
echo "$LAYER_ARN" > layer-arn.txt
echo "ARN guardado en: layer-arn.txt"

# Limpiar
echo ""
echo "Limpiando archivos temporales..."
rm -rf "$LAYER_DIR"

echo ""
echo "=========================================="
echo "✅ Lambda Layer listo para usar"
echo "=========================================="
echo ""
echo "Para usarlo en tus Lambdas, ejecuta:"
echo ""
echo "aws lambda update-function-configuration \\"
echo "  --function-name TU_FUNCION \\"
echo "  --layers $LAYER_ARN \\"
echo "  --region $REGION"
echo ""
