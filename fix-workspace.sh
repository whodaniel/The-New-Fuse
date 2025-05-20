#!/bin/bash
set -e

echo "🧹 Deep Cleaning Workspace..."
rm -rf .yarn node_modules yarn.lock
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "dist" -type d -exec rm -rf {} +

echo "📋 Creating fresh .yarnrc.yml..."
cat > .yarnrc.yml << EOL
nodeLinker: node-modules
pnpMode: loose
enableGlobalCache: false
enableScripts: true
enableTelemetry: false
EOL

echo "🔄 Initializing Yarn..."
corepack enable
yarn set version 3.6.3

echo "⚙️ Installing dependencies..."
yarn install

echo "🏗️ Building the workspace..."
yarn build

echo "✅ Setup complete!"