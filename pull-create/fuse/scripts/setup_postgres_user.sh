#!/bin/bash

# Script to set up the postgres user in PostgreSQL
echo "Setting up postgres user in PostgreSQL..."

# Configuration
PG_HOST="localhost"
PG_PORT="5432"
PG_SUPERUSER="fusedeveloper"
PG_PASSWORD="fusepassword"
PG_DATABASE="fusedb"
SQL_SCRIPT="$(dirname "$0")/create_postgres_user.sql"

# Check if the SQL script exists
if [ ! -f "$SQL_SCRIPT" ]; then
    echo "Error: SQL script not found at $SQL_SCRIPT"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

echo "Connecting to PostgreSQL and running script..."

# Run the SQL script as the superuser
PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_SUPERUSER" -d "$PG_DATABASE" -f "$SQL_SCRIPT"

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully set up postgres user!"
    echo "You can now use the following connection string in your application:"
    echo "postgresql://postgres:postgres@localhost:5432/fusedb"
    
    # Update the .env file if it exists
    ENV_FILE="$(dirname "$0")/../.env"
    if [ -f "$ENV_FILE" ]; then
        echo "Updating DATABASE_URL in .env file..."
        sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fusedb?schema=public"|g' "$ENV_FILE"
        echo "✅ Updated .env file"
    else
        echo "Note: No .env file found. You may need to update your database connection string manually."
    fi
else
    echo "❌ Failed to set up postgres user. Please check the error messages above."
    exit 1
fi