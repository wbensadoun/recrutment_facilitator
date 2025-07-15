require('dotenv').config();
require('pg').defaults.ssl = false;
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Configuration de la base de données
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'candidater_db',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
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

// --- Authentication ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
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

// --- Recruiters CRUD ---
app.get('/api/recruiters', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE role = 'recruiter' ORDER BY lastname, firstname"
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
    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
       VALUES ($1, $2, $3, 'temp123', 'recruiter', $4, NOW()) RETURNING *`,
      [firstname, lastname, email, status]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding recruiter:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
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
app.get('/api/candidates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.firstname, u.lastname, u.email 
      FROM candidates c 
      JOIN users u ON c.user_id = u.id 
      ORDER BY u.lastname, u.firstname
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/candidates', async (req, res) => {
  const { 
    firstname, lastname, email, position, 
    current_stage = 'soft_skills', status = 'in_progress', 
    salary_expectation, availability 
  } = req.body;

  if (!firstname || !lastname || !email || !position) {
    return res.status(400).json({ error: 'firstname, lastname, email, and position are required' });
  }

  try {
    await pool.query('BEGIN');

    const userResult = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
       VALUES ($1, $2, $3, 'temp123', 'candidate', 'active', NOW()) RETURNING *`,
      [firstname, lastname, email]
    );

    const candidateResult = await pool.query(
      `INSERT INTO candidates (user_id, position, current_stage, status, salary_expectation, availability, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [userResult.rows[0].id, position, current_stage, status, salary_expectation, availability]
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

// --- Pipeline Stages CRUD ---
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
    const result = await pool.query('DELETE FROM pipeline_stages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length > 0) {
      res.json({ success: true, message: 'Pipeline stage successfully deleted' });
    } else {
      res.status(404).json({ error: 'Pipeline stage not found' });
    }
  } catch (error) {
    console.error('Error deleting pipeline stage:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`✅ Serveur API démarré sur http://localhost:${port}`);
});
