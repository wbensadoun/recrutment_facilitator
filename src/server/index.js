const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

require('pg').defaults.ssl = false;
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');

const bcrypt = require('bcryptjs');

const app = express();
const port = parseInt(process.env.PORT, 10) || 3000;
const saltRounds = 10; // For bcrypt


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

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    const { rows: [updatedCandidate] } = await pool.query(
      'UPDATE candidates SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ error: 'Internal server error.' });
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

// --- SERVER START ---
app.listen(port, () => {
  console.log(`✅ API Server started on http://localhost:${port}`);
});