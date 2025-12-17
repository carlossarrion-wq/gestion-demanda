# Script para configurar API Gateway endpoint /capacity/overview con CORS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR API GATEWAY - CAPACITY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$region = "eu-west-1"
$apiName = "gestion-demanda-api"

# Paso 1: Obtener API ID
Write-Host "Paso 1: Buscando API Gateway..." -ForegroundColor Yellow
$apiId = aws apigateway get-rest-apis --region $region --query "items[?name=='$apiName'].id" --output text

if (-not $apiId) {
    Write-Host "Error: No se encontro la API '$apiName'" -ForegroundColor Red
    exit 1
}
Write-Host "API ID encontrado: $apiId" -ForegroundColor Green

# Paso 2: Obtener root resource ID
Write-Host "Paso 2: Obteniendo root resource..." -ForegroundColor Yellow
$rootId = aws apigateway get-resources --rest-api-id $apiId --region $region --query "items[?path=='/'].id" --output text
Write-Host "Root ID: $rootId" -ForegroundColor Green

# Paso 3: Crear o obtener recurso /capacity
Write-Host "Paso 3: Configurando recurso /capacity..." -ForegroundColor Yellow
$capacityId = aws apigateway get-resources --rest-api-id $apiId --region $region --query "items[?path=='/capacity'].id" --output text

if (-not $capacityId) {
    Write-Host "Creando recurso /capacity..." -ForegroundColor Gray
    $capacityResource = aws apigateway create-resource --rest-api-id $apiId --region $region --parent-id $rootId --path-part "capacity" | ConvertFrom-Json
    $capacityId = $capacityResource.id
    Write-Host "Recurso /capacity creado: $capacityId" -ForegroundColor Green
} else {
    Write-Host "Recurso /capacity ya existe: $capacityId" -ForegroundColor Green
}

# Paso 4: Crear o obtener recurso /overview
Write-Host "Paso 4: Configurando recurso /overview..." -ForegroundColor Yellow
$overviewId = aws apigateway get-resources --rest-api-id $apiId --region $region --query "items[?path=='/capacity/overview'].id" --output text

if (-not $overviewId) {
    Write-Host "Creando recurso /overview..." -ForegroundColor Gray
    $overviewResource = aws apigateway create-resource --rest-api-id $apiId --region $region --parent-id $capacityId --path-part "overview" | ConvertFrom-Json
    $overviewId = $overviewResource.id
    Write-Host "Recurso /overview creado: $overviewId" -ForegroundColor Green
} else {
    Write-Host "Recurso /overview ya existe: $overviewId" -ForegroundColor Green
}

# Paso 5: Configurar metodo GET
Write-Host "Paso 5: Configurando metodo GET..." -ForegroundColor Yellow
$getExists = aws apigateway get-method --rest-api-id $apiId --region $region --resource-id $overviewId --http-method GET 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creando metodo GET..." -ForegroundColor Gray
    
    aws apigateway put-method --rest-api-id $apiId --region $region --resource-id $overviewId --http-method GET --authorization-type NONE --request-parameters "method.request.header.x-user-team=false" | Out-Null
    
    $lambdaArn = aws lambda get-function --function-name gestiondemanda_capacityHandler --region $region --query 'Configuration.FunctionArn' --output text
    
    $uri = "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    aws apigateway put-integration --rest-api-id $apiId --region $region --resource-id $overviewId --http-method GET --type AWS_PROXY --integration-http-method POST --uri $uri | Out-Null
    
    $sourceArn = "arn:aws:execute-api:${region}:*:${apiId}/*/GET/capacity/overview"
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    aws lambda add-permission --function-name gestiondemanda_capacityHandler --region $region --statement-id "apigateway-capacity-get-$timestamp" --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn 2>$null | Out-Null
    
    Write-Host "Metodo GET configurado" -ForegroundColor Green
} else {
    Write-Host "Metodo GET ya existe" -ForegroundColor Green
}

# Paso 6: Configurar metodo OPTIONS para CORS
Write-Host "Paso 6: Configurando metodo OPTIONS (CORS)..." -ForegroundColor Yellow
$optionsExists = aws apigateway get-method --rest-api-id $apiId --region $region --resource-id $overviewId --http-method OPTIONS 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creando metodo OPTIONS..." -ForegroundColor Gray
    
    aws apigateway put-method --rest-api-id $apiId --region $region --resource-id $overviewId --http-method OPTIONS --authorization-type NONE | Out-Null
    
    aws apigateway put-integration --rest-api-id $apiId --region $region --resource-id $overviewId --http-method OPTIONS --type MOCK --request-templates '{\"application/json\": \"{\\\"statusCode\\\": 200}\"}' | Out-Null
    
    aws apigateway put-method-response --rest-api-id $apiId --region $region --resource-id $overviewId --http-method OPTIONS --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" | Out-Null
    
    $corsFile = Join-Path $env:TEMP "cors-headers.json"
    $corsHeaders = @{
        "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'"
        "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
        "method.response.header.Access-Control-Allow-Origin" = "'*'"
    }
    $corsHeaders | ConvertTo-Json -Compress | Out-File -FilePath $corsFile -Encoding ASCII
    
    aws apigateway put-integration-response --rest-api-id $apiId --region $region --resource-id $overviewId --http-method OPTIONS --status-code 200 --response-parameters file://$corsFile | Out-Null
    
    Remove-Item $corsFile -Force
    
    Write-Host "Metodo OPTIONS configurado" -ForegroundColor Green
} else {
    Write-Host "Metodo OPTIONS ya existe, actualizando..." -ForegroundColor Gray
    
    $corsFile = Join-Path $env:TEMP "cors-headers.json"
    $corsHeaders = @{
        "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'"
        "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
        "method.response.header.Access-Control-Allow-Origin" = "'*'"
    }
    $corsHeaders | ConvertTo-Json -Compress | Out-File -FilePath $corsFile -Encoding ASCII
    
    aws apigateway put-integration-response --rest-api-id $apiId --region $region --resource-id $overviewId --http-method OPTIONS --status-code 200 --response-parameters file://$corsFile | Out-Null
    
    Remove-Item $corsFile -Force
    
    Write-Host "Metodo OPTIONS actualizado" -ForegroundColor Green
}

# Paso 7: Desplegar API
Write-Host "Paso 7: Desplegando API al stage 'prod'..." -ForegroundColor Yellow
aws apigateway create-deployment --rest-api-id $apiId --region $region --stage-name prod --description "Deploy capacity endpoint with CORS fix" | Out-Null

Write-Host "API desplegada exitosamente" -ForegroundColor Green

# Paso 8: Mostrar URL del endpoint
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACION COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint configurado:" -ForegroundColor Green
$url = "https://$apiId.execute-api.$region.amazonaws.com/prod/capacity/overview"
Write-Host $url -ForegroundColor White
Write-Host ""
