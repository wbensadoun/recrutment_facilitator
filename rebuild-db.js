import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/recruitment_facilitator',
});

const enums = {
  user_role: ['admin', 'recruiter', 'candidate'],
};

const tables = {
  users: {
    columns: {
      id: 'SERIAL PRIMARY KEY',
      firstname: 'TEXT',
      lastname: 'TEXT',
      email: 'TEXT NOT NULL UNIQUE',
      password: 'TEXT NOT NULL',
      role: 'user_role NOT NULL',
      status: 'TEXT DEFAULT \'active\'',
      created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    }
  },
  pipeline_stages: {
    columns: {
        id: 'SERIAL PRIMARY KEY',
        name: 'TEXT NOT NULL',
        description: 'TEXT',
        stage_order: 'INTEGER NOT NULL',
        is_active: 'BOOLEAN DEFAULT TRUE',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    }
  },
  candidate_statuses: {
    columns: {
        id: 'SERIAL PRIMARY KEY',
        name: 'TEXT NOT NULL',
        color: 'TEXT DEFAULT \'#888888\'',
        is_default: 'BOOLEAN DEFAULT FALSE',
        is_active: 'BOOLEAN DEFAULT TRUE',
        created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    }
  },
  candidates: {
    columns: {
      id: 'SERIAL PRIMARY KEY',
      user_id: 'INTEGER REFERENCES users(id) ON DELETE CASCADE',
      position: 'TEXT NOT NULL',
      experience: 'TEXT',
      cv_url: 'TEXT',
      recruiter_id: 'INTEGER REFERENCES users(id)',
      status_id: 'INTEGER REFERENCES candidate_statuses(id)',
      current_stage_id: 'INTEGER REFERENCES pipeline_stages(id)',
      salary_expectation: 'TEXT',
      created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    }
  },
  interviews: {
    columns: {
      id: 'SERIAL PRIMARY KEY',
      candidate_id: 'INTEGER REFERENCES candidates(id) ON DELETE CASCADE',
      recruiter_id: 'INTEGER REFERENCES users(id)',
      scheduled_date: 'TIMESTAMP WITH TIME ZONE NOT NULL',
      stage_id: 'INTEGER REFERENCES pipeline_stages(id)',
      notes: 'TEXT',
      created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    }
  },
  recruiter_permissions: {
    columns: {
      id: 'SERIAL PRIMARY KEY',
      user_id: 'INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE',
      permissions: 'TEXT[] NOT NULL',
      created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    }
  },
  candidate_comments: {
    columns: {
      id: 'SERIAL PRIMARY KEY',
      candidate_id: 'INTEGER REFERENCES candidates(id) ON DELETE CASCADE',
      user_id: 'INTEGER REFERENCES users(id)',
      comment: 'TEXT NOT NULL',
      created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    }
  }
};

async function rebuildDatabase() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Database Rebuild ---');

    // Drop existing tables in reverse order of creation
    console.log('Dropping existing tables...');
    const tableNames = Object.keys(tables).reverse();
    for (const tableName of tableNames) {
      await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
      console.log(`  - Dropped table: ${tableName}`);
    }

    // Drop existing enums
    console.log('Dropping existing enums...');
    const enumNames = Object.keys(enums).reverse();
    for (const enumName of enumNames) {
        await client.query(`DROP TYPE IF EXISTS ${enumName} CASCADE`);
        console.log(`  - Dropped enum: ${enumName}`);
    }

    // Create enums
    console.log('Creating enums...');
    for (const [name, values] of Object.entries(enums)) {
      const valuesStr = values.map(v => `'${v}'`).join(', ');
      await client.query(`CREATE TYPE ${name} AS ENUM (${valuesStr})`);
      console.log(`  - Created enum: ${name}`);
    }

    // Create tables
    console.log('Creating tables...');
    for (const [name, definition] of Object.entries(tables)) {
      const columnsStr = Object.entries(definition.columns)
        .map(([colName, colDef]) => `"${colName}" ${colDef}`)
        .join(', ');
      await client.query(`CREATE TABLE ${name} (${columnsStr})`);
      console.log(`  - Created table: ${name}`);
    }
    
    console.log('--- Database Rebuild Complete ---');
  } catch (error) {
    console.error('Error during database rebuild:', error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

rebuildDatabase().then(() => {
  console.log('Database rebuild finished.');
  pool.end();
});
