#!/bin/bash
set -e

echo "🚀 Setting up simplified React frontend for The New Fuse..."

# Navigate to the frontend directory
cd apps/frontend

# Create a temporary directory for our simplified setup
mkdir -p simplified
cd simplified

# Copy our simplified files
cp ../package.json.simplified ./package.json
cp ../vite.config.simplified.ts ./vite.config.ts
cp ../index.simplified.html ./index.html
mkdir -p src
cp ../src/App.simplified.tsx ./src/App.simplified.tsx
cp ../src/main.simplified.tsx ./src/main.simplified.tsx
cp ../src/styles.css ./src/styles.css

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start the development server
echo "🚀 Starting the development server..."
echo "The application will be available at http://localhost:3000"
npx vite --host 0.0.0.0 --port 3000
