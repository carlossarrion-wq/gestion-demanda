#!/bin/bash

# Script para desplegar Jira Handler usando Container Images
# Solución al problema de límite de 250MB

set -e

echo "=========================================="
echo "Desplegando Jira Handler via Container"
echo "=========================================="

# Variables
REGION="eu-west-1"
REPOSITORY_NAME="gestion-demanda-jira"
FUNCTION_NAME="gestion-demanda-jira-handler"

# Obtener Account ID
echo "Obteniendo Account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account ID: $ACCOUNT_ID"

# URI del repositorio ECR
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPOSITORY_NAME"

# Crear repositorio ECR si no existe
echo ""
echo "Verificando repositorio ECR..."
if ! aws ecr describe-repositories --repository-names "$REPOSITORY_NAME" --region "$REGION" 2>/dev/null; then
    echo "Creando repositorio ECR..."
    aws ecr create-repository \
        --repository-name "$REPOSITORY_NAME" \
        --region "$REGION" \
        --no-cli-pager
    echo "✓ Repositorio creado"
else
    echo "✓ Repositorio ya existe"
fi

# Login en ECR
echo ""
echo "Haciendo login en ECR..."
aws ecr get-login-password --region "$REGION" | \
    docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build de la imagen
echo ""
echo "Construyendo imagen Docker..."
docker build -t "$REPOSITORY_NAME:latest" .

# Tag de la imagen
echo "Tageando imagen..."
docker tag "$REPOSITORY_NAME:latest" "$ECR_URI:latest"

# Push de la imagen
echo "Subiendo imagen a ECR..."
docker push "$ECR_URI:latest"

# Actualizar Lambda para usar la imagen
echo ""
echo "Actualizando Lambda para usar container image..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --image-uri "$ECR_URI:latest" \
    --region "$REGION" \
    --no-cli-pager

echo ""
echo "Esperando a que la Lambda esté actualizada..."
aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

echo ""
echo "=========================================="
echo "✅ Lambda actualizada exitosamente!"
echo "=========================================="
echo ""
echo "Detalles:"
echo "  Repository: $REPOSITORY_NAME"
echo "  Image URI: $ECR_URI:latest"
echo "  Function: $FUNCTION_NAME"
echo "  Region: $REGION"
echo ""
echo "La Lambda ahora usa:"
echo "  - Container Image (sin límite de 250MB)"
echo "  - GET  /jira/issues - Lista issues para selección"
echo "  - POST /jira/import - Importa issues seleccionados"
echo ""
echo "SIGUIENTE PASO: Configurar endpoint GET /jira/issues en API Gateway"
echo ""
