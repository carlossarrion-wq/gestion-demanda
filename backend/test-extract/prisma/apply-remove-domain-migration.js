/**
 * Script para aplicar la migración que elimina el campo domain_name de assignments
 * 
 * Este script:
 * 1. Lee las credenciales de la base de datos desde .env
 * 2. Ejecuta el SQL de migración para eliminar domain_name
 * 3. Regenera el cliente Prisma con el nuevo schema
 * 
 * Uso: node prisma/apply-remove-domain-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

async function applyMigration() {
  console.log('🚀 Iniciando migración para eliminar domain_name de assignments...\n');

  // Verificar que existe DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no está definida en el archivo .env');
    process.exit(1);
  }

  // Crear cliente de PostgreSQL con SSL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necesario para RDS
    }
  });

  try {
    // Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conexión establecida\n');

    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, 'migrations', 'remove_domain_from_assignments.sql');
    console.log(`📄 Leyendo migración desde: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`No se encontró el archivo de migración: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Archivo de migración leído correctamente\n');

    // Verificar si la columna domain_name existe antes de eliminarla
    console.log('🔍 Verificando si la columna domain_name existe...');
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assignments' 
      AND column_name = 'domain_name';
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('ℹ️  La columna domain_name ya no existe en la tabla assignments');
      console.log('✅ No se requiere migración\n');
    } else {
      console.log('✅ La columna domain_name existe, procediendo con la eliminación...\n');

      // Ejecutar la migración
      console.log('🔧 Ejecutando migración SQL...');
      await client.query(migrationSQL);
      console.log('✅ Migración SQL ejecutada correctamente\n');
    }

    // Verificar el resultado
    console.log('🔍 Verificando estructura final de la tabla assignments...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'assignments'
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(verifyQuery);
    console.log('\n📋 Columnas actuales en la tabla assignments:');
    console.table(result.rows);

    // Verificar que domain_name ya no existe
    const hasDomainName = result.rows.some(row => row.column_name === 'domain_name');
    if (hasDomainName) {
      throw new Error('❌ ERROR: La columna domain_name todavía existe después de la migración');
    }

    console.log('\n✅ Verificación exitosa: domain_name ha sido eliminado\n');

    // Regenerar el cliente Prisma
    console.log('🔄 Regenerando cliente Prisma...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Cliente Prisma regenerado correctamente\n');
    } catch (error) {
      console.error('⚠️  Advertencia: Error al regenerar cliente Prisma:', error.message);
      console.log('   Ejecuta manualmente: npx prisma generate\n');
    }

    console.log('🎉 ¡Migración completada exitosamente!\n');
    console.log('📝 Resumen:');
    console.log('   - Campo domain_name eliminado de assignments');
    console.log('   - Índice idx_assignments_domain_name eliminado');
    console.log('   - Cliente Prisma actualizado');
    console.log('\n⚠️  IMPORTANTE: Recuerda redesplegar la función Lambda de assignments');
    console.log('   Ejecuta: .\\deploy-assignments.ps1\n');

  } catch (error) {
    console.error('\n❌ ERROR durante la migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cerrar conexión
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar migración
applyMigration();
