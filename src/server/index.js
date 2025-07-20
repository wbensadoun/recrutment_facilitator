require('dotenv').config();
require('pg').defaults.ssl = false;
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10; // For bcrypt

// Configuration CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- NOUVELLE CONFIGURATION MULTER POUR L'UPLOAD DE CV ---
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'cvs');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Récupérer prénom et nom depuis le form-data
    const firstname = req.body.firstname || 'unknown';
    const lastname = req.body.lastname || 'unknown';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    // Nettoyer les noms pour éviter les caractères spéciaux
    const safeFirstname = firstname.replace(/[^a-zA-Z0-9-_]/g, '');
    const safeLastname = lastname.replace(/[^a-zA-Z0-9-_]/g, '');
    cb(null, `${safeFirstname}_${safeLastname}_${timestamp}${extension}`);
  }
});
const uploadCV = multer({ storage: cvStorage });

// --- ANCIENNE CONFIGURATION MULTER POUR LES AUTRES UPLOADS (si besoin) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const candidateId = req.params.id;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `cv_${candidateId}_${timestamp}${extension}`);
  }
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
  }
});

// Configuration de la base de données PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'recruitment_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
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

// =================================================================
// --- ROUTES API ---
// =================================================================

// --- AUTHENTIFICATION ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la connexion :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// --- RECRUITEURS CRUD ---
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
    return res.status(400).json({ error: 'firstname, lastname, and email are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
       VALUES ($1, $2, $3, $4, 'recruiter', $5, NOW()) RETURNING *`,
      [firstname, lastname, email, hashedPassword, status]
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

// --- CANDIDATS CRUD ---
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
    return res.status(400).json({ error: 'firstname, lastname, email, and position are required' });
  }
  try {
    await pool.query('BEGIN');
    const password = email.split('@')[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      `INSERT INTO users (firstname, lastname, email, password, role, status, created_at) 
       VALUES ($1, $2, $3, $4, 'candidate', 'active', NOW()) RETURNING *`,
      [firstname, lastname, email, hashedPassword]
    );
    const candidateResult = await pool.query(
      `INSERT INTO candidates (users_id, position, current_stage, status, salary_expectation, phone, experience, recruiter_id, last_interview_date, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
       RETURNING *`,
      [userResult.rows[0].id, position, current_stage, status, salary_expectation, phone, experience, recruiter_id, last_interview_date]
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

// PATCH: Mettre à jour partiellement un candidat existant
app.patch('/api/candidates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Récupérer le candidat et l'utilisateur existants
    const candidateResult = await pool.query(
      `SELECT c.*, u.firstname, u.lastname, u.email 
       FROM candidates c 
       JOIN users u ON c.users_id = u.id 
       WHERE c.id = $1`, [id]
    );
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    const existing = candidateResult.rows[0];

    // Utiliser les valeurs envoyées OU existantes
    const firstname = req.body.firstname ?? existing.firstname;
    const lastname = req.body.lastname ?? existing.lastname;
    const email = req.body.email ?? existing.email;
    const position = req.body.position ?? existing.position;
    const current_stage = req.body.current_stage ?? existing.current_stage;
    const status = req.body.status ?? existing.status;
    const salary_expectation = req.body.salary_expectation ?? existing.salary_expectation;
    const phone = req.body.phone ?? existing.phone;
    const experience = req.body.experience ?? existing.experience;
    const recruiter_id = req.body.recruiter_id ?? existing.recruiter_id;
    const last_interview_date = req.body.last_interview_date ?? existing.last_interview_date;

    await pool.query('BEGIN');

    // Mettre à jour l'utilisateur
    await pool.query(
      `UPDATE users 
       SET firstname = $1, lastname = $2, email = $3, updated_at = NOW() 
       WHERE id = (SELECT users_id FROM candidates WHERE id = $4)` ,
      [firstname, lastname, email, id]
    );

    // Mettre à jour le candidat
    await pool.query(
      `UPDATE candidates 
       SET position = $1, 
           current_stage = $2, 
           status = $3, 
           salary_expectation = $4, 
           phone = $5,
           experience = $6,
           recruiter_id = $7,
           last_interview_date = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [position, current_stage, status, salary_expectation, phone, experience, recruiter_id, last_interview_date, id]
    );

    await pool.query('COMMIT');

    // Récupérer les données complètes du candidat mises à jour
    const updatedCandidate = await pool.query(
      `SELECT c.*, u.firstname, u.lastname, u.email, u.role, u.status as user_status
       FROM candidates c
       JOIN users u ON c.users_id = u.id
       WHERE c.id = $1`, [id]);
    console.log(`[PATCH /api/candidates/${id}] Updated candidate:`, updatedCandidate.rows[0]);
    if (updatedCandidate.rows.length === 0) {
      return res.status(404).json({ error: 'Failed to fetch updated candidate data' });
    }
    res.json(updatedCandidate.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error patching candidate:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// --- PIPELINE STAGES CRUD ---
// Récupérer toutes les étapes du pipeline
app.get('/api/pipeline-stages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pipeline_stages ORDER BY stage_order ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pipeline stages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Créer une nouvelle étape du pipeline
app.post('/api/pipeline-stages', async (req, res) => {
  const { name, description, stage_order = 0, is_active = true } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  const id = `stage_${Date.now()}`;
  try {
    const result = await pool.query(
      'INSERT INTO pipeline_stages (id, name, description, stage_order, is_active, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [id, name, description, stage_order, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pipeline stage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mettre à jour une étape du pipeline
app.put('/api/pipeline-stages/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, stage_order, is_active } = req.body;
  try {
    const result = await pool.query(
      'UPDATE pipeline_stages SET name = $1, description = $2, stage_order = $3, is_active = $4 WHERE id = $5 RETURNING *',
      [name, description, stage_order, is_active, id]
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

// Mettre à jour le statut d'une étape du pipeline
app.put('/api/pipeline-stages/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const activeStatus = typeof is_active === 'string' ? is_active === 'true' : !!is_active;
  try {
    const result = await pool.query(
      'UPDATE pipeline_stages SET is_active = $1 WHERE id = $2 RETURNING *',
      [activeStatus, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pipeline stage not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pipeline stage status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Supprimer une étape du pipeline
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

// --- UPLOAD DE CV (corrigé) ---
app.post('/api/candidates/:id/cv', uploadCV.single('cv'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    console.error('[CV UPLOAD] Aucun fichier reçu');
    return res.status(400).json({ error: "Aucun fichier n'a été fourni ou le format est incorrect." });
  }
  try {
    // 1. Récupérer le prénom et le nom du candidat en base
    const candidateResult = await pool.query('SELECT firstname, lastname FROM users WHERE id = (SELECT users_id FROM candidates WHERE id = $1)', [id]);
    if (candidateResult.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      console.error('[CV UPLOAD] Candidat non trouvé, suppression du fichier uploadé');
      return res.status(404).json({ error: "Candidat non trouvé." });
    }
    const { firstname, lastname } = candidateResult.rows[0];
    // 2. Générer le nouveau nom de fichier
    const timestamp = Date.now();
    const extension = path.extname(req.file.originalname);
    const safeFirstname = (firstname || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '');
    const safeLastname = (lastname || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '');
    const newFilename = `${safeFirstname}_${safeLastname}_${timestamp}${extension}`;
    const newRelativePath = `/uploads/cvs/${newFilename}`;
    const newFullPath = path.join(__dirname, 'uploads', 'cvs', newFilename);
    // 3. Renommer le fichier sur le disque
    fs.renameSync(req.file.path, newFullPath);
    // 4. Mettre à jour la base avec le nouveau nom et le nom original
    const result = await pool.query(
      'UPDATE candidates SET cv_url = $1, cv_original_filename = $2 WHERE id = $3 RETURNING *',
      [newRelativePath, req.file.originalname, id]
    );
    res.status(200).json({ 
      message: 'CV uploadé avec succès.',
      candidate: result.rows[0]
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Erreur lors de la sauvegarde du CV :", error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// Ajout de logs pour le téléchargement des fichiers statiques
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  console.log(`[DOWNLOAD] Requête pour : ${req.path}`);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`[DOWNLOAD] Fichier trouvé : ${filePath} (${stats.size} octets)`);
  } else {
    console.warn(`[DOWNLOAD] Fichier NON trouvé : ${filePath}`);
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// --- INTERVIEWS CRUD ---
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

// --- CHANGEMENT DE MOT DE PASSE UTILISATEUR ---
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

// --- DROITS RECRUTEUR ---
app.put('/api/recruiter-rights/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const {
    view_candidates,
    create_candidates,
    modify_candidates,
    view_interviews,
    create_interviews,
    modify_interviews,
    modify_statuses,
    modify_stages
  } = req.body;
  try {
    // Vérifier si la ligne existe déjà
    const check = await pool.query('SELECT * FROM recruiter_rights WHERE user_id = $1', [user_id]);
    let result;
    if (check.rows.length > 0) {
      // Update
      result = await pool.query(
        `UPDATE recruiter_rights SET
          view_candidates = $1,
          create_candidates = $2,
          modify_candidates = $3,
          view_interviews = $4,
          create_interviews = $5,
          modify_interviews = $6,
          modify_statuses = $7,
          modify_stages = $8,
          updated_at = NOW()
        WHERE user_id = $9 RETURNING *`,
        [
          view_candidates,
          create_candidates,
          modify_candidates,
          view_interviews,
          create_interviews,
          modify_interviews,
          modify_statuses,
          modify_stages,
          user_id
        ]
      );
    } else {
      // Insert
      result = await pool.query(
        `INSERT INTO recruiter_rights (
          user_id, view_candidates, create_candidates, modify_candidates, view_interviews, create_interviews, modify_interviews, modify_statuses, modify_stages, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING *`,
        [
          user_id,
          view_candidates,
          create_candidates,
          modify_candidates,
          view_interviews,
          create_interviews,
          modify_interviews,
          modify_statuses,
          modify_stages
        ]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating recruiter rights:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/recruiter-rights', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recruiter_rights');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recruiter rights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- STATUTS CANDIDATS ---
app.put('/api/candidate-status/:id', async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;
  try {
    const query = 'UPDATE candidate_statuses SET name = $1, is_active = $2, updated_at = NOW() WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [name, is_active, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Status not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating candidate status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/candidate-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM candidate_statuses');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching candidate statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(port, () => {
  console.log(`✅ Serveur API démarré sur http://localhost:${port}`);
}); 