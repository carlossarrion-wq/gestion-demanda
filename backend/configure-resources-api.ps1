# Script to configure CORS for Resources API Gateway endpoint
# This enables the frontend to call the /resources endpoint

$ErrorActionPreference = "Stop"

Write-Host "=== Configuring CORS for Resources API Gateway ===" -ForegroundColor Cyan

# Configuration
$API_ID = "xrqo2gedpl"
$REGION = "eu-west-1"
$RESOURCE_PATH = "/resources"

Write-Host "`nStep 1: Finding Resources resource..." -ForegroundColor Yellow

# Get all resources
$resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION | ConvertFrom-Json

# Find the /resources resource
$resourcesResource = $resources.items | Where-Object { $_.path -eq $RESOURCE_PATH }

if (-not $resourcesResource) {
    Write-Host "ERROR: /resources resource not found!" -ForegroundColor Red
    exit 1
}

$RESOURCE_ID = $resourcesResource.id
Write-Host "Found /resources resource with ID: $RESOURCE_ID" -ForegroundColor Green

Write-Host "`nStep 2: Creating OPTIONS method for CORS preflight..." -ForegroundColor Yellow

# Try to delete existing OPTIONS method if it exists (ignore errors)
try {
    aws apigateway delete-method --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS --region $REGION 2>$null
    Write-Host "Deleted existing OPTIONS method" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} catch {
    Write-Host "No existing OPTIONS method to delete" -ForegroundColor Gray
}

# Create OPTIONS method
aws apigateway put-method `
    --rest-api-id $API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --authorization-type NONE `
    --region $REGION

Write-Host "OPTIONS method created" -ForegroundColor Green

Write-Host "`nStep 3: Setting up MOCK integration for OPTIONS..." -ForegroundColor Yellow

# Create temporary JSON file for request templates
$requestTemplatesJson = @'
{"application/json":"{\"statusCode\":200}"}
'@
$requestTemplatesJson | Out-File -FilePath "temp-request-templates.json" -Encoding ASCII -NoNewline

aws apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --type MOCK `
    --request-templates file://temp-request-templates.json `
    --region $REGION

Remove-Item "temp-request-templates.json" -ErrorAction SilentlyContinue

Write-Host "MOCK integration configured" -ForegroundColor Green

Write-Host "`nStep 4: Configuring OPTIONS method response..." -ForegroundColor Yellow

# Create temporary JSON file for method response parameters
$methodResponseJson = @'
{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}
'@
$methodResponseJson | Out-File -FilePath "temp-method-response.json" -Encoding ASCII -NoNewline

aws apigateway put-method-response `
    --rest-api-id $API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters file://temp-method-response.json `
    --region $REGION

Remove-Item "temp-method-response.json" -ErrorAction SilentlyContinue

Write-Host "Method response configured" -ForegroundColor Green

Write-Host "`nStep 5: Configuring OPTIONS integration response with CORS headers..." -ForegroundColor Yellow

# Create temporary JSON file for integration response parameters
$integrationResponseJson = @'
{"method.response.header.Access-Control-Allow-Headers":"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team'","method.response.header.Access-Control-Allow-Methods":"'GET,POST,PUT,DELETE,OPTIONS'","method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
$integrationResponseJson | Out-File -FilePath "temp-integration-response.json" -Encoding ASCII -NoNewline

aws apigateway put-integration-response `
    --rest-api-id $API_ID `
    --resource-id $RESOURCE_ID `
    --http-method OPTIONS `
    --status-code 200 `
    --response-parameters file://temp-integration-response.json `
    --region $REGION

Remove-Item "temp-integration-response.json" -ErrorAction SilentlyContinue

Write-Host "Integration response configured with CORS headers" -ForegroundColor Green

Write-Host "`nStep 6: Updating GET method response to include CORS headers..." -ForegroundColor Yellow

# Delete existing method response if it exists
try {
    aws apigateway delete-method-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --status-code 200 --region $REGION 2>$null
    Write-Host "Deleted existing GET method response" -ForegroundColor Yellow
} catch {
    Write-Host "No existing GET method response to delete" -ForegroundColor Gray
}

# Create temporary JSON file for GET method response parameters
$getMethodResponseJson = @'
{"method.response.header.Access-Control-Allow-Origin":false}
'@
$getMethodResponseJson | Out-File -FilePath "temp-get-method-response.json" -Encoding ASCII -NoNewline

aws apigateway put-method-response `
    --rest-api-id $API_ID `
    --resource-id $RESOURCE_ID `
    --http-method GET `
    --status-code 200 `
    --response-parameters file://temp-get-method-response.json `
    --region $REGION

Remove-Item "temp-get-method-response.json" -ErrorAction SilentlyContinue

Write-Host "GET method response updated" -ForegroundColor Green

Write-Host "`nStep 7: Updating GET integration response to include CORS headers..." -ForegroundColor Yellow

# Delete existing integration response
try {
    aws apigateway delete-integration-response --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method GET --status-code 200 --region $REGION 2>$null
    Write-Host "Deleted existing GET integration response" -ForegroundColor Yellow
} catch {
    Write-Host "No existing GET integration response to delete" -ForegroundColor Gray
}

# Create temporary JSON file for GET integration response parameters
$getIntegrationResponseJson = @'
{"method.response.header.Access-Control-Allow-Origin":"'*'"}
'@
$getIntegrationResponseJson | Out-File -FilePath "temp-get-integration-response.json" -Encoding ASCII -NoNewline

aws apigateway put-integration-response `
    --rest-api-id $API_ID `
    --resource-id $RESOURCE_ID `
    --http-method GET `
    --status-code 200 `
    --response-parameters file://temp-get-integration-response.json `
    --region $REGION

Remove-Item "temp-get-integration-response.json" -ErrorAction SilentlyContinue

Write-Host "GET integration response updated" -ForegroundColor Green

Write-Host "`nStep 8: Deploying changes to prod stage..." -ForegroundColor Yellow

aws apigateway create-deployment `
    --rest-api-id $API_ID `
    --stage-name prod `
    --description "Enable CORS for /resources endpoint" `
    --region $REGION

Write-Host "Deployment completed!" -ForegroundColor Green

Write-Host "`n=== CORS Configuration Complete ===" -ForegroundColor Cyan
Write-Host "The /resources endpoint now supports CORS" -ForegroundColor Green
Write-Host "You can now test the skill dropdown in the task modal" -ForegroundColor Green
