-- Script to create the 'postgres' user role with appropriate permissions
-- Run this as a superuser (e.g., fusedeveloper)

-- Check if the 'postgres' role already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
        -- Create the postgres user with password 'postgres'
        CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER;
        RAISE NOTICE 'Created postgres user with superuser privileges';
    ELSE
        RAISE NOTICE 'The postgres user already exists';
        -- Ensure the postgres user has the correct permissions
        ALTER ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';
        RAISE NOTICE 'Updated postgres user permissions';
    END IF;
END
$$;

-- Grant all privileges on all tables in public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;

-- Grant postgres user access to the database
GRANT ALL PRIVILEGES ON DATABASE fusedb TO postgres;