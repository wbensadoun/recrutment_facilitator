const pg = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const saltRounds = 10;

async function insertData() {
  const client = await pool.connect();
  try {
    console.log('--- Starting Data Seeding ---');

    const backupDir = path.resolve(__dirname, '../../backup'); // Go up two levels to the project root
    const authUsersPath = path.join(backupDir, 'auth_users.json');

    if (fs.existsSync(authUsersPath)) {
      const authUsersData = JSON.parse(fs.readFileSync(authUsersPath, 'utf8'));
      console.log(`Found ${authUsersData.length} users to insert from auth_users.json`);

      for (const user of authUsersData) {
        if (!user.email || !user.password) {
          console.warn('Skipping user with missing email or password:', user);
          continue;
        }

        const hashedPassword = await bcrypt.hash(user.password, saltRounds);

        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [user.email]);

        if (existingUser.rows.length === 0) {
          await client.query(
            `INSERT INTO users (firstname, lastname, email, password, role, status)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.firstname || '', user.lastname || '', user.email, hashedPassword, user.role || 'recruiter', user.status || 'active']
          );
          console.log(`  - Inserted user: ${user.email}`);
        } else {
          console.log(`  - User already exists, skipping: ${user.email}`);
        }
      }
    } else {
        console.log('auth_users.json not found in backup directory. No users will be seeded.');
    }

    // We can add logic for other backup files like candidates.json here later if needed.

    console.log('--- Data Seeding Complete ---');
  } catch (error) {
    console.error('Error during data seeding:', error);
  } finally {
    client.release();
  }
}

insertData().then(() => {
  console.log('Seeding script finished.');
  pool.end();
});
