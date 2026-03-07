#!/bin/bash
set -e

echo "🔧 Setting up development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v bun >/dev/null 2>&1 || { echo "Yarn is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }

# Create environment files
echo "Creating environment files..."
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build core packages
echo "Building core packages..."
bun --filter @the-new-fuse/types run build
bun --filter @the-new-fuse/utils run build
bun --filter @the-new-fuse/core run build
bun --filter @the-new-fuse/database run build

# Generate Drizzle client
echo "Generating Drizzle client..."
bun --filter @the-new-fuse/api run drizzle generate

# Start development environment
echo "Starting development environment..."
docker-compose -f docker/docker-compose.dev.yml up -d

echo "✨ Development environment setup complete!"
echo "🚀 Run 'pnpm run dev' to start the development servers"
