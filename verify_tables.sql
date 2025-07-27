-- Script de vérification des tables nécessaires pour l'application
-- Exécutez ce script pour vérifier que toutes les tables sont présentes

\echo '=== VERIFICATION DES TABLES ==='

-- Vérifier l'existence de toutes les tables nécessaires
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'users', 'candidates', 'pipeline_stages', 'recruiter_rights', 
            'interviews', 'candidate_comments', 'candidate_statuses'
        ) THEN '✓ REQUIS'
        ELSE '? OPTIONNEL'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo '=== VERIFICATION DE LA COLONNE salary_expectation ==='

-- Vérifier la colonne salary_expectation dans la table candidates
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'candidates' 
  AND column_name = 'salary_expectation';

\echo ''
\echo '=== STRUCTURE DE LA TABLE candidates ==='

-- Afficher toutes les colonnes de la table candidates
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'candidates'
ORDER BY ordinal_position;

\echo ''
\echo '=== COMPTAGE DES DONNEES ==='

-- Compter les enregistrements dans chaque table
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'candidates', COUNT(*) FROM candidates
UNION ALL
SELECT 'pipeline_stages', COUNT(*) FROM pipeline_stages
UNION ALL
SELECT 'recruiter_rights', COUNT(*) FROM recruiter_rights
UNION ALL
SELECT 'interviews', COUNT(*) FROM interviews
UNION ALL
SELECT 'candidate_comments', COUNT(*) FROM candidate_comments
UNION ALL
SELECT 'candidate_statuses', COUNT(*) FROM candidate_statuses
ORDER BY table_name;
