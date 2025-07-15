require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'recruitment_facilitator'
});

async function addRecruiter() {
  try {
    // Lire le fichier JSON
    const recruiterData = JSON.parse(fs.readFileSync(path.join(__dirname, 'add_recruiter.json'), 'utf8'));
    console.log('Données du recruteur à ajouter:', recruiterData);
    
    // Générer un UUID pour l'ID du recruteur
    const recruiterId = uuidv4();
    
    // Insérer le recruteur dans la base de données
    const result = await pool.query(
      'INSERT INTO recruiters (id, name, email, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [recruiterId, recruiterData.name, recruiterData.email, recruiterData.status]
    );
    
    console.log('Recruteur ajouté avec succès:', result.rows[0]);
    
    // Vérifier que le recruteur a bien été ajouté
    const checkResult = await pool.query('SELECT * FROM recruiters WHERE email = $1', [recruiterData.email]);
    console.log('Vérification - recruteur dans la base de données:', checkResult.rows[0]);
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout du recruteur:', error);
    console.error('Code d\'erreur:', error.code);
    console.error('Détail:', error.detail);
  } finally {
    // Fermer la connexion à la base de données
    pool.end();
  }
}

// Exécuter la fonction
addRecruiter();
