#!/bin/bash
set -e

echo "🔧 Setting up development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v yarn >/dev/null 2>&1 || { echo "Yarn is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }

# Create environment files
echo "Creating environment files..."
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env

# Install dependencies
echo "Installing dependencies..."
yarn install

# Build core packages
echo "Building core packages..."
yarn workspace @the-new-fuse/types build
yarn workspace @the-new-fuse/utils build
yarn workspace @the-new-fuse/core build
yarn workspace @the-new-fuse/database build

# Generate Drizzle client
echo "Generating Drizzle client..."
yarn workspace @the-new-fuse/api drizzle generate

# Start development environment
echo "Starting development environment..."
docker-compose -f docker/docker-compose.dev.yml up -d

echo "✨ Development environment setup complete!"
echo "🚀 Run 'yarn dev' to start the development servers"
