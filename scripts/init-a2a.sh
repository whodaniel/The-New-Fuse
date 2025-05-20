#!/bin/bash

# Initialize database
echo "Initializing A2A database..."
npx prisma migrate deploy
npx prisma generate

# Set up configuration
echo "Setting up A2A configuration..."
node dist/scripts/setup-a2a-config.js

# Start services
echo "Starting A2A services..."
if [ "$NODE_ENV" = "production" ]; then
    node dist/main
else
    npm run start:dev
fi