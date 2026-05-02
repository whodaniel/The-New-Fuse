#!/bin/bash

# Environment setup script
echo "Setting up environment configurations..."

# Development environment
cat > .env.development << EOL
VITE_API_URL=http://localhost:3001
POSTGRES_DB=the_new_fuse_dev
REDIS_URL=redis://localhost:6379
EOL

# Production environment
cat > .env.production << EOL
VITE_API_URL=https://api.production.com
POSTGRES_DB=the_new_fuse_prod
REDIS_URL=redis://redis:6379
EOL

# Test environment
cat > .env.test << EOL
VITE_API_URL=http://localhost:3001
POSTGRES_DB=the_new_fuse_test
REDIS_URL=redis://redis:6379
EOL

echo "Environment files created successfully!"