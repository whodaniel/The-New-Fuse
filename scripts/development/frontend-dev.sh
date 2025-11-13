#!/bin/bash
set -e

echo "🚀 Setting up The New Fuse frontend application..."

# Navigate to the frontend directory
cd apps/frontend

# Clean up any previous installations
echo "🧹 Cleaning up previous installations..."
rm -rf node_modules
rm -rf dist
rm -rf .turbo

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start the development server
echo "🚀 Starting the development server..."
echo "The application will be available at http://localhost:5173"
npx vite
