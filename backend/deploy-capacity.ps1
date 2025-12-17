# Script de despliegue para capacityHandler Lambda

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE CAPACITY HANDLER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el código está compilado
if (-not (Test-Path "dist/functions/capacityHandler.js")) {
    Write-Host "Error: No se encuentra dist/functions/capacityHandler.js" -ForegroundColor Red
    Write-Host "Ejecuta 'npm run build' primero" -ForegroundColor Yellow
    exit 1
}

# Paso 1: Crear estructura de paquete
Write-Host "Paso 1: Creando estructura de paquete..." -ForegroundColor Yellow
if (Test-Path "lambda-capacity-temp") {
    Remove-Item "lambda-capacity-temp" -Recurse -Force
}
New-Item -ItemType Directory -Path "lambda-capacity-temp" -Force | Out-Null
New-Item -ItemType Directory -Path "lambda-capacity-temp/functions" -Force | Out-Null
New-Item -ItemType Directory -Path "lambda-capacity-temp/lib" -Force | Out-Null
Write-Host "Estructura creada" -ForegroundColor Green

# Paso 2: Copiar archivos compilados
Write-Host "Paso 2: Copiando archivos compilados..." -ForegroundColor Yellow
Copy-Item -Path "dist/functions/capacityHandler.js" -Destination "lambda-capacity-temp/functions/" -Force
Copy-Item -Path "dist/lib/*.js" -Destination "lambda-capacity-temp/lib/" -Force
Write-Host "Archivos copiados" -ForegroundColor Green

# Paso 3: Copiar node_modules necesarios
Write-Host "Paso 3: Copiando dependencias..." -ForegroundColor Yellow
Copy-Item -Path "node_modules" -Destination "lambda-capacity-temp/" -Recurse -Force
Write-Host "Dependencias copiadas" -ForegroundColor Green

# Paso 4: Crear paquete ZIP
Write-Host "Paso 4: Creando paquete ZIP..." -ForegroundColor Yellow
if (Test-Path "lambda-capacity.zip") {
    Remove-Item "lambda-capacity.zip" -Force
}
Compress-Archive -Path "lambda-capacity-temp\*" -DestinationPath "lambda-capacity.zip" -Force
$zipSize = (Get-Item "lambda-capacity.zip").Length / 1MB
Write-Host "Paquete creado: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

# Paso 5: Verificar si la función Lambda existe
Write-Host "Paso 5: Verificando función Lambda..." -ForegroundColor Yellow
$functionExists = aws lambda get-function --function-name gestiondemanda_capacityHandler --region eu-west-1 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Función existe, actualizando código..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name gestiondemanda_capacityHandler `
        --zip-file fileb://lambda-capacity.zip `
        --region eu-west-1 | Out-Null
    if ($?) {
        Write-Host "Lambda actualizada" -ForegroundColor Green
    } else {
        Write-Host "Error al actualizar Lambda" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Función no existe, creando nueva..." -ForegroundColor Yellow
    
    # Obtener el ARN del rol de ejecución (usar el mismo que otros handlers)
    $roleArn = aws iam get-role --role-name lambda-execution-role --query 'Role.Arn' --output text 2>$null
    if (-not $roleArn) {
        Write-Host "Error: No se encuentra el rol lambda-execution-role" -ForegroundColor Red
        Write-Host "Debes crear el rol primero o especificar uno existente" -ForegroundColor Yellow
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
        Write-Host "Lambda creada" -ForegroundColor Green
    } else {
        Write-Host "Error al crear Lambda" -ForegroundColor Red
        exit 1
    }
}

# Paso 6: Verificar
Write-Host "Paso 6: Verificando..." -ForegroundColor Yellow
$lastModified = aws lambda get-function-configuration `
    --function-name gestiondemanda_capacityHandler `
    --region eu-west-1 `
    --query 'LastModified' `
    --output text
Write-Host "Última modificación: $lastModified" -ForegroundColor Green

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
Write-Host "1. Ve a API Gateway Console (https://console.aws.amazon.com/apigateway)" -ForegroundColor White
Write-Host "2. Selecciona tu API (gestiondemanda-api)" -ForegroundColor White
Write-Host "3. Crea un nuevo recurso '/capacity'" -ForegroundColor White
Write-Host "4. Bajo /capacity, crea un recurso '/overview'" -ForegroundColor White
Write-Host "5. Para /capacity/overview:" -ForegroundColor White
Write-Host "   - Añade método GET" -ForegroundColor White
Write-Host "   - Tipo de integración: Lambda Function" -ForegroundColor White
Write-Host "   - Función: gestiondemanda_capacityHandler" -ForegroundColor White
Write-Host "   - Habilita 'Use Lambda Proxy integration'" -ForegroundColor White
Write-Host "6. Añade método OPTIONS para CORS" -ForegroundColor White
Write-Host "7. Despliega al stage 'prod'" -ForegroundColor White
Write-Host ""
Write-Host "Archivo ZIP guardado en: lambda-capacity.zip" -ForegroundColor Cyan
