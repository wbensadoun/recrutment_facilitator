const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

require('pg').defaults.ssl = false;
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();
const port = parseInt(process.env.PORT, 10) || 3000;
const saltRounds = 10; // For bcrypt

// --- EMAIL CONFIGURATION ---
const createEmailTransporter = () => {
  // Use production SMTP settings if available, fallback to development
  const smtpConfig = {
    host: process.env.SMTP_HOST_PROD || process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT_PROD || process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE_PROD || process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.SMTP_USER_PROD || process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD_PROD || process.env.SMTP_PASSWORD
    }
  };

  // Validate SMTP configuration
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
    throw new Error('SMTP configuration incomplete. Please check SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.');
  }

  return nodemailer.createTransport(smtpConfig);
};


// --- MIDDLEWARES ---

// 1. CORS Configuration
const allowedOrigins = [
  'http://localhost:8000', // Frontend dev server
  process.env.APP_URL,   // Production frontend URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      callback(new Error(msg), false);
    }
  }
}));

// 2. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Static Files Server (for uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Request Logging Middleware
app.use((req, res, next) => {
  console.log(`🌐 [REQUEST] ${req.method} ${req.url} from ${req.ip}`);
  console.log(`🌐 [REQUEST] Headers:`, req.headers);
  next();
});

// --- DATABASE CONFIGURATION ---
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'recruitment_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error connecting to PostgreSQL:', err.stack);
  }
  console.log('✅ Connected to PostgreSQL successfully');
  release();
});

// --- MULTER CONFIGURATION FOR FILE UPLOADS ---
const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads', 'cvs');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const tempName = Date.now() + path.extname(file.originalname);
        cb(null, tempName);
    }
});

const uploadCV = multer({
    storage: cvStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// =================================================================
// --- API ROUTES ---
// =================================================================

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API backend is working!' });
});

// --- AUTHENTICATION ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PASSWORD RESET ---
app.post('/api/auth/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Check if user exists
    const result = await pool.query('SELECT id, firstname, lastname FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Log for debugging even when user doesn't exist
      console.log(`🔑 Password reset requested for ${email} - USER NOT FOUND`);
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with this email exists, password reset instructions have been sent.' });
    }
    
    const user = result.rows[0];
    
    // Generate a simple reset token (in production, use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store reset token in database
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, resetExpiry, user.id]
    );
    
    // Generate reset URL with email parameter
    const resetUrl = `${process.env.APP_URL || 'http://localhost:8000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    // Log reset information for debugging
    console.log(`🔑 Password reset requested for ${email}`);
    console.log(`🔑 Reset token: ${resetToken}`);
    console.log(`🔑 Reset URL: ${resetUrl}`);
    
    // Send email with reset link
    try {
      const transporter = createEmailTransporter();
      
      const mailOptions = {
        from: process.env.SMTP_FROM_PROD || process.env.SMTP_USER,
        to: email,
        subject: 'Réinitialisation de votre mot de passe - Candidater en France Facile',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Réinitialisation de mot de passe</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin: 0;">Candidater en France Facile</h1>
              </div>
              
              <h2 style="color: #333; margin-bottom: 20px;">Réinitialisation de votre mot de passe</h2>
              
              <p style="color: #555; line-height: 1.6;">Bonjour ${user.firstname} ${user.lastname},</p>
              
              <p style="color: #555; line-height: 1.6;">
                Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Candidater en France Facile.
              </p>
              
              <p style="color: #555; line-height: 1.6;">
                Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  ⚠️ <strong>Important :</strong> Ce lien expirera dans 1 heure pour votre sécurité.
                </p>
              </div>
              
              <p style="color: #555; line-height: 1.6; font-size: 14px;">
                Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">
                  <strong>Le bouton ne fonctionne pas ?</strong><br>
                  Copiez et collez ce lien dans votre navigateur :<br>
                  <span style="word-break: break-all; color: #007bff;">${resetUrl}</span>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                  © ${new Date().getFullYear()} Candidater en France Facile. Tous droits réservés.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Réinitialisation de votre mot de passe - Candidater en France Facile

Bonjour ${user.firstname} ${user.lastname},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Candidater en France Facile.

Cliquez sur ce lien pour définir un nouveau mot de passe :
${resetUrl}

Ce lien expirera dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.

---
© ${new Date().getFullYear()} Candidater en France Facile
        `
      };
      
      // Verify transporter configuration before sending
      await transporter.verify();
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      
    } catch (emailError) {
      console.error('❌ Error sending email:', emailError.message);
      console.log(`🔑 EMAIL FAILED - Use this URL manually: ${resetUrl}`);
      console.log(`🔑 ⚠️  COPY THIS RESET URL: ${resetUrl}`);
      console.log(`🔑 📧 Email would have been sent to: ${email}`);
      
      // Don't fail the request if email fails - user can still use the URL from logs
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 PRODUCTION: Email service failed, check SMTP configuration');
      }
    }
    
    res.json({ 
      message: 'If an account with this email exists, password reset instructions have been sent.',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  
  try {
    // Find user with valid reset token
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    const userId = result.rows[0].id;
    
    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password has been reset successfully' });
    
  } catch (error) {
    console.error('Password reset completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- RECRUITERS CRUD ---
app.get('/api/recruiters', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE role = 'recruiter' ORDER BY lastname, firstname");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/recruiters', async (req, res) => {
  const { firstname, lastname, email, status = 'active', password = 'temp123' } = req.body;
  if (!firstname || !lastname || !email) {
    return res.status(400).json({ error: 'Firstname, lastname, and email are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
       VALUES ($1, $2, $3, $4, 'recruiter', $5, NOW()) RETURNING *`,
      [firstname, lastname, email, hashedPassword, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding recruiter:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.put('/api/recruiters/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "active" or "disabled".' });
  }
  try {
    const result = await pool.query(
      "UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND role = 'recruiter' RETURNING *",
      [status, id]
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

app.put('/api/recruiters/:id/rights', async (req, res) => {
  const { id } = req.params;
  const { rights } = req.body; // e.g., { "candidates": "write", "recruiters": "read" }

  if (!rights || typeof rights !== 'object') {
    return res.status(400).json({ message: 'Rights object is required.' });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET rights = $1, updated_at = NOW() WHERE id = $2 AND role = 'recruiter' RETURNING id, rights",
      [rights, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Recruiter not found.' });
    }

    res.status(200).json({ message: 'Recruiter rights updated successfully.', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating recruiter rights:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/recruiters/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 AND role = 'recruiter' RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting recruiter:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- CANDIDATES CRUD ---
app.get('/api/candidates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.firstname, u.lastname, u.email 
      FROM candidates c 
      JOIN users u ON c.users_id = u.id 
      ORDER BY u.lastname, u.firstname
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/candidates', async (req, res) => {
    const { firstname, lastname, email, position, current_stage = 'soft_skills', status = 'in_progress', salary_expectation, phone, experience, recruiter_id, last_interview_date } = req.body;
    if (!firstname || !lastname || !email || !position) {
        return res.status(400).json({ error: 'Firstname, lastname, email, and position are required' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const password = email.split('@')[0];
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const userResult = await client.query(
            `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
             VALUES ($1, $2, $3, $4, 'candidate', 'active', NOW()) RETURNING *`,
            [firstname, lastname, email, hashedPassword]
        );
        const userId = userResult.rows[0].id;
        const candidateResult = await client.query(
            `INSERT INTO candidates (users_id, position, current_stage, status, salary_expectation, phone, experience, recruiter_id, last_interview_date, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
            [userId, position, current_stage, status, salary_expectation, phone, experience, recruiter_id, last_interview_date]
        );
        await client.query('COMMIT');
        const finalResult = { ...userResult.rows[0], ...candidateResult.rows[0] };
        delete finalResult.password;
        res.status(201).json(finalResult);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding candidate:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'A user with this email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    } finally {
        client.release();
    }
});

app.put('/api/candidates/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['in_progress', 'hired', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { rows: [updatedCandidate] } = await pool.query(
      'UPDATE candidates SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.patch('/api/candidates/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { stageId } = req.body;

  if (!stageId) {
    return res.status(400).json({ error: 'Stage ID is required' });
  }

  try {
    // Verify stage exists
    const stageResult = await pool.query('SELECT id FROM pipeline_stages WHERE id = $1', [stageId]);
    if (stageResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid stage ID' });
    }

    // Update candidate stage
    const { rows: [updatedCandidate] } = await pool.query(
      'UPDATE candidates SET current_stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [stageId, id]
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate stage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/candidates/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: [candidate] } = await client.query('SELECT * FROM candidates WHERE id = $1', [id]);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const { rows: [user] } = await client.query('SELECT * FROM users WHERE id = $1', [candidate.users_id]);

        const updatedUser = {
            firstname: req.body.firstname ?? user.firstname,
            lastname: req.body.lastname ?? user.lastname,
            email: req.body.email ?? user.email,
        };
        await client.query(
            'UPDATE users SET firstname = $1, lastname = $2, email = $3, updated_at = NOW() WHERE id = $4',
            [updatedUser.firstname, updatedUser.lastname, updatedUser.email, user.id]
        );

        const updatedCandidate = {
            position: req.body.position ?? candidate.position,
            current_stage: req.body.current_stage ?? candidate.current_stage,
            status: req.body.status ?? candidate.status,
            salary_expectation: req.body.salary_expectation ?? candidate.salary_expectation,
            phone: req.body.phone ?? candidate.phone,
            experience: req.body.experience ?? candidate.experience,
            recruiter_id: req.body.recruiter_id ?? candidate.recruiter_id,
            last_interview_date: req.body.last_interview_date ?? candidate.last_interview_date,
        };
        const { rows: [result] } = await client.query(
            `UPDATE candidates SET position = $1, current_stage = $2, status = $3, salary_expectation = $4, phone = $5, experience = $6, recruiter_id = $7, last_interview_date = $8, updated_at = NOW() 
             WHERE id = $9 RETURNING *`,
            [updatedCandidate.position, updatedCandidate.current_stage, updatedCandidate.status, updatedCandidate.salary_expectation, updatedCandidate.phone, updatedCandidate.experience, updatedCandidate.recruiter_id, updatedCandidate.last_interview_date, id]
        );

        await client.query('COMMIT');
        res.json(result);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error patching candidate:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// --- CV UPLOAD ROUTE ---
app.post('/api/candidates/:id/cv', uploadCV.single('cv'), async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or incorrect format.' });
    }

    const client = await pool.connect();
    try {
        const { rows: [candidate] } = await client.query('SELECT users_id FROM candidates WHERE id = $1', [id]);
        if (!candidate) {
            fs.unlinkSync(req.file.path); // Clean up uploaded file
            return res.status(404).json({ error: 'Candidate not found.' });
        }

        const { rows: [user] } = await client.query('SELECT firstname, lastname FROM users WHERE id = $1', [candidate.users_id]);

        const safeFirstname = (user.firstname || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '');
        const safeLastname = (user.lastname || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '');
        const newFilename = `${safeFirstname}_${safeLastname}_${Date.now()}${path.extname(req.file.originalname)}`;
        const newPath = path.join(__dirname, 'uploads', 'cvs', newFilename);

        fs.renameSync(req.file.path, newPath);

        const cvUrl = `/uploads/cvs/${newFilename}`;
        const { rows: [updatedCandidate] } = await client.query(
            'UPDATE candidates SET cv_url = $1, cv_original_filename = $2 WHERE id = $3 RETURNING *',
            [cvUrl, req.file.originalname, id]
        );

        res.status(200).json({ message: 'CV uploaded successfully.', candidate: updatedCandidate });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error during CV upload:', error);
        res.status(500).json({ error: 'Internal server error.' });
    } finally {
        client.release();
    }
});

// --- PIPELINE STAGES CRUD ---
app.get('/api/pipeline-stages', async (req, res) => {
  console.log('🔥 [PIPELINE-STAGES] GET /api/pipeline-stages called');
  console.log('🔥 [PIPELINE-STAGES] Request headers:', req.headers);
  console.log('🔥 [PIPELINE-STAGES] Request URL:', req.url);
  console.log('🔥 [PIPELINE-STAGES] Request method:', req.method);
  
  try {
    console.log('🔥 [PIPELINE-STAGES] Executing database query...');
    const result = await pool.query('SELECT * FROM pipeline_stages ORDER BY stage_order ASC');
    console.log('🔥 [PIPELINE-STAGES] Database result:', result.rows.length, 'rows found');
    console.log('🔥 [PIPELINE-STAGES] Sending JSON response:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('🔥 [PIPELINE-STAGES] Error fetching pipeline stages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/pipeline-stages', async (req, res) => {
  const { name, stage_order } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Stage name is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO pipeline_stages (name, stage_order) VALUES ($1, $2) RETURNING *',
      [name, stage_order]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pipeline stage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/pipeline-stages/:id', async (req, res) => {
  const { id } = req.params;
  const { name, stage_order } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Stage name is required' });
  }
  try {
    const result = await pool.query(
      'UPDATE pipeline_stages SET name = $1, stage_order = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, stage_order, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pipeline stage not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pipeline stage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/pipeline-stages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM pipeline_stages WHERE id = $1 RETURNING *');
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pipeline stage not found' });
    }
    res.status(204).send(); // No Content
  } catch (error) {
    console.error('Error deleting pipeline stage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ... (Keep other routes like interviews, password change, etc. as they were)

// --- INTERVIEWS CRUD ---
app.get('/api/interviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*,
        cu.firstname AS candidate_firstname,
        cu.lastname AS candidate_lastname,
        ru.firstname AS recruiter_firstname,
        ru.lastname AS recruiter_lastname
      FROM interviews i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN users cu ON c.users_id = cu.id
      LEFT JOIN users ru ON i.recruiter_id = ru.id
      ORDER BY i.scheduled_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/interviews', async (req, res) => {
  const { candidate_id, recruiter_id, scheduled_at, duration, notes } = req.body;
  if (!candidate_id || !scheduled_at) {
    return res.status(400).json({ error: 'Candidate ID and scheduled date are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO interviews (candidate_id, recruiter_id, scheduled_date, duration, notes, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [candidate_id, recruiter_id, scheduled_at, duration, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- USER PASSWORD CHANGE ---
app.put('/api/user/change-password', async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'User ID and new password are required.' });
  }
  try {
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    const result = await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id', [hashedNewPassword, userId]);
    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// --- ADMIN RECRUITER PASSWORD UPDATE ---
app.put('/api/admin/recruiter/password', async (req, res) => {
  const { recruiterId, newPassword } = req.body;
  if (!recruiterId || !newPassword) {
    return res.status(400).json({ error: 'Recruiter ID and new password are required.' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  
  try {
    // Verify recruiter exists and has recruiter role
    const recruiterCheck = await pool.query('SELECT id, role FROM users WHERE id = $1 AND role = $2', [recruiterId, 'recruiter']);
    if (recruiterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Recruiter not found.' });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    const result = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 AND role = $3 RETURNING id', 
      [hashedNewPassword, recruiterId, 'recruiter']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recruiter not found.' });
    }
    
    res.json({ success: true, message: 'Recruiter password updated successfully.' });
  } catch (error) {
    console.error('Error updating recruiter password:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- SERVER START ---
app.listen(port, () => {
  console.log(`✅ API Server started on http://localhost:${port}`);
});