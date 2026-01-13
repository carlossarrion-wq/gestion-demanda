# Script para aplicar migración de Jira
# Lee DATABASE_URL del .env y ejecuta la migración SQL

Write-Host "Aplicando migración de campos de Jira..." -ForegroundColor Cyan

# Leer DATABASE_URL del .env
$envContent = Get-Content .env -Raw
$databaseUrl = ($envContent -match 'DATABASE_URL="([^"]+)"') ? $Matches[1] : $null

if (-not $databaseUrl) {
    Write-Host "Error: No se pudo leer DATABASE_URL del archivo .env" -ForegroundColor Red
    exit 1
}

# Ejecutar migración usando Node.js
$migration = Get-Content prisma/migrations/add_jira_integration.sql -Raw

$nodeScript = @"
const { Client } = require('pg');

const connectionString = '$databaseUrl';

async function runMigration() {
    const client = new Client({ connectionString });
    
    try {
        await client.connect();
        console.log('Conectado a la base de datos');
        
        const migration = ``$migration``;
        
        await client.query(migration);
        console.log('✓ Migración aplicada exitosamente');
        
    } catch (error) {
        console.error('Error aplicando migración:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
"@

# Guardar script temporal
$nodeScript | Out-File -FilePath "temp-migration.js" -Encoding UTF8

# Ejecutar con Node.js
Write-Host "Ejecutando migración..." -ForegroundColor Yellow
node temp-migration.js

# Limpiar
Remove-Item temp-migration.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nRegenerando cliente Prisma..." -ForegroundColor Cyan
    npx prisma generate
    
    Write-Host "`n✓ Migración completada y cliente Prisma regenerado" -ForegroundColor Green
} else {
    Write-Host "`nError: La migración falló" -ForegroundColor Red
    exit 1
}
