#!/bin/bash
set -e

echo "🚀 Setting up The New Fuse frontend application using npm..."

# Navigate to the frontend directory
cd apps/frontend

# Clean up any previous installations
echo "🧹 Cleaning up previous installations..."
rm -rf node_modules
rm -rf dist

# Install dependencies using npm
echo "📦 Installing dependencies with npm..."
npm install

# Start the development server
echo "🚀 Starting the development server..."
echo "The application will be available at http://localhost:3000"
npm run dev
