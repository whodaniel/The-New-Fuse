#!/bin/bash
set -e

echo "🚀 Launching The New Fuse in production mode..."

# Verify environment variables
if [ ! -f ".env.production" ]; then
    echo "❌ Missing .env.production file"
    exit 1
fi

# Build all packages and applications
echo "📦 Building all packages..."
yarn build

# Generate Drizzle client
echo "🗄️ Generating database client..."
yarn drizzle:generate

# Run database migrations
echo "📊 Running database migrations..."
yarn drizzle:migrate

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker/production.yml up -d

echo "✨ The New Fuse is now running in production mode!"
