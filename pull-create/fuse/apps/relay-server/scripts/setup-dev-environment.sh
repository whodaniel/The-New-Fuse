#!/bin/bash
set -e

echo "🚀 Setting up The New Fuse development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed." >&2; exit 1; }
command -v bun >/dev/null 2>&1 || { echo "❌ Bun is required but not installed." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed." >&2; exit 1; }

# Clean existing artifacts
echo "🧹 Cleaning previous builds..."
pnpm run clean

# Setup environment files
echo "⚙️ Setting up environment configuration..."
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/frontend/.env.example apps/frontend/.env

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build core packages in correct order
echo "🔨 Building core packages..."
cd packages/types && pnpm run build && cd ../..
cd packages/utils && pnpm run build && cd ../..
cd packages/core && pnpm run build && cd ../..
cd packages/database && pnpm run build && cd ../..
cd packages/feature-tracker && pnpm run build && cd ../..
bun --filter @the-new-fuse/feature-suggestions run build

# Setup database
echo "🗄️ Setting up database..."
bun --filter @the-new-fuse/database run generate
bun --filter @the-new-fuse/database run migrate

# Start development infrastructure
echo "🛠️ Starting development infrastructure..."
docker-compose -f docker/development.yml up -d

# Verify services health
echo "🏥 Verifying services health..."
./scripts/verify-services.sh

echo "✅ Development environment setup complete!"