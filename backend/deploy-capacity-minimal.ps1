# Script de despliegue MINIMAL para capacityHandler Lambda
# Solo incluye dependencias esenciales de Prisma

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE MINIMAL CAPACITY HANDLER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el código está compilado
if (-not (Test-Path "dist/functions/capacityHandler.js")) {
    Write-Host "Error: No se encuentra dist/functions/capacityHandler.js" -ForegroundColor Red
    Write-Host "Ejecuta 'npm run build' primero" -ForegroundColor Yellow
    exit 1
}

# Paso 1: Crear estructura de paquete
Write-Host "Paso 1: Creando estructura minimal..." -ForegroundColor Yellow
if (Test-Path "lambda-capacity-temp") {
    Remove-Item "lambda-capacity-temp" -Recurse -Force
}
New-Item -ItemType Directory -Path "lambda-capacity-temp" -Force | Out-Null
New-Item -ItemType Directory -Path "lambda-capacity-temp/functions" -Force | Out-Null
New-Item -ItemType Directory -Path "lambda-capacity-temp/lib" -Force | Out-Null
New-Item -ItemType Directory -Path "lambda-capacity-temp/node_modules" -Force | Out-Null
Write-Host "Estructura creada" -ForegroundColor Green

# Paso 2: Copiar SOLO archivos JS compilados (sin .map ni .d.ts)
Write-Host "Paso 2: Copiando archivos compilados..." -ForegroundColor Yellow
Copy-Item -Path "dist/functions/capacityHandler.js" -Destination "lambda-capacity-temp/functions/" -Force
Copy-Item -Path "dist/lib/prisma.js" -Destination "lambda-capacity-temp/lib/" -Force
Copy-Item -Path "dist/lib/response.js" -Destination "lambda-capacity-temp/lib/" -Force
Copy-Item -Path "dist/lib/errors.js" -Destination "lambda-capacity-temp/lib/" -Force
Copy-Item -Path "dist/lib/validators.js" -Destination "lambda-capacity-temp/lib/" -Force
Write-Host "Archivos copiados (solo .js)" -ForegroundColor Green

# Paso 3: Copiar SOLO dependencias esenciales de Prisma
Write-Host "Paso 3: Copiando dependencias Prisma (minimal)..." -ForegroundColor Yellow
$prismaPath = "node_modules/@prisma"
$prismaClientPath = "node_modules/.prisma"

if (Test-Path $prismaPath) {
    Copy-Item -Path $prismaPath -Destination "lambda-capacity-temp/node_modules/" -Recurse -Force
    Write-Host "  @prisma copiado" -ForegroundColor Gray
}

if (Test-Path $prismaClientPath) {
    Copy-Item -Path $prismaClientPath -Destination "lambda-capacity-temp/node_modules/" -Recurse -Force
    Write-Host "  .prisma copiado" -ForegroundColor Gray
}

Write-Host "Dependencias Prisma copiadas" -ForegroundColor Green

# Paso 4: Crear paquete ZIP
Write-Host "Paso 4: Creando paquete ZIP..." -ForegroundColor Yellow
if (Test-Path "lambda-capacity.zip") {
    Remove-Item "lambda-capacity.zip" -Force
}
Compress-Archive -Path "lambda-capacity-temp\*" -DestinationPath "lambda-capacity.zip" -Force
$zipSize = (Get-Item "lambda-capacity.zip").Length / 1MB
Write-Host "Paquete creado: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

if ($zipSize -gt 50) {
    Write-Host "ADVERTENCIA: El paquete es mayor a 50MB" -ForegroundColor Yellow
}

# Paso 5: Desplegar a Lambda
Write-Host "Paso 5: Desplegando a Lambda..." -ForegroundColor Yellow
$functionExists = aws lambda get-function --function-name gestiondemanda_capacityHandler --region eu-west-1 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Actualizando función existente..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name gestiondemanda_capacityHandler `
        --zip-file fileb://lambda-capacity.zip `
        --region eu-west-1 | Out-Null
    
    if ($?) {
        Write-Host "Lambda actualizada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "Error al actualizar Lambda" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Creando nueva función Lambda..." -ForegroundColor Yellow
    
    $roleArn = aws iam get-role --role-name lambda-execution-role --query 'Role.Arn' --output text 2>$null
    if (-not $roleArn) {
        Write-Host "Error: No se encuentra el rol lambda-execution-role" -ForegroundColor Red
        exit 1
    }
    
    aws lambda create-function `
        --function-name gestiondemanda_capacityHandler `
        --runtime nodejs18.x `
        --role $roleArn `
        --handler functions/capacityHandler.handler `
        --zip-file fileb://lambda-capacity.zip `
        --timeout 30 `
        --memory-size 512 `
        --region eu-west-1 `
        --environment "Variables={DATABASE_URL=$env:DATABASE_URL}" | Out-Null
    
    if ($?) {
        Write-Host "Lambda creada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "Error al crear Lambda" -ForegroundColor Red
        exit 1
    }
}

# Paso 6: Verificar
Write-Host "Paso 6: Verificando despliegue..." -ForegroundColor Yellow
$config = aws lambda get-function-configuration `
    --function-name gestiondemanda_capacityHandler `
    --region eu-west-1 2>$null | ConvertFrom-Json

if ($config) {
    Write-Host "Última modificación: $($config.LastModified)" -ForegroundColor Green
    Write-Host "Tamaño del código: $([math]::Round($config.CodeSize / 1MB, 2)) MB" -ForegroundColor Green
    Write-Host "Runtime: $($config.Runtime)" -ForegroundColor Green
    Write-Host "Timeout: $($config.Timeout)s" -ForegroundColor Green
}

# Limpiar archivos temporales
Write-Host "`nLimpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item "lambda-capacity-temp" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SIGUIENTE PASO: Configurar API Gateway" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a API Gateway Console" -ForegroundColor White
Write-Host "2. Selecciona API: gestiondemanda-api" -ForegroundColor White
Write-Host "3. Crea recurso: /capacity" -ForegroundColor White
Write-Host "4. Bajo /capacity, crea: /overview" -ForegroundColor White
Write-Host "5. En /capacity/overview:" -ForegroundColor White
Write-Host "   - Método GET -> Lambda: gestiondemanda_capacityHandler" -ForegroundColor White
Write-Host "   - Habilita Lambda Proxy Integration" -ForegroundColor White
Write-Host "   - Método OPTIONS para CORS" -ForegroundColor White
Write-Host "6. Despliega al stage 'prod'" -ForegroundColor White
Write-Host ""
