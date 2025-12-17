# Script to configure API Gateway endpoint /assignments with CORS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURE API GATEWAY - ASSIGNMENTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$region = "eu-west-1"
$apiName = "gestion-demanda-api"

# Step 1: Get API ID
Write-Host "Step 1: Finding API Gateway..." -ForegroundColor Yellow
$apiId = aws apigateway get-rest-apis --region $region --query "items[?name=='$apiName'].id" --output text

if (-not $apiId) {
    Write-Host "Error: API '$apiName' not found" -ForegroundColor Red
    exit 1
}
Write-Host "API ID found: $apiId" -ForegroundColor Green

# Step 2: Get root resource ID
Write-Host "Step 2: Getting root resource..." -ForegroundColor Yellow
$rootId = aws apigateway get-resources --rest-api-id $apiId --region $region --query "items[?path=='/'].id" --output text
Write-Host "Root ID: $rootId" -ForegroundColor Green

# Step 3: Create or get /assignments resource
Write-Host "Step 3: Configuring /assignments resource..." -ForegroundColor Yellow
$assignmentsId = aws apigateway get-resources --rest-api-id $apiId --region $region --query "items[?path=='/assignments'].id" --output text

if (-not $assignmentsId) {
    Write-Host "Creating /assignments resource..." -ForegroundColor Gray
    $assignmentsResource = aws apigateway create-resource --rest-api-id $apiId --region $region --parent-id $rootId --path-part "assignments" | ConvertFrom-Json
    $assignmentsId = $assignmentsResource.id
    Write-Host "Resource /assignments created: $assignmentsId" -ForegroundColor Green
} else {
    Write-Host "Resource /assignments already exists: $assignmentsId" -ForegroundColor Green
}

# Step 4: Configure GET method
Write-Host "Step 4: Configuring GET method..." -ForegroundColor Yellow
$getExists = aws apigateway get-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method GET 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating GET method..." -ForegroundColor Gray
    
    aws apigateway put-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method GET --authorization-type NONE --request-parameters "method.request.querystring.projectId=false" | Out-Null
    
    $lambdaArn = aws lambda get-function --function-name gestiondemanda_assignmentsHandler --region $region --query 'Configuration.FunctionArn' --output text
    
    $uri = "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    aws apigateway put-integration --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method GET --type AWS_PROXY --integration-http-method POST --uri $uri | Out-Null
    
    $sourceArn = "arn:aws:execute-api:${region}:*:${apiId}/*/GET/assignments"
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    aws lambda add-permission --function-name gestiondemanda_assignmentsHandler --region $region --statement-id "apigateway-assignments-get-$timestamp" --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn 2>$null | Out-Null
    
    Write-Host "GET method configured" -ForegroundColor Green
} else {
    Write-Host "GET method already exists" -ForegroundColor Green
}

# Step 5: Configure POST method
Write-Host "Step 5: Configuring POST method..." -ForegroundColor Yellow
$postExists = aws apigateway get-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method POST 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating POST method..." -ForegroundColor Gray
    
    aws apigateway put-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method POST --authorization-type NONE | Out-Null
    
    $lambdaArn = aws lambda get-function --function-name gestiondemanda_assignmentsHandler --region $region --query 'Configuration.FunctionArn' --output text
    
    $uri = "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    aws apigateway put-integration --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method POST --type AWS_PROXY --integration-http-method POST --uri $uri | Out-Null
    
    $sourceArn = "arn:aws:execute-api:${region}:*:${apiId}/*/POST/assignments"
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    aws lambda add-permission --function-name gestiondemanda_assignmentsHandler --region $region --statement-id "apigateway-assignments-post-$timestamp" --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn 2>$null | Out-Null
    
    Write-Host "POST method configured" -ForegroundColor Green
} else {
    Write-Host "POST method already exists" -ForegroundColor Green
}

# Step 6: Configure PUT method
Write-Host "Step 6: Configuring PUT method..." -ForegroundColor Yellow
$putExists = aws apigateway get-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method PUT 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating PUT method..." -ForegroundColor Gray
    
    aws apigateway put-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method PUT --authorization-type NONE | Out-Null
    
    $lambdaArn = aws lambda get-function --function-name gestiondemanda_assignmentsHandler --region $region --query 'Configuration.FunctionArn' --output text
    
    $uri = "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    aws apigateway put-integration --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method PUT --type AWS_PROXY --integration-http-method POST --uri $uri | Out-Null
    
    $sourceArn = "arn:aws:execute-api:${region}:*:${apiId}/*/PUT/assignments"
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    aws lambda add-permission --function-name gestiondemanda_assignmentsHandler --region $region --statement-id "apigateway-assignments-put-$timestamp" --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn 2>$null | Out-Null
    
    Write-Host "PUT method configured" -ForegroundColor Green
} else {
    Write-Host "PUT method already exists" -ForegroundColor Green
}

# Step 7: Configure DELETE method
Write-Host "Step 7: Configuring DELETE method..." -ForegroundColor Yellow
$deleteExists = aws apigateway get-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method DELETE 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating DELETE method..." -ForegroundColor Gray
    
    aws apigateway put-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method DELETE --authorization-type NONE | Out-Null
    
    $lambdaArn = aws lambda get-function --function-name gestiondemanda_assignmentsHandler --region $region --query 'Configuration.FunctionArn' --output text
    
    $uri = "arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations"
    aws apigateway put-integration --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri $uri | Out-Null
    
    $sourceArn = "arn:aws:execute-api:${region}:*:${apiId}/*/DELETE/assignments"
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    aws lambda add-permission --function-name gestiondemanda_assignmentsHandler --region $region --statement-id "apigateway-assignments-delete-$timestamp" --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn $sourceArn 2>$null | Out-Null
    
    Write-Host "DELETE method configured" -ForegroundColor Green
} else {
    Write-Host "DELETE method already exists" -ForegroundColor Green
}

# Step 8: Configure OPTIONS method for CORS
Write-Host "Step 8: Configuring OPTIONS method (CORS)..." -ForegroundColor Yellow
$optionsExists = aws apigateway get-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method OPTIONS 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating OPTIONS method..." -ForegroundColor Gray
    
    aws apigateway put-method --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method OPTIONS --authorization-type NONE | Out-Null
    
    aws apigateway put-integration --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method OPTIONS --type MOCK --request-templates '{\"application/json\": \"{\\\"statusCode\\\": 200}\"}' | Out-Null
    
    aws apigateway put-method-response --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method OPTIONS --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false" | Out-Null
    
    $corsFile = Join-Path $env:TEMP "cors-headers-assignments.json"
    $corsHeaders = @{
        "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'"
        "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
        "method.response.header.Access-Control-Allow-Origin" = "'*'"
    }
    $corsHeaders | ConvertTo-Json -Compress | Out-File -FilePath $corsFile -Encoding ASCII
    
    aws apigateway put-integration-response --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method OPTIONS --status-code 200 --response-parameters file://$corsFile | Out-Null
    
    Remove-Item $corsFile -Force
    
    Write-Host "OPTIONS method configured" -ForegroundColor Green
} else {
    Write-Host "OPTIONS method already exists, updating..." -ForegroundColor Gray
    
    $corsFile = Join-Path $env:TEMP "cors-headers-assignments.json"
    $corsHeaders = @{
        "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'"
        "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
        "method.response.header.Access-Control-Allow-Origin" = "'*'"
    }
    $corsHeaders | ConvertTo-Json -Compress | Out-File -FilePath $corsFile -Encoding ASCII
    
    aws apigateway put-integration-response --rest-api-id $apiId --region $region --resource-id $assignmentsId --http-method OPTIONS --status-code 200 --response-parameters file://$corsFile | Out-Null
    
    Remove-Item $corsFile -Force
    
    Write-Host "OPTIONS method updated" -ForegroundColor Green
}

# Step 9: Deploy API
Write-Host "Step 9: Deploying API to 'prod' stage..." -ForegroundColor Yellow
aws apigateway create-deployment --rest-api-id $apiId --region $region --stage-name prod --description "Deploy assignments endpoint with CORS support" | Out-Null

Write-Host "API deployed successfully" -ForegroundColor Green

# Step 10: Show endpoint URL
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint configured:" -ForegroundColor Green
$url = "https://$apiId.execute-api.$region.amazonaws.com/prod/assignments"
Write-Host $url -ForegroundColor White
Write-Host ""
Write-Host "Supported methods: GET, POST, PUT, DELETE, OPTIONS" -ForegroundColor Cyan
Write-Host "CORS enabled for all origins" -ForegroundColor Cyan
Write-Host ""
