require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const saltRounds = 10;

// Regex to check if a string is a bcrypt hash
const bcryptHashRegex = /^\$2[ayb]\$.{56}$/;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const hashPasswords = async () => {
  const client = await pool.connect();
  console.log('Connected to the database.');

  try {
    await client.query('BEGIN');
    console.log('Fetching all users...');

    const { rows: users } = await client.query('SELECT id, password FROM users');
    console.log(`Found ${users.length} users to process.`);

    let updatedCount = 0;

    for (const user of users) {
      // Check if the password is not null and not already hashed
      if (user.password && !bcryptHashRegex.test(user.password)) {
        console.log(`Hashing password for user ID: ${user.id}...`);
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
        updatedCount++;
      } else {
        console.log(`Password for user ID: ${user.id} is null or already hashed. Skipping.`);
      }
    }

    await client.query('COMMIT');
    console.log('--------------------------------------------------');
    console.log(`✅ Successfully updated ${updatedCount} passwords.`);
    console.log('All user passwords are now securely hashed.');
    console.log('--------------------------------------------------');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ An error occurred during password hashing:', error);
    throw error;
  } finally {
    client.release();
    console.log('Database connection released.');
    pool.end();
  }
};

hashPasswords().catch(err => {
  console.error('Failed to run password hashing script.');
});
