const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: 'candidater-en-france-db',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'recruitment_facilitator'
});

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_add_pipeline_stages.sql'),
      'utf8'
    );
    
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
