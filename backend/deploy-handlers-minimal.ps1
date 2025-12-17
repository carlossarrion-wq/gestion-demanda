# Script de despliegue mínimo para Lambda handlers actualizados
# Solo empaqueta los archivos esenciales para reducir el tamaño

Write-Host "=== Despliegue Mínimo de Lambda Handlers ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe la carpeta dist
if (-not (Test-Path "dist")) {
    Write-Host "ERROR: La carpeta 'dist' no existe. Ejecuta 'npm run build' primero." -ForegroundColor Red
    exit 1
}

# Crear carpeta temporal para el paquete
$tempDir = "lambda-handlers-temp"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "1. Copiando archivos compilados..." -ForegroundColor Yellow

# Copiar solo los archivos compilados necesarios
Copy-Item -Path "dist/functions" -Destination "$tempDir/functions" -Recurse
Copy-Item -Path "dist/lib" -Destination "$tempDir/lib" -Recurse

Write-Host "2. Copiando dependencias mínimas..." -ForegroundColor Yellow

# Copiar solo node_modules esenciales (Prisma y AWS SDK)
New-Item -ItemType Directory -Path "$tempDir/node_modules" | Out-Null
New-Item -ItemType Directory -Path "$tempDir/node_modules/@prisma" | Out-Null
New-Item -ItemType Directory -Path "$tempDir/node_modules/.prisma" | Out-Null

Copy-Item -Path "node_modules/@prisma/client" -Destination "$tempDir/node_modules/@prisma/client" -Recurse
Copy-Item -Path "node_modules/.prisma/client" -Destination "$tempDir/node_modules/.prisma/client" -Recurse

# Copiar package.json (solo para referencia)
Copy-Item -Path "package.json" -Destination "$tempDir/package.json"

Write-Host "3. Creando archivo ZIP..." -ForegroundColor Yellow

# Crear ZIP
$zipFile = "lambda-handlers-minimal.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile
}

Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile

# Limpiar carpeta temporal
Remove-Item -Recurse -Force $tempDir

$zipSize = (Get-Item $zipFile).Length / 1MB
Write-Host "   Tamaño del paquete: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green

Write-Host ""
Write-Host "=== Actualizando funciones Lambda ===" -ForegroundColor Cyan
Write-Host ""

# Lista de funciones a actualizar
$functions = @(
    "gestiondemanda_assignmentsHandler",
    "gestiondemanda_capacityHandler",
    "gestiondemanda_projectsHandler",
    "gestiondemanda_resourcesHandler"
)

foreach ($functionName in $functions) {
    Write-Host "Actualizando $functionName..." -ForegroundColor Yellow
    
    try {
        $result = aws lambda update-function-code --function-name $functionName --zip-file "fileb://$zipFile" --region eu-west-1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   OK $functionName actualizado correctamente" -ForegroundColor Green
        } else {
            Write-Host "   ERROR actualizando $functionName" -ForegroundColor Red
            Write-Host "   $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "   ERROR actualizando $functionName" -ForegroundColor Red
        Write-Host "   $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Despliegue completado ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: Verifica que las funciones Lambda tengan configurada la variable de entorno:" -ForegroundColor Yellow
Write-Host "  DATABASE_URL=<tu-connection-string>" -ForegroundColor White
Write-Host ""
Write-Host "Para probar los endpoints, usa la API Gateway configurada." -ForegroundColor Yellow
