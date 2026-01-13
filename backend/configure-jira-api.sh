#!/bin/bash

# Script para configurar rutas de Jira en API Gateway
echo "=== Configurando API Gateway para Jira Handler ==="

# Variables
API_ID="s7vqyc1sm6"
REGION="eu-west-1"
FUNCTION_NAME="gestion-demanda-jira-handler"
ACCOUNT_ID="211125768096"

# Obtener el ARN de la función Lambda
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"
echo "Lambda ARN: $LAMBDA_ARN"

# Crear integración con Lambda
echo "Creando integración con Lambda..."
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$LAMBDA_ARN" \
    --payload-format-version 2.0 \
    --region "$REGION" \
    --query 'IntegrationId' \
    --output text)

if [ -z "$INTEGRATION_ID" ]; then
    echo "✗ Error creando integración"
    exit 1
fi

echo "✓ Integración creada: $INTEGRATION_ID"

# Crear rutas
echo ""
echo "Creando rutas..."

# Ruta 1: GET /jira/projects
echo "1. GET /jira/projects"
ROUTE1_ID=$(aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "GET /jira/projects" \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" \
    --query 'RouteId' \
    --output text)
echo "   ✓ Ruta creada: $ROUTE1_ID"

# Ruta 2: POST /jira/import
echo "2. POST /jira/import"
ROUTE2_ID=$(aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "POST /jira/import" \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" \
    --query 'RouteId' \
    --output text)
echo "   ✓ Ruta creada: $ROUTE2_ID"

# Ruta 3: POST /jira/sync/{projectId}
echo "3. POST /jira/sync/{projectId}"
ROUTE3_ID=$(aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "POST /jira/sync/{projectId}" \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" \
    --query 'RouteId' \
    --output text)
echo "   ✓ Ruta creada: $ROUTE3_ID"

# Dar permisos a API Gateway para invocar Lambda
echo ""
echo "Configurando permisos..."

# Permiso para todas las rutas de jira
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigateway-jira-invoke" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/jira/*" \
    --region "$REGION" &> /dev/null

echo "✓ Permisos configurados"

# Desplegar cambios
echo ""
echo "Desplegando cambios..."
aws apigatewayv2 create-deployment \
    --api-id "$API_ID" \
    --stage-name "\$default" \
    --region "$REGION" &> /dev/null

echo "✓ Cambios desplegados"

echo ""
echo "=== Configuración completada ==="
echo ""
echo "Endpoints disponibles:"
echo "  GET  https://$API_ID.execute-api.$REGION.amazonaws.com/jira/projects"
echo "  POST https://$API_ID.execute-api.$REGION.amazonaws.com/jira/import"
echo "  POST https://$API_ID.execute-api.$REGION.amazonaws.com/jira/sync/{projectId}"
echo ""
echo "✓ Integración con Jira lista para usar!"
