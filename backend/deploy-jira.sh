#!/bin/bash

# Script para desplegar el handler de Jira a AWS Lambda
echo "=== Desplegando Jira Handler a AWS Lambda ==="

# Variables
FUNCTION_NAME="gestion-demanda-jira-handler"
REGION="eu-west-1"
ACCOUNT_ID="701055077130"
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/gestion-demanda-lambda-role"
TEMP_DIR="lambda-jira-temp"
ZIP_FILE="lambda-jira.zip"

# Limpiar directorio temporal si existe
if [ -d "$TEMP_DIR" ]; then
    echo "Limpiando directorio temporal..."
    rm -rf "$TEMP_DIR"
fi

# Crear directorio temporal
echo "Creando directorio temporal..."
mkdir -p "$TEMP_DIR/lib"

# Compilar TypeScript
echo "Compilando TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error compilando TypeScript"
    exit 1
fi

# Copiar archivos compilados
echo "Copiando archivos compilados..."
cp dist/functions/jiraHandler.js "$TEMP_DIR/"
cp -r dist/lib/*.js "$TEMP_DIR/lib/"

# Crear package.json
echo "Creando package.json..."
cat > "$TEMP_DIR/package.json" << 'EOF'
{
  "name": "lambda-jira-handler",
  "version": "1.0.0",
  "main": "jiraHandler.js",
  "dependencies": {
    "@prisma/client": "^5.22.0"
  }
}
EOF

# Copiar Prisma Client
echo "Copiando Prisma Client..."
mkdir -p "$TEMP_DIR/node_modules"
cp -r node_modules/@prisma "$TEMP_DIR/node_modules/"
cp -r node_modules/.prisma "$TEMP_DIR/node_modules/"

# Copiar schema de Prisma
echo "Copiando schema de Prisma..."
mkdir -p "$TEMP_DIR/prisma"
cp prisma/schema.prisma "$TEMP_DIR/prisma/"

# Crear ZIP
echo "Creando archivo ZIP..."
rm -f "$ZIP_FILE"
cd "$TEMP_DIR"
zip -r "../$ZIP_FILE" . -q
cd ..

# Verificar si la función Lambda existe
echo "Verificando función Lambda..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    echo "Actualizando función Lambda existente..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$ZIP_FILE" \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        echo "✓ Función Lambda actualizada exitosamente!"
    else
        echo "✗ Error actualizando función Lambda"
        exit 1
    fi
else
    echo "Creando nueva función Lambda..."
    
    # Obtener DATABASE_URL del .env
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime nodejs18.x \
        --role "$ROLE_ARN" \
        --handler jiraHandler.handler \
        --zip-file "fileb://$ZIP_FILE" \
        --timeout 30 \
        --memory-size 512 \
        --region "$REGION" \
        --environment "Variables={DATABASE_URL=$DATABASE_URL}"
    
    if [ $? -eq 0 ]; then
        echo "✓ Función Lambda creada exitosamente!"
    else
        echo "✗ Error creando función Lambda"
        exit 1
    fi
fi

# Configurar variable de entorno DATABASE_URL
echo "Configurando variables de entorno..."
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)
aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "Variables={DATABASE_URL=$DATABASE_URL}" \
    --region "$REGION" &> /dev/null

echo ""
echo "=== Despliegue completado ==="
echo "Función Lambda: $FUNCTION_NAME"
echo ""
echo "Próximo paso: Configurar API Gateway"
echo "Rutas a crear:"
echo "  GET  /jira/projects   -> $FUNCTION_NAME"
echo "  POST /jira/import     -> $FUNCTION_NAME"
echo "  POST /jira/sync/{id}  -> $FUNCTION_NAME"

# Limpiar
echo ""
echo "Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"

echo "✓ Listo!"
