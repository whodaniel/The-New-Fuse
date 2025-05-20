#!/bin/bash
set -e

echo "🚀 Setting up and running the React frontend for The New Fuse..."

# Navigate to the frontend directory
cd apps/frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the development server
echo "🚀 Starting the development server..."
echo "The application will be available at http://localhost:3000"
npm run dev
