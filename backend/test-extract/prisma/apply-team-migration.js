// Script para aplicar la migración de team a resources sin perder datos
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Iniciando migración de campo team en tabla resources...');
    
    console.log('📝 Ejecutando migración SQL paso a paso...');
    
    // Paso 1: Agregar columna team
    console.log('\n[1/4] Agregando columna team...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE resources ADD COLUMN team VARCHAR(50)`);
      console.log('✅ Columna team agregada');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
        console.log('⚠️  Columna team ya existe');
      } else {
        throw error;
      }
    }
    
    // Paso 2: Crear índice
    console.log('\n[2/4] Creando índice en columna team...');
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX idx_resources_team ON resources(team)`);
      console.log('✅ Índice creado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Índice ya existe');
      } else {
        throw error;
      }
    }
    
    // Paso 3: Actualizar recursos existentes con distribución equitativa
    console.log('\n[3/4] Distribuyendo recursos entre los 4 equipos...');
    try {
      await prisma.$executeRawUnsafe(`
        WITH numbered_resources AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
          FROM resources
        )
        UPDATE resources r
        SET team = CASE 
          WHEN nr.rn % 4 = 1 THEN 'darwin'
          WHEN nr.rn % 4 = 2 THEN 'mulesoft'
          WHEN nr.rn % 4 = 3 THEN 'sap'
          ELSE 'saplcorp'
        END
        FROM numbered_resources nr
        WHERE r.id = nr.id
      `);
      console.log('✅ Recursos distribuidos entre equipos');
    } catch (error) {
      console.error('⚠️  Error al distribuir recursos:', error.message);
      throw error;
    }
    
    // Paso 4: Establecer NOT NULL constraint
    console.log('\n[4/4] Estableciendo constraint NOT NULL...');
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE resources ALTER COLUMN team SET NOT NULL`);
      console.log('✅ Constraint NOT NULL establecido');
    } catch (error) {
      if (error.message.includes('already') || error.message.includes('not-null constraint')) {
        console.log('⚠️  Constraint ya existe');
      } else {
        throw error;
      }
    }
    
    // Verificar que la migración se aplicó correctamente
    console.log('\n🔍 Verificando migración...');
    const resources = await prisma.$queryRaw`
      SELECT id, code, name, team 
      FROM resources 
      LIMIT 5
    `;
    
    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n📊 Muestra de recursos con team asignado:');
    console.table(resources);
    
    // Contar recursos por team
    const teamCounts = await prisma.$queryRaw`
      SELECT team, COUNT(*) as count
      FROM resources
      GROUP BY team
      ORDER BY team
    `;
    
    console.log('\n📈 Distribución de recursos por equipo:');
    console.table(teamCounts);
    
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
applyMigration()
  .then(() => {
    console.log('\n✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
