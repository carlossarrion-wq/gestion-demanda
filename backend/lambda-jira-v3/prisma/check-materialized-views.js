const { Client } = require('pg');
require('dotenv').config();

async function checkViews() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(`
      SELECT 
        matviewname,
        definition
      FROM pg_matviews 
      WHERE schemaname = 'public' 
      AND matviewname IN ('mv_resource_allocation', 'mv_skill_capacity')
      ORDER BY matviewname
    `);

    console.log('Materialized Views Found:', result.rows.length);
    console.log('='.repeat(80));
    
    result.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. View: ${row.matviewname}`);
      console.log('-'.repeat(80));
      console.log(row.definition);
      console.log('='.repeat(80));
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkViews();
