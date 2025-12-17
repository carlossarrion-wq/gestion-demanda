# Script de despliegue rápido para fix de CORS en /resources

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE FIX CORS /RESOURCES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Descargar código actual de Lambda
Write-Host "Paso 1: Descargando código actual de Lambda..." -ForegroundColor Yellow
aws lambda get-function --function-name gestiondemanda_resourcesHandler --region eu-west-1 --query 'Code.Location' --output text | ForEach-Object {
    Invoke-WebRequest -Uri $_ -OutFile "lambda-current.zip"
}
if ($?) {
    Write-Host "Código descargado" -ForegroundColor Green
} else {
    Write-Host "Error al descargar" -ForegroundColor Red
    exit 1
}

# Paso 2: Extraer paquete
Write-Host "Paso 2: Extrayendo paquete..." -ForegroundColor Yellow
if (Test-Path "lambda-temp") {
    Remove-Item "lambda-temp" -Recurse -Force
}
Expand-Archive -Path "lambda-current.zip" -DestinationPath "lambda-temp" -Force
Write-Host "Paquete extraído" -ForegroundColor Green

# Paso 3: Actualizar solo resourcesHandler.js
Write-Host "Paso 3: Actualizando resourcesHandler.js..." -ForegroundColor Yellow
Copy-Item -Path "dist/functions/resourcesHandler.js" -Destination "lambda-temp/functions/resourcesHandler.js" -Force
Write-Host "Archivo actualizado" -ForegroundColor Green

# Paso 4: Crear nuevo paquete
Write-Host "Paso 4: Creando paquete ZIP..." -ForegroundColor Yellow
if (Test-Path "lambda-cors-fix.zip") {
    Remove-Item "lambda-cors-fix.zip" -Force
}
Compress-Archive -Path "lambda-temp\*" -DestinationPath "lambda-cors-fix.zip" -Force
$zipSize = (Get-Item "lambda-cors-fix.zip").Length / 1MB
Write-Host "Paquete creado: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

# Paso 5: Subir a Lambda
Write-Host "Paso 5: Subiendo a Lambda..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name gestiondemanda_resourcesHandler `
    --zip-file fileb://lambda-cors-fix.zip `
    --region eu-west-1 | Out-Null
if ($?) {
    Write-Host "Lambda actualizada" -ForegroundColor Green
} else {
    Write-Host "Error al actualizar Lambda" -ForegroundColor Red
    exit 1
}

# Paso 6: Verificar
Write-Host "Paso 6: Verificando..." -ForegroundColor Yellow
$lastModified = aws lambda get-function-configuration `
    --function-name gestiondemanda_resourcesHandler `
    --region eu-west-1 `
    --query 'LastModified' `
    --output text
Write-Host "Última modificación: $lastModified" -ForegroundColor Green

# Limpiar archivos temporales
Write-Host "`nLimpiando archivos temporales..." -ForegroundColor Yellow
Remove-Item "lambda-current.zip" -Force -ErrorAction SilentlyContinue
Remove-Item "lambda-temp" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: Ahora debes configurar API Gateway:" -ForegroundColor Yellow
Write-Host "1. Ve a API Gateway Console" -ForegroundColor White
Write-Host "2. Selecciona el recurso /resources" -ForegroundColor White
Write-Host "3. Añade método OPTIONS" -ForegroundColor White
Write-Host "4. Habilita CORS" -ForegroundColor White
Write-Host "5. Despliega al stage 'prod'" -ForegroundColor White
Write-Host ""
Write-Host "Ver instrucciones completas en: INSTRUCCIONES_DESPLIEGUE_RESOURCES.md" -ForegroundColor Cyan
