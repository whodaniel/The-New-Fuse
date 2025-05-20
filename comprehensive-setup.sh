#!/bin/bash
set -e

echo "🚀 Setting up The New Fuse project comprehensively..."

# Step 1: Fix package.json to use a valid packageManager field
echo "🔧 Fixing package.json..."
sed -i.bak 's/"packageManager": "npm@10.2.4"/"packageManager": "yarn@3.6.0"/' package.json

# Step 2: Set up Yarn properly
echo "🧶 Setting up Yarn..."
corepack enable
yarn set version berry
yarn config set nodeLinker node-modules

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Step 4: Build essential packages in the correct order
echo "🔨 Building essential packages..."
yarn build:types
yarn build:utils
yarn build:core
yarn build:ui

# Step 5: Start the frontend development server
echo "🚀 Starting the frontend development server..."
cd apps/frontend
yarn dev

echo "✅ Setup complete! The application should be running at http://localhost:3000"
