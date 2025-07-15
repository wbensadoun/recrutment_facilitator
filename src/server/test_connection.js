require('dotenv').config();
const { Pool } = require('pg');

// Test avec le nom du conteneur
const pool1 = new Pool({
  connectionString: 'postgresql://postgres:postgres@candidater-en-france-db:5432/recruitment_facilitator',
  ssl: false
});

// Test avec le nom du service
const pool2 = new Pool({
  connectionString: 'postgresql://postgres:postgres@postgres:5432/recruitment_facilitator',
  ssl: false
});

// Test avec localhost
const pool3 = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/recruitment_facilitator',
  ssl: false
});

async function testConnection(pool, name) {
  try {
    console.log(`Tentative de connexion avec ${name}...`);
    const client = await pool.connect();
    console.log(`Connexion réussie avec ${name}`);
    const result = await client.query('SELECT NOW()');
    console.log(`Requête réussie avec ${name}:`, result.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error(`Erreur de connexion avec ${name}:`, error.message);
    return false;
  }
}

async function main() {
  const results = [];
  results.push(await testConnection(pool1, 'nom du conteneur (candidater-en-france-db)'));
  results.push(await testConnection(pool2, 'nom du service (postgres)'));
  results.push(await testConnection(pool3, 'localhost'));
  
  console.log('Résultats des tests de connexion:', results);
  process.exit(0);
}

main().catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});
