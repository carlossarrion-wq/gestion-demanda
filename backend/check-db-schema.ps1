# Check Database Schema Script
# This script verifies the actual database schema for the assignments table

Write-Host "Checking database schema for assignments table..." -ForegroundColor Cyan

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "Environment variables loaded from .env" -ForegroundColor Green
} else {
    Write-Host ".env file not found" -ForegroundColor Red
    exit 1
}

# Run the check script
Write-Host ""
Write-Host "Running database schema check..." -ForegroundColor Cyan
node check-db-schema.js

Write-Host ""
Write-Host "Schema check complete." -ForegroundColor Green
