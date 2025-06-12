#!/bin/bash
set -e

echo "🚀 Setting up The New Fuse project comprehensively..."

# Step 1: Fix package.json to use a valid packageManager field
echo "🔧 Fixing package.json..."
sed -i.bak 's/"packageManager": "npm@10.2.4"/"packageManager": "bun@1.1.38"/' package.json
sed -i.bak 's/"packageManager": "yarn@[^"]*"/"packageManager": "bun@1.1.38"/' package.json

# Step 2: Set up Bun properly
echo "⚡ Setting up Bun..."
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Remove old yarn files if they exist
if [ -f yarn.lock ]; then
    echo "Removing old yarn.lock file..."
    rm yarn.lock
fi

if [ -d .yarn ]; then
    echo "Removing old .yarn directory..."
    rm -rf .yarn
fi

if [ -f .yarnrc.yml ]; then
    echo "Removing old .yarnrc.yml file..."
    rm .yarnrc.yml
fi

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
bun install

# Step 4: Build essential packages in the correct order
echo "🔨 Building essential packages..."
bun run build

# Step 5: Start the frontend development server
echo "🚀 Starting the frontend development server..."
cd apps/frontend
bun run dev

echo "✅ Setup complete! The application should be running at http://localhost:3000"
