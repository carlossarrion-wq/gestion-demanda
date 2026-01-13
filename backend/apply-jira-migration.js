const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL no encontrada en .env');
        process.exit(1);
    }

    const client = new Client({ 
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        console.log('📡 Conectando a la base de datos...');
        await client.connect();
        console.log('✓ Conectado a la base de datos');
        
        const migration = fs.readFileSync(
            path.join(__dirname, 'prisma/migrations/add_jira_integration.sql'),
            'utf8'
        );
        
        console.log('⚙️  Aplicando migración de Jira...');
        await client.query(migration);
        console.log('✓ Migración aplicada exitosamente');
        
    } catch (error) {
        console.error('❌ Error aplicando migración:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
