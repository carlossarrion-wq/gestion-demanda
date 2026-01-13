# Script para desplegar el handler de Jira a AWS Lambda
Write-Host "=== Desplegando Jira Handler a AWS Lambda ===" -ForegroundColor Cyan

# Variables
$FUNCTION_NAME = "gestion-demanda-jira-handler"
$REGION = "eu-west-1"
$ROLE_ARN = "arn:aws:iam::211125768096:role/lambda-execution-role"
$TEMP_DIR = "lambda-jira-temp"
$ZIP_FILE = "lambda-jira.zip"

# Limpiar directorio temporal si existe
if (Test-Path $TEMP_DIR) {
    Write-Host "Limpiando directorio temporal..." -ForegroundColor Yellow
    Remove-Item -Path $TEMP_DIR -Recurse -Force
}

# Crear directorio temporal
Write-Host "Creando directorio temporal..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

# Compilar TypeScript
Write-Host "Compilando TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error compilando TypeScript" -ForegroundColor Red
    exit 1
}

# Copiar archivos compilados
Write-Host "Copiando archivos compilados..." -ForegroundColor Yellow
Copy-Item -Path "dist/functions/jiraHandler.js" -Destination "$TEMP_DIR/jiraHandler.js"
Copy-Item -Path "dist/lib/*.js" -Destination "$TEMP_DIR/lib/" -Recurse -Force

# Copiar package.json y node_modules necesarios
Write-Host "Copiando dependencias..." -ForegroundColor Yellow
@"
{
  "name": "lambda-jira-handler",
  "version": "1.0.0",
  "main": "jiraHandler.js",
  "dependencies": {
    "@prisma/client": "^5.22.0"
  }
}
"@ | Out-File -FilePath "$TEMP_DIR/package.json" -Encoding UTF8

# Copiar Prisma Client
Write-Host "Copiando Prisma Client..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$TEMP_DIR/node_modules" -Force | Out-Null
Copy-Item -Path "node_modules/@prisma" -Destination "$TEMP_DIR/node_modules/" -Recurse -Force
Copy-Item -Path "node_modules/.prisma" -Destination "$TEMP_DIR/node_modules/" -Recurse -Force

# Copiar schema de Prisma
Write-Host "Copiando schema de Prisma..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$TEMP_DIR/prisma" -Force | Out-Null
Copy-Item -Path "prisma/schema.prisma" -Destination "$TEMP_DIR/prisma/"

# Crear ZIP
Write-Host "Creando archivo ZIP..." -ForegroundColor Yellow
if (Test-Path $ZIP_FILE) {
    Remove-Item $ZIP_FILE
}

Push-Location $TEMP_DIR
Compress-Archive -Path * -DestinationPath "../$ZIP_FILE" -Force
Pop-Location

# Verificar si la función Lambda existe
Write-Host "Verificando función Lambda..." -ForegroundColor Yellow
$functionExists = aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>$null

if ($functionExists) {
    Write-Host "Actualizando función Lambda existente..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Función Lambda actualizada exitosamente!" -ForegroundColor Green
    } else {
        Write-Host "Error actualizando función Lambda" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Creando nueva función Lambda..." -ForegroundColor Yellow
    aws lambda create-function `
        --function-name $FUNCTION_NAME `
        --runtime nodejs18.x `
        --role $ROLE_ARN `
        --handler jiraHandler.handler `
        --zip-file "fileb://$ZIP_FILE" `
        --timeout 30 `
        --memory-size 512 `
        --region $REGION `
        --environment "Variables={DATABASE_URL=$env:DATABASE_URL}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Función Lambda creada exitosamente!" -ForegroundColor Green
    } else {
        Write-Host "Error creando función Lambda" -ForegroundColor Red
        exit 1
    }
}

# Configurar variable de entorno DATABASE_URL
Write-Host "Configurando variables de entorno..." -ForegroundColor Yellow
$DATABASE_URL = (Get-Content .env | Select-String "DATABASE_URL").ToString().Split('=')[1]
aws lambda update-function-configuration `
    --function-name $FUNCTION_NAME `
    --environment "Variables={DATABASE_URL=$DATABASE_URL}" `
    --region $REGION

Write-Host ""
Write-Host "=== Despliegue completado ===" -ForegroundColor Green
Write-Host "Función Lambda: $FUNCTION_NAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximo paso: Configurar API Gateway" -ForegroundColor Yellow
Write-Host "Rutas a crear:" -ForegroundColor Yellow
Write-Host "  GET  /jira/projects   -> $FUNCTION_NAME" -ForegroundColor White
Write-Host "  POST /jira/import     -> $FUNCTION_NAME" -ForegroundColor White
Write-Host "  POST /jira/sync/{id}  -> $FUNCTION_NAME" -ForegroundColor White

# Limpiar
Write-Host ""
Write-Host "Limpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item -Path $TEMP_DIR -Recurse -Force
