# Deploy Assignments Handler with CORS support
Write-Host "=== Deploying Assignments Handler ===" -ForegroundColor Cyan

# Get script directory and change to it
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found in $scriptDir" -ForegroundColor Red
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$LAMBDA_FUNCTION_NAME = $env:LAMBDA_ASSIGNMENTS_FUNCTION_NAME
if (-not $LAMBDA_FUNCTION_NAME) {
    Write-Host "Error: LAMBDA_ASSIGNMENTS_FUNCTION_NAME not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Compiling TypeScript..." -ForegroundColor Yellow
npx tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: TypeScript compilation failed" -ForegroundColor Red
    exit 1
}
Write-Host "TypeScript compiled successfully" -ForegroundColor Green

Write-Host "Step 2: Creating deployment package..." -ForegroundColor Yellow

# Create temp directory
$tempDir = "lambda-assignments-temp"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy compiled handler (maintain directory structure)
New-Item -ItemType Directory -Path "$tempDir/functions" -Force | Out-Null
Copy-Item -Path "dist/functions/assignmentsHandler.js" -Destination "$tempDir/functions/" -Force

# Copy lib files
New-Item -ItemType Directory -Path "$tempDir/lib" -Force | Out-Null
Copy-Item -Path "dist/lib/*.js" -Destination "$tempDir/lib/" -Force

# Install dependencies
Write-Host "Installing production dependencies..." -ForegroundColor Yellow
npm install --production --prefix $tempDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: npm install failed" -ForegroundColor Red
    exit 1
}

# Copy Prisma client
Copy-Item -Path "node_modules/.prisma" -Destination "$tempDir/node_modules/" -Recurse -Force
Copy-Item -Path "node_modules/@prisma" -Destination "$tempDir/node_modules/" -Recurse -Force

# Create ZIP file
$zipFile = "lambda-assignments.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Write-Host "Creating ZIP package..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir/*" -DestinationPath $zipFile -Force
Write-Host "Deployment package created" -ForegroundColor Green

Write-Host "Step 3: Deploying to AWS Lambda..." -ForegroundColor Yellow
aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file "fileb://$zipFile" --region eu-west-1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Lambda deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "Lambda function updated successfully" -ForegroundColor Green

# Wait for update
Write-Host "Waiting for Lambda update to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Cleanup
Write-Host "Step 4: Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $tempDir
Write-Host "Cleanup completed" -ForegroundColor Green

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Lambda Function: $LAMBDA_FUNCTION_NAME" -ForegroundColor Cyan
Write-Host "Region: eu-west-1" -ForegroundColor Cyan
Write-Host "The assignments endpoint now supports CORS" -ForegroundColor Green
