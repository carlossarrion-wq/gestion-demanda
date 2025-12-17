# Fresh Deployment Script for Assignments Handler
# This script ensures a completely fresh Prisma client is generated and deployed

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fresh Deployment - Assignments Handler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean all Prisma artifacts
Write-Host "Step 1: Cleaning all Prisma artifacts..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma"
    Write-Host "  Removed node_modules\.prisma" -ForegroundColor Green
}
if (Test-Path "node_modules\@prisma\client") {
    Remove-Item -Recurse -Force "node_modules\@prisma\client"
    Write-Host "  Removed node_modules\@prisma\client" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "  Removed dist folder" -ForegroundColor Green
}
if (Test-Path "lambda-assignments-temp") {
    Remove-Item -Recurse -Force "lambda-assignments-temp"
    Write-Host "  Removed lambda-assignments-temp folder" -ForegroundColor Green
}
if (Test-Path "lambda-assignments.zip") {
    Remove-Item -Force "lambda-assignments.zip"
    Write-Host "  Removed old lambda-assignments.zip" -ForegroundColor Green
}
Write-Host ""

# Step 2: Generate fresh Prisma client
Write-Host "Step 2: Generating fresh Prisma client from current schema..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error generating Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "  Prisma client generated successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Compile TypeScript
Write-Host "Step 3: Compiling TypeScript..." -ForegroundColor Yellow
npx tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error compiling TypeScript" -ForegroundColor Red
    exit 1
}
Write-Host "  TypeScript compiled successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Create deployment package
Write-Host "Step 4: Creating deployment package..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "lambda-assignments-temp" | Out-Null
New-Item -ItemType Directory -Force -Path "lambda-assignments-temp/functions" | Out-Null
New-Item -ItemType Directory -Force -Path "lambda-assignments-temp/lib" | Out-Null

# Copy compiled JavaScript files
Copy-Item "dist/functions/assignmentsHandler.js" "lambda-assignments-temp/functions/"
Copy-Item "dist/lib/*.js" "lambda-assignments-temp/lib/"
Write-Host "  Copied compiled files" -ForegroundColor Green

# Copy package.json for production dependencies
Copy-Item "package.json" "lambda-assignments-temp/"
Write-Host "  Copied package.json" -ForegroundColor Green
Write-Host ""

# Step 5: Install production dependencies
Write-Host "Step 5: Installing production dependencies..." -ForegroundColor Yellow
Push-Location "lambda-assignments-temp"
npm install --production --no-package-lock
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "Error installing dependencies" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "  Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 6: Copy fresh Prisma client
Write-Host "Step 6: Copying fresh Prisma client to deployment package..." -ForegroundColor Yellow
Copy-Item -Recurse "../node_modules/.prisma" "lambda-assignments-temp/node_modules/"
Copy-Item -Recurse "../node_modules/@prisma/client" "lambda-assignments-temp/node_modules/@prisma/"
Write-Host "  Prisma client copied" -ForegroundColor Green
Write-Host ""

# Step 7: Create ZIP file
Write-Host "Step 7: Creating ZIP file..." -ForegroundColor Yellow
Push-Location "lambda-assignments-temp"
Compress-Archive -Path * -DestinationPath "../lambda-assignments.zip" -Force
Pop-Location
Write-Host "  ZIP file created" -ForegroundColor Green
Write-Host ""

# Step 8: Upload to Lambda
Write-Host "Step 8: Uploading to Lambda..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name gestiondemanda_assignmentsHandler `
    --zip-file fileb://lambda-assignments.zip `
    --region eu-west-1 `
    --output json | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error uploading to Lambda" -ForegroundColor Red
    exit 1
}
Write-Host "  Lambda function updated" -ForegroundColor Green
Write-Host ""

# Step 9: Wait for update to complete
Write-Host "Step 9: Waiting for Lambda update to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "  Update complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The Lambda function now has a fresh Prisma client generated from the current schema." -ForegroundColor Cyan
Write-Host "You can now test task creation." -ForegroundColor Cyan
