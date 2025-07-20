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

async function updateAdminPassword() {
  try {
    // Generate bcrypt hash for the password
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log('Hashed password:', hashedPassword);    // Update administrator password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING *',
      [hashedPassword, 'admin@example.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully');
      console.log('Email:', result.rows[0].email);
    } else {
      console.log('❌ User admin@example.com not found');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    pool.end();
  }
}

updateAdminPassword();
