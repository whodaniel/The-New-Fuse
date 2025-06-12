#!/bin/bash
set -e

echo "🚀 Setting up The New Fuse development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed." >&2; exit 1; }
command -v bun >/dev/null 2>&1 || { echo "❌ Bun is required but not installed." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed." >&2; exit 1; }

# Clean existing artifacts
echo "🧹 Cleaning previous builds..."
bun run clean

# Setup environment files
echo "⚙️ Setting up environment configuration..."
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env

# Install dependencies
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# Build core packages in correct order
echo "🔨 Building core packages..."
cd packages/types && bun run build && cd ../..
cd packages/utils && bun run build && cd ../..
cd packages/core && bun run build && cd ../..
cd packages/database && bun run build && cd ../..
cd packages/feature-tracker && bun run build && cd ../..
yarn workspace @the-new-fuse/feature-suggestions build

# Setup database
echo "🗄️ Setting up database..."
yarn workspace @the-new-fuse/database generate
yarn workspace @the-new-fuse/database migrate

# Start development infrastructure
echo "🛠️ Starting development infrastructure..."
docker-compose -f docker/development.yml up -d

# Verify services health
echo "🏥 Verifying services health..."
./scripts/verify-services.sh

echo "✅ Development environment setup complete!"