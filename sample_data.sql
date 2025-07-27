-- Ajout de la colonne salary_expectation à la table candidates si elle n'existe pas
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS salary_expectation VARCHAR(255);

-- Script pour insérer des données d'exemple dans toutes les tables
-- 4 lignes par table avec des données réalistes

-- 1. Insérer des utilisateurs (users)
INSERT INTO users (firstname, lastname, email, password, role, status) VALUES
('Marie', 'Dupont', 'marie.dupont@recrutement.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'recruiter', 'active'),
('Jean', 'Martin', 'jean.martin@recrutement.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'recruiter', 'active'),
('Sophie', 'Bernard', 'sophie.bernard@candidat.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'candidate', 'active'),
('Pierre', 'Moreau', 'pierre.moreau@candidat.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'candidate', 'active');

-- 2. Insérer des statuts de candidats (candidate_statuses)
INSERT INTO candidate_statuses (name, color, is_default, is_active) VALUES
('Nouveau', '#4CAF50', true, true),
('En cours d''évaluation', '#2196F3', false, true),
('Entretien programmé', '#FF9800', false, true),
('Retenu', '#9C27B0', false, true);

-- 3. Insérer des étapes de pipeline (pipeline_stages)
INSERT INTO pipeline_stages (name, description, stage_order, is_active, is_default) VALUES
('Candidature reçue', 'Première étape - candidature soumise', 1, true, true),
('Présélection CV', 'Analyse du CV et des compétences', 2, true, false),
('Entretien RH', 'Premier entretien avec les ressources humaines', 3, true, false),
('Entretien technique', 'Évaluation des compétences techniques', 4, true, false);

-- 4. Insérer des candidats (candidates)
INSERT INTO candidates (users_id, phone, "position", experience, current_stage, status, recruiter_id) VALUES
(3, '+33 6 12 34 56 78', 'Développeur Full Stack', '3 ans d''expérience en React et Node.js', 'Entretien RH', 'actif', 1),
(4, '+33 6 98 76 54 32', 'Designer UX/UI', '5 ans d''expérience en design d''interfaces', 'Présélection CV', 'actif', 2),
(3, '+33 6 11 22 33 44', 'Chef de projet digital', '7 ans en gestion de projets web', 'Entretien technique', 'actif', 1),
(4, '+33 6 55 66 77 88', 'Data Analyst', '2 ans d''expérience en analyse de données', 'Candidature reçue', 'actif', 2);

-- 5. Insérer des droits recruteur (recruiter_rights)
INSERT INTO recruiter_rights (user_id, view_candidates, create_candidates, modify_candidates, view_interviews, create_interviews, modify_interviews, modify_statuses, modify_stages) VALUES
(1, true, true, true, true, true, true, true, true),
(2, true, true, true, true, true, true, false, false),
(1, true, false, false, true, false, false, false, false),
(2, true, true, false, true, true, false, false, false);

-- 6. Insérer des entretiens (interviews)
INSERT INTO interviews (candidate_id, recruiter_id, scheduled_date, stage_id, notes) VALUES
(1, 1, '2025-01-30 14:00:00+01', 3, 'Candidat motivé, bonnes compétences techniques'),
(2, 2, '2025-01-31 10:30:00+01', 2, 'Portfolio impressionnant, à approfondir'),
(3, 1, '2025-02-01 16:00:00+01', 4, 'Excellente expérience en gestion d''équipe'),
(4, 2, '2025-02-02 09:00:00+01', 1, 'Profil junior mais très prometteur');

-- 7. Insérer des commentaires sur candidats (candidate_comments)
INSERT INTO candidate_comments (candidate_id, user_id, comment) VALUES
(1, 1, 'Très bon profil technique, maîtrise bien React et Node.js'),
(2, 2, 'Design portfolio de qualité, créativité remarquable'),
(3, 1, 'Leadership naturel, expérience solide en gestion de projets'),
(4, 2, 'Potentiel intéressant, motivation évidente pour l''analyse de données');

-- Mettre à jour les séquences pour éviter les conflits d'ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('candidate_statuses_id_seq', (SELECT MAX(id) FROM candidate_statuses));
SELECT setval('pipeline_stages_id_seq', (SELECT MAX(id) FROM pipeline_stages));
SELECT setval('candidates_id_seq', (SELECT MAX(id) FROM candidates));
SELECT setval('recruiter_rights_id_seq', (SELECT MAX(id) FROM recruiter_rights));
SELECT setval('interviews_id_seq', (SELECT MAX(id) FROM interviews));
SELECT setval('candidate_comments_id_seq', (SELECT MAX(id) FROM candidate_comments));
