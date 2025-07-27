-- Script de vérification complète du schéma de base de données
-- Vérifie toutes les tables, colonnes et relations nécessaires

\echo '================================================================'
\echo '=== VERIFICATION COMPLETE DU SCHEMA DE BASE DE DONNEES ==='
\echo '================================================================'

\echo ''
\echo '=== 1. VERIFICATION DES TABLES EXISTANTES ==='
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
ORDER BY 
    CASE WHEN table_name IN ('users', 'candidates', 'pipeline_stages', 'recruiter_rights', 'interviews', 'candidate_comments', 'candidate_statuses') THEN 1 ELSE 2 END,
    table_name;

\echo ''
\echo '=== 2. STRUCTURE DE LA TABLE users ==='
\echo 'Colonnes requises: id, firstname, lastname, email, password, role, status, created_at, updated_at'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'firstname', 'lastname', 'email', 'password', 'role', 'status', 'created_at', 'updated_at') THEN '✓'
        ELSE '?'
    END as required
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

\echo ''
\echo '=== 3. STRUCTURE DE LA TABLE candidates ==='
\echo 'Colonnes requises: id, users_id, phone, position, experience, current_stage, status, salary_expectation, recruiter_id, last_interview_date, cv_url, created_at, updated_at'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'users_id', 'phone', 'position', 'experience', 'current_stage', 'status', 'salary_expectation', 'recruiter_id', 'last_interview_date', 'cv_url', 'created_at', 'updated_at') THEN '✓'
        ELSE '?'
    END as required
FROM information_schema.columns 
WHERE table_name = 'candidates'
ORDER BY ordinal_position;

\echo ''
\echo '=== 4. STRUCTURE DE LA TABLE pipeline_stages ==='
\echo 'Colonnes requises: id, name, description, stage_order, is_active, is_default, created_at, updated_at'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'name', 'description', 'stage_order', 'is_active', 'is_default', 'created_at', 'updated_at') THEN '✓'
        ELSE '?'
    END as required
FROM information_schema.columns 
WHERE table_name = 'pipeline_stages'
ORDER BY ordinal_position;

\echo ''
\echo '=== 5. STRUCTURE DE LA TABLE interviews ==='
\echo 'Colonnes requises: id, candidate_id, recruiter_id, scheduled_date, stage_id, notes, duration, created_at, updated_at'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'candidate_id', 'recruiter_id', 'scheduled_date', 'stage_id', 'notes', 'duration', 'created_at', 'updated_at') THEN '✓'
        ELSE '?'
    END as required
FROM information_schema.columns 
WHERE table_name = 'interviews'
ORDER BY ordinal_position;

\echo ''
\echo '=== 6. STRUCTURE DE LA TABLE recruiter_rights ==='
\echo 'Colonnes requises: id, user_id, view_candidates, create_candidates, modify_candidates, view_interviews, create_interviews, modify_interviews, modify_statuses, modify_stages'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'view_candidates', 'create_candidates', 'modify_candidates', 'view_interviews', 'create_interviews', 'modify_interviews', 'modify_statuses', 'modify_stages') THEN '✓'
        ELSE '?'
    END as required
FROM information_schema.columns 
WHERE table_name = 'recruiter_rights'
ORDER BY ordinal_position;

\echo ''
\echo '=== 7. STRUCTURE DE LA TABLE candidate_comments ==='
\echo 'Colonnes requises: id, candidate_id, user_id, comment, created_at, updated_at'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'candidate_id', 'user_id', 'comment', 'created_at', 'updated_at') THEN '✓'
        ELSE '?'
    END as required
FROM information_schema.columns 
WHERE table_name = 'candidate_comments'
ORDER BY ordinal_position;

\echo ''
\echo '=== 8. STRUCTURE DE LA TABLE candidate_statuses ==='
\echo 'Colonnes requises: id, name, color, is_default, is_active, created_at, updated_at'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'name', 'color', 'is_default', 'is_active', 'created_at', 'updated_at') THEN '✓'
        ELSE '?'
    END as required
FROM information_schema.columns 
WHERE table_name = 'candidate_statuses'
ORDER BY ordinal_position;

\echo ''
\echo '=== 9. VERIFICATION DES CLES ETRANGERES (FOREIGN KEYS) ==='
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema='public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '=== 10. VERIFICATION DES INDEX ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo '=== 11. VERIFICATION DES SEQUENCES ==='
SELECT 
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

\echo ''
\echo '=== 12. COMPTAGE DES DONNEES PAR TABLE ==='
DO $$
DECLARE
    table_name text;
    row_count integer;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        EXECUTE 'SELECT COUNT(*) FROM ' || table_name INTO row_count;
        RAISE NOTICE '% : % lignes', table_name, row_count;
    END LOOP;
END $$;

\echo ''
\echo '=== 13. VERIFICATION DES RELATIONS CRITIQUES ==='
\echo 'Test des jointures principales utilisées dans l''application:'

\echo ''
\echo '--- Relation candidates -> users (users_id) ---'
SELECT 
    'candidates -> users' as relation,
    COUNT(*) as total_candidates,
    COUNT(u.id) as candidates_with_valid_user,
    COUNT(*) - COUNT(u.id) as orphaned_candidates
FROM candidates c
LEFT JOIN users u ON c.users_id = u.id;

\echo ''
\echo '--- Relation interviews -> candidates (candidate_id) ---'
SELECT 
    'interviews -> candidates' as relation,
    COUNT(*) as total_interviews,
    COUNT(c.id) as interviews_with_valid_candidate,
    COUNT(*) - COUNT(c.id) as orphaned_interviews
FROM interviews i
LEFT JOIN candidates c ON i.candidate_id = c.id;

\echo ''
\echo '--- Relation interviews -> users/recruiters (recruiter_id) ---'
SELECT 
    'interviews -> recruiters' as relation,
    COUNT(*) as total_interviews,
    COUNT(u.id) as interviews_with_valid_recruiter,
    COUNT(*) - COUNT(u.id) as interviews_without_recruiter
FROM interviews i
LEFT JOIN users u ON i.recruiter_id = u.id AND u.role = 'recruiter';

\echo ''
\echo '--- Relation candidate_comments -> candidates (candidate_id) ---'
SELECT 
    'candidate_comments -> candidates' as relation,
    COUNT(*) as total_comments,
    COUNT(c.id) as comments_with_valid_candidate,
    COUNT(*) - COUNT(c.id) as orphaned_comments
FROM candidate_comments cc
LEFT JOIN candidates c ON cc.candidate_id = c.id;

\echo ''
\echo '--- Relation recruiter_rights -> users (user_id) ---'
SELECT 
    'recruiter_rights -> users' as relation,
    COUNT(*) as total_rights,
    COUNT(u.id) as rights_with_valid_user,
    COUNT(*) - COUNT(u.id) as orphaned_rights
FROM recruiter_rights rr
LEFT JOIN users u ON rr.user_id = u.id;

\echo ''
\echo '=== 14. VERIFICATION DES TYPES DE DONNEES CRITIQUES ==='

\echo ''
\echo '--- Vérification du type de salary_expectation ---'
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    CASE 
        WHEN data_type IN ('character varying', 'varchar', 'text') THEN '✓ CORRECT (VARCHAR)'
        WHEN data_type = 'integer' THEN '⚠ ANCIEN TYPE (INTEGER)'
        ELSE '❌ TYPE INATTENDU'
    END as status
FROM information_schema.columns 
WHERE table_name = 'candidates' 
  AND column_name = 'salary_expectation';

\echo ''
\echo '--- Vérification des types ENUM ---'
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role')
ORDER BY t.typname, e.enumsortorder;

\echo ''
\echo '================================================================'
\echo '=== FIN DE LA VERIFICATION ==='
\echo '================================================================'
