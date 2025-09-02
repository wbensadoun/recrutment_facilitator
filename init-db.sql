-- Database initialization script for automatic deployment
-- This script will be executed automatically when the database starts

\echo 'Starting database initialization...'

-- The latest_backup.sql will be loaded automatically by PostgreSQL
-- This script adds additional configurations

-- Add password reset columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_token') THEN
        ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
        RAISE NOTICE 'Added reset_token column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_token_expiry') THEN
        ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
        RAISE NOTICE 'Added reset_token_expiry column to users table';
    END IF;
END $$;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Verify tables exist
\echo 'Verifying database tables...'
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;

-- Show row counts
\echo 'Database initialization completed successfully!'
\echo 'Row counts:'
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'candidates', COUNT(*) FROM candidates
UNION ALL
SELECT 'pipeline_stages', COUNT(*) FROM pipeline_stages
ORDER BY table_name;
