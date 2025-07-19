require('dotenv').config();
require('pg').defaults.ssl = false;
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10; // For bcrypt

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'recruitment_facilitator',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
});

// Test de connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erreur de connexion à PostgreSQL:', err);
  }
  console.log('✅ Connexion à PostgreSQL réussie');
  release();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true
}));
app.use(express.json());

// Test de connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erreur de connexion à PostgreSQL:', err);
  }
  console.log('✅ Connexion à PostgreSQL réussie');
  release();
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API backend is working!' });
});

// Generate secure token for password reset
const crypto = require('crypto');
// En développement, utiliser une valeur fixe pour éviter les problèmes lors du redémarrage du serveur
const RESET_SECRET = process.env.NODE_ENV === 'production' 
  ? (process.env.RESET_SECRET || crypto.randomBytes(32).toString('hex'))
  : 'development-reset-secret-do-not-use-in-production';

// Helper function to generate reset token
function generateResetToken(email) {
  // Use a 1-hour window for token validity
  const timeWindow = Math.floor(Date.now() / (1000 * 60 * 60));
  return crypto
    .createHmac('sha256', RESET_SECRET)
    .update(`${email}${timeWindow}`)
    .digest('hex');
}

// Configuration du transporteur d'emails
const isProduction = process.env.NODE_ENV === 'production';
let transporter;

if (isProduction) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  console.log('Email transporter configured for production with SMTP');
} else {
  // En développement, on utilise un compte de test
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'password'
    }
  });
  console.log('Email transporter configured for development - emails will be logged to console');
}

// --- Authentication ---
app.post('/api/auth/request-password-reset', async (req, res) => {
  console.log('=== PASSWORD RESET REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const { email } = req.body;
  
  if (!email) {
    console.log('No email provided');
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('Looking for user with email:', email);
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('No user found with email:', email);
      return res.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' });
    }

    const user = userResult.rows[0];
    console.log('User found:', { id: user.id, email: user.email });
    
    // Generate reset token
    const resetToken = generateResetToken(user.email);
    console.log('Generated reset token:', resetToken);
    
    // Create reset link (valid for 1 hour)
    const resetLink = `http://localhost:8000/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(user.email)}`;
    
    console.log('\n=== PASSWORD RESET EMAIL ===');
    console.log('To:', user.email);
    console.log('Subject: Password Reset Request');
    console.log('Reset Link:', resetLink);
    console.log('This link will expire in 1 hour');
    console.log('==============================\n');
    
    return res.json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Error in password reset request:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  console.log('=== PASSWORD RESET REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const { email, token, newPassword } = req.body;
  
  if (!email || !token || !newPassword) {
    const errorMsg = 'Email, token, and new password are required';
    console.log('Validation error:', { email: !!email, token: !!token, hasPassword: !!newPassword });
    return res.status(400).json({ success: false, message: errorMsg });
  }

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log('No account found with email:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email' 
      });
    }

    const user = userResult.rows[0];
    
    // Verify the token is valid for the current time window
    const currentTimeWindow = Math.floor(Date.now() / (1000 * 60 * 60));
    const currentTime = new Date();
    console.log('Current time:', currentTime.toISOString());
    console.log('Current time window:', currentTimeWindow);
    console.log('Minutes into current window:', Math.floor((Date.now() % (1000 * 60 * 60)) / (1000 * 60)));
    
    const currentToken = generateResetToken(email);
    console.log('Expected token:', currentToken);
    console.log('Received token:', token);
    
    if (token !== currentToken) {
      console.log('Invalid or expired token');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token. Please request a new password reset.' 
      });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    console.log('Password reset successful for user:', user.email);
    
    return res.json({ 
      success: true, 
      message: 'Your password has been reset successfully.' 
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while resetting your password.' 
    });
  }
});

// --- Authentication ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      console.log('Login failed: No user found for email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('Login failed: Incorrect password for email', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User authenticated:', user.email, 'Role:', user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/user/change-password', async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'User ID and new password are required.' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, userId]);

    res.json({ success: true, message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// --- Recruiters CRUD ---
app.get('/api/recruiters', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE role = 'recruiter' AND status = 'active' ORDER BY lastname, firstname"
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/recruiters', async (req, res) => {
  const { firstname, lastname, email, status = 'active' } = req.body;

  if (!firstname || !lastname || !email) {
    return res.status(400).json({ error: 'firstname, lastname, and email are required' });
  }

  try {
    const defaultPassword = email.split('@')[0];
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    console.log('Starting transaction...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      console.log('Transaction started');

      console.log('Inserting user...');
      const result = await client.query(
        `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
         VALUES ($1, $2, $3, $4, 'recruiter', $5, NOW()) RETURNING *`,
        [firstname, lastname, email, hashedPassword, status]
      );
      console.log('User inserted:', result.rows[0].email);

      const userId = result.rows[0].id;
      
      console.log('Inserting recruiter rights for user ID:', userId);
      // Création des droits par défaut pour le recruteur
      const rightsResult = await client.query(
        `INSERT INTO recruiter_rights (user_id, view_candidates, create_candidates, 
          modify_candidates, view_interviews, create_interviews, modify_interviews, 
          modify_statuses, modify_stages, created_at)
         VALUES ($1, true, true, true, true, true, true, false, false, NOW())
         RETURNING *`,
        [userId]
      );
      console.log('Recruiter rights inserted:', rightsResult.rows[0]);

      // Do not return the hashed password, but include the default password
      const { password, ...userWithoutPassword } = result.rows[0];
      const response = {
        ...userWithoutPassword,
        defaultPassword: defaultPassword
      };

      await client.query('COMMIT');
      console.log('Transaction committed successfully');
      
      // Envoyer la réponse après la validation de la transaction
      res.status(201).json(response);
    } catch (error) {
      console.error('Error in transaction:', error);
      await client.query('ROLLBACK');
      console.log('Transaction rolled back');
      throw error; // Propager l'erreur pour qu'elle soit gérée par le bloc catch externe
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding recruiter:', error);
    
    // Gestion des erreurs spécifiques
    if (error.code === '23505') { // Violation de contrainte d'unicité
      return res.status(409).json({ 
        error: 'Email déjà utilisé',
        details: 'Un utilisateur avec cette adresse email existe déjà',
        field: 'email'
      });
    }
    
    // Gestion des autres erreurs
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.put('/api/recruiters/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const recruiterId = parseInt(id, 10);

  if (isNaN(recruiterId)) {
    return res.status(400).json({ message: 'Invalid recruiter ID' });
  }

  if (typeof status !== 'string' || !['active', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "active" or "disabled".' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND role = \'recruiter\' RETURNING *',
      [status, recruiterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating recruiter status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/recruiters/:id', async (req, res) => {
  const { id } = req.params;
  const recruiterId = parseInt(id, 10);

  if (isNaN(recruiterId)) {
    return res.status(400).json({ message: 'Invalid recruiter ID' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND role = \'recruiter\' RETURNING *',
      [recruiterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    res.json({ success: true, message: 'Recruiter successfully deleted' });
  } catch (error) {
    console.error('Error deleting recruiter:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- Candidates CRUD ---
// Récupérer tous les candidats
app.get('/api/candidates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*, 
        u.firstname, 
        u.lastname, 
        u.email,
        r.firstname as recruiter_firstname,
        r.lastname as recruiter_lastname,
        r.email as recruiter_email
      FROM candidates c 
      JOIN users u ON c.users_id = u.id 
      LEFT JOIN users r ON c.recruiter_id = r.id
      ORDER BY u.lastname, u.firstname
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Récupérer un candidat spécifique
app.get('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT c.*, u.firstname, u.lastname, u.email 
       FROM candidates c 
       JOIN users u ON c.users_id = u.id 
       WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Créer un nouveau candidat
app.post('/api/candidates', async (req, res) => {
  const { 
    firstname, lastname, email, position, 
    current_stage = 'soft_skills', status = 'in_progress', 
    salary_expectation
  } = req.body;

  if (!firstname || !lastname || !email || !position) {
    return res.status(400).json({ error: 'firstname, lastname, email, and position are required' });
  }

  try {
    await pool.query('BEGIN');

    // Generate password from email (everything before @)
    const password = email.split('@')[0];
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userResult = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
       VALUES ($1, $2, $3, $4, 'candidate', 'active', NOW()) RETURNING *`,
      [firstname, lastname, email, hashedPassword]
    );
    
    console.log(`New candidate created with password: ${password}`);

    const userId = userResult.rows[0].id;

    const candidateResult = await pool.query(
      `INSERT INTO candidates (users_id, position, pipeline_stage_id, status, salary_expectation, created_at) 
       VALUES ($1, $2, 1, 'scheduled', $3, NOW()) 
       RETURNING *`,
      [userId, position, salary_expectation]
    );

    await pool.query('COMMIT');

    const result = { ...candidateResult.rows[0], ...userResult.rows[0] };
    res.status(201).json(result);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error adding candidate:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Mettre à jour un candidat existant
// Mettre à jour uniquement le stage d'un candidat
app.put('/api/candidates/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { current_stage, current_stage_id } = req.body;

  if (!current_stage && !current_stage_id) {
    return res.status(400).json({ error: 'current_stage or current_stage_id is required' });
  }

  try {
    const stageId = current_stage_id || current_stage;
    
    const result = await pool.query(
      `UPDATE candidates 
       SET current_stage_id = $1, 
           updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [stageId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating candidate stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mettre à jour un candidat existant
app.put('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    firstname, lastname, email, position,
    current_stage, current_stage_id, // Gérer les deux formats
    status, status_id, // Gérer les deux formats
    salary_expectation
  } = req.body;

  if (!firstname || !lastname || !email || !position) {
    return res.status(400).json({ error: 'firstname, lastname, email, and position are required' });
  }

  // Utiliser current_stage si current_stage_id n'est pas fourni
  const stageId = current_stage_id || current_stage;
  // Utiliser status si status_id n'est pas fourni
  const statId = status_id || status;

  try {
    await pool.query('BEGIN');

    // Mettre à jour l'utilisateur
    const userResult = await pool.query(
      `UPDATE users 
       SET firstname = $1, lastname = $2, email = $3, updated_at = NOW() 
       WHERE id = (SELECT users_id FROM candidates WHERE id = $4) 
       RETURNING id, firstname, lastname, email, role, status, created_at, updated_at`,
      [firstname, lastname, email, id]
    );

    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found for this candidate' });
    }

    // Mettre à jour le candidat
    const candidateResult = await pool.query(
      `UPDATE candidates 
       SET position = $1, 
           current_stage_id = $2, 
           status_id = $3, 
           salary_expectation = $4, 
           updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [position, stageId, statId, salary_expectation, id]
    );

    if (candidateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await pool.query('COMMIT');
    
    // Récupérer les données complètes du candidat mises à jour
    const updatedCandidate = await pool.query(`
      SELECT c.*, 
             u.firstname, u.lastname, u.email, u.role, u.status as user_status,
             cs.name as status_name, cs.color as status_color,
             ps.name as current_stage_name, ps.stage_order
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN candidate_statuses cs ON c.status_id = cs.id
      LEFT JOIN pipeline_stages ps ON c.current_stage_id = ps.id
      WHERE c.id = $1
    `, [id]);
    
    if (updatedCandidate.rows.length === 0) {
      return res.status(404).json({ error: 'Failed to fetch updated candidate data' });
    }
    
    // Formater la réponse pour le frontend
    const result = {
      ...updatedCandidate.rows[0],
      status: updatedCandidate.rows[0].status_name,
      current_stage: updatedCandidate.rows[0].current_stage_name,
      stage_order: updatedCandidate.rows[0].stage_order
    };
    
    res.json(result);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating candidate:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Supprimer un candidat
app.delete('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('BEGIN');
    
    // Récupérer l'ID de l'utilisateur avant de supprimer le candidat
    const candidateResult = await pool.query(
      'SELECT users_id FROM candidates WHERE id = $1',
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }
    
    const userId = candidateResult.rows[0].user_id;
    
    // Supprimer le candidat
    await pool.query('DELETE FROM candidates WHERE id = $1', [id]);
    
    // Supprimer l'utilisateur associé
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await pool.query('COMMIT');
    
    res.status(204).send();
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Interviews CRUD ---
// Récupérer tous les entretiens
app.get('/api/interviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, 
             c.firstname AS candidate_firstname, 
             c.lastname AS candidate_lastname,
             u.firstname AS recruiter_firstname,
             u.lastname AS recruiter_lastname
      FROM interviews i
      JOIN candidates ca ON i.candidate_id = ca.id
      JOIN users c ON ca.users_id = c.id
      LEFT JOIN users u ON i.recruiter_id = u.id
      ORDER BY i.scheduled_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Récupérer les entretiens d'un candidat
app.get('/api/interviews/candidate/:candidateId', async (req, res) => {
  const { candidateId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT i.*, 
              u.firstname AS recruiter_firstname, 
              u.lastname AS recruiter_lastname
       FROM interviews i
       LEFT JOIN users u ON i.recruiter_id = u.id
       WHERE i.candidate_id = $1
       ORDER BY i.scheduled_date DESC`,
      [candidateId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Créer un nouvel entretien
app.post('/api/interviews', async (req, res) => {
  const { candidate_id, recruiter_id, scheduled_at, duration, notes } = req.body;
  
  if (!candidate_id || !scheduled_at) {
    return res.status(400).json({ error: 'candidate_id and scheduled_at are required' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO interviews 
       (candidate_id, recruiter_id, scheduled_date, duration, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [candidate_id, recruiter_id, scheduled_at, duration, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mettre à jour un entretien
app.put('/api/interviews/:id', async (req, res) => {
  const { id } = req.params;
  const { candidate_id, recruiter_id, scheduled_at, duration, notes } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE interviews 
       SET candidate_id = COALESCE($1, candidate_id),
           recruiter_id = COALESCE($2, recruiter_id),
           scheduled_date = COALESCE($3, scheduled_date),
           duration = COALESCE($4, duration),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [candidate_id, recruiter_id, scheduled_at, duration, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entretien non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Supprimer un entretien
app.delete('/api/interviews/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM interviews WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entretien non trouvé' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Pipeline Stages CRUD ---
// Récupérer toutes les étapes du pipeline
app.get('/api/pipeline-stages', async (req, res) => {
  try {
    console.log('GET /api/pipeline-stages - Fetching pipeline stages');
    const result = await pool.query('SELECT * FROM pipeline_stages ORDER BY stage_order ASC');
    console.log('Pipeline stages fetched:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/pipeline-stages', async (req, res) => {
  const { name, description, stage_order = 0, is_active = true } = req.body;
  
  console.log('POST /api/pipeline-stages - Request body:', req.body);

  if (!name) {
    console.log('Pipeline stage creation failed: Name is required');
    return res.status(400).json({ message: 'Name is required' });
  }

  const id = `stage_${Date.now()}`;

  try {
    const result = await pool.query(
      'INSERT INTO pipeline_stages (id, name, description, stage_order, is_active, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [id, name, description, stage_order, is_active]
    );
    console.log('Pipeline stage created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pipeline stage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/pipeline-stages/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, stage_order, is_active } = req.body;

  console.log(`PUT /api/pipeline-stages/${id} - Request params:`, req.params);
  console.log(`PUT /api/pipeline-stages/${id} - Request body:`, req.body);

  try {
    const result = await pool.query(
      'UPDATE pipeline_stages SET name = $1, description = $2, stage_order = $3, is_active = $4 WHERE id = $5 RETURNING *',
      [name, description, stage_order, is_active, id]
    );

    console.log(`Pipeline stage update query executed, affected rows: ${result.rows.length}`);

    if (result.rows.length === 0) {
      console.log(`Pipeline stage with ID ${id} not found`);
      return res.status(404).json({ message: 'Pipeline stage not found' });
    }

    console.log('Pipeline stage updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pipeline stage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/pipeline-stages/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  console.log(`PUT /api/pipeline-stages/${id}/status - Request params:`, req.params);
  console.log(`PUT /api/pipeline-stages/${id}/status - Request body:`, req.body);
  console.log(`Stage ID: ${id}, is_active: ${is_active} (type: ${typeof is_active})`);

  const activeStatus = typeof is_active === 'string' ? is_active === 'true' : !!is_active;

  try {
    console.log(`✅ Validation passed. Updating pipeline stage ${id} status to ${activeStatus}`);
    const result = await pool.query(
      'UPDATE pipeline_stages SET is_active = $1 WHERE id = $2 RETURNING *',
      [activeStatus, id]
    );

    console.log(`Query result rows: ${result.rows.length}`);

    if (result.rows.length === 0) {
      console.log(`Pipeline stage with ID ${id} not found`);
      return res.status(404).json({ message: 'Pipeline stage not found' });
    }

    console.log('✅ Status updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pipeline stage status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/pipeline-stages/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Vérifier si l'étape est utilisée par des candidats
    const candidatesCount = await pool.query(
      'SELECT COUNT(*) FROM candidates WHERE current_stage_id = $1',
      [id]
    );
    
    if (parseInt(candidatesCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer cette étape car elle est utilisée par un ou plusieurs candidats' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM pipeline_stages WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Étape du pipeline non trouvée' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pipeline stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`✅ Serveur API démarré sur http://localhost:${port}`);
});
