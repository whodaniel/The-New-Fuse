#!/bin/bash
set -e

echo "🚀 Setting up standalone React application for The New Fuse..."

# Navigate to the standalone React directory
cd standalone-react

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start the development server
echo "🚀 Starting the development server..."
echo "The application will be available at http://localhost:3000"
pnpm run dev
