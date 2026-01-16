/**
 * Script to apply the skills migration
 * This script migrates data from skills table to resource_skills and assignments tables
 * Then removes the skills table entirely
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'migrate_skills_to_resource_skills.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📋 Migration SQL loaded');
    console.log('⚠️  This migration will:');
    console.log('   1. Migrate skill_id to skill_name in resource_skills table');
    console.log('   2. Migrate skill_id to skill_name in assignments table');
    console.log('   3. Migrate skill_id to skill_name in project_skill_breakdown table');
    console.log('   4. Add new columns to assignments: title, description, domain_name');
    console.log('   5. Make assignments.resource_id nullable');
    console.log('   6. Drop the skills table completely');
    console.log('   7. Update all constraints and indexes\n');

    // Check if skills table exists
    const checkSkillsTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'skills'
      );
    `);

    if (!checkSkillsTable.rows[0].exists) {
      console.log('⚠️  Skills table does not exist. Migration may have already been applied.');
      console.log('   Checking schema state...\n');
      
      // Check if resource_skills has skill_name column
      const checkSkillName = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'resource_skills' 
        AND column_name = 'skill_name';
      `);
      
      if (checkSkillName.rows.length > 0) {
        console.log('✅ Migration appears to have been applied already.');
        console.log('   resource_skills table has skill_name column.');
        return;
      }
    }

    // Count records that will be affected
    console.log('📊 Checking data to be migrated...');
    
    const skillsCount = await client.query('SELECT COUNT(*) FROM skills');
    console.log(`   - Skills table: ${skillsCount.rows[0].count} records`);
    
    const resourceSkillsCount = await client.query('SELECT COUNT(*) FROM resource_skills');
    console.log(`   - Resource skills: ${resourceSkillsCount.rows[0].count} records`);
    
    const assignmentsCount = await client.query('SELECT COUNT(*) FROM assignments');
    console.log(`   - Assignments: ${assignmentsCount.rows[0].count} records`);
    
    const psbCount = await client.query('SELECT COUNT(*) FROM project_skill_breakdown');
    console.log(`   - Project skill breakdown: ${psbCount.rows[0].count} records\n`);

    // Execute migration in a transaction
    console.log('🚀 Starting migration...\n');
    await client.query('BEGIN');

    try {
      // Execute the migration SQL
      await client.query(migrationSQL);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('✅ Migration completed successfully!\n');

      // Verify the changes
      console.log('🔍 Verifying migration...');
      
      const verifyResourceSkills = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'resource_skills' 
        AND column_name IN ('skill_id', 'skill_name')
        ORDER BY column_name;
      `);
      console.log('   Resource skills columns:', verifyResourceSkills.rows.map(r => r.column_name).join(', '));
      
      const verifyAssignments = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'assignments' 
        AND column_name IN ('skill_id', 'skill_name', 'title', 'description', 'domain_name')
        ORDER BY column_name;
      `);
      console.log('   Assignments columns:', verifyAssignments.rows.map(r => r.column_name).join(', '));
      
      const verifySkillsTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'skills'
        );
      `);
      console.log('   Skills table exists:', verifySkillsTable.rows[0].exists);
      
      console.log('\n✅ Migration verification complete!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run: npm run prisma:generate');
      console.log('   2. Update backend handlers to use new schema');
      console.log('   3. Test the application thoroughly');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed! Transaction rolled back.');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
console.log('='.repeat(60));
console.log('SKILLS TO RESOURCE_SKILLS MIGRATION');
console.log('='.repeat(60));
console.log();

applyMigration()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n' + '='.repeat(60));
    console.error('MIGRATION FAILED');
    console.error('='.repeat(60));
    process.exit(1);
  });
