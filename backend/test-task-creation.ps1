# Test script to invoke assignments Lambda with task creation payload

$payload = @{
    httpMethod = "POST"
    path = "/assignments"
    body = @{
        projectId = "bd55d3c5-3243-4760-bb9c-26fd998934d4"
        title = "qwqwqqw"
        description = "qwqqqw"
        skillName = "Diseño"
        resourceId = $null
        month = 12
        year = 2025
        hours = 8
    } | ConvertTo-Json -Compress
} | ConvertTo-Json -Compress

Write-Host "Testing task creation with payload:" -ForegroundColor Cyan
Write-Host $payload -ForegroundColor Yellow

$payload | Out-File -FilePath "test-payload.json" -Encoding ASCII -NoNewline

Write-Host "`nInvoking Lambda function..." -ForegroundColor Cyan

aws lambda invoke `
    --function-name gestiondemanda_assignmentsHandler `
    --payload file://test-payload.json `
    --region eu-west-1 `
    response.json

Write-Host "`nLambda Response:" -ForegroundColor Cyan
Get-Content response.json | Write-Host -ForegroundColor Yellow

Remove-Item "test-payload.json" -ErrorAction SilentlyContinue
Remove-Item "response.json" -ErrorAction SilentlyContinue
