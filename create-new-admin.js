import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const saltRounds = 10;
const plainPassword = 'admin123';

async function createNewAdmin() {
  try {
    // Générer un hash bcrypt pour le mot de passe
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log('Hashed password:', hashedPassword);

    // Insérer le nouvel administrateur
    const result = await pool.query(
      'INSERT INTO users (firstname, lastname, email, password, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      ['Admin', 'Test', 'admin.test@alenia.io', hashedPassword, 'admin', 'active']
    );

    if (result.rows.length > 0) {
      console.log('✅ Nouvel administrateur créé avec succès');
      console.log('Email:', result.rows[0].email);
      console.log('ID:', result.rows[0].id);
    } else {
      console.log('❌ Erreur lors de la création de l\'administrateur');
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  } finally {
    pool.end();
  }
}

createNewAdmin();
