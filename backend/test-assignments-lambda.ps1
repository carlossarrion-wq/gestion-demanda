# Test script for assignments Lambda function

Write-Host "Testing assignments Lambda function..." -ForegroundColor Cyan

$payload = @{
    httpMethod = "GET"
    queryStringParameters = @{
        projectId = "b4bdceb2-b29e-443d-8f7e-e3da110d3128"
    }
    headers = @{
        "x-user-team" = "TEAM1"
    }
} | ConvertTo-Json -Compress

$payloadFile = Join-Path $env:TEMP "lambda-test-payload.json"
$payload | Out-File -FilePath $payloadFile -Encoding ASCII

$responseFile = Join-Path $env:TEMP "lambda-test-response.json"

Write-Host "Invoking Lambda function..." -ForegroundColor Yellow
aws lambda invoke --function-name gestiondemanda_assignmentsHandler --region eu-west-1 --payload file://$payloadFile $responseFile

Write-Host ""
Write-Host "Response:" -ForegroundColor Green
Get-Content $responseFile | ConvertFrom-Json | ConvertTo-Json -Depth 10

Remove-Item $payloadFile -Force
Remove-Item $responseFile -Force
