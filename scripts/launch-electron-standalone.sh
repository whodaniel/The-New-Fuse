#!/bin/bash
# Launch Electron App Standalone - Just the Modern UI
echo "🚀 Launching Electron Modern Hub (Standalone)..."

# Clear ports first
echo "Clearing ports..."
node scripts/clear-ports.js

# Navigate to electron app and launch
echo "Starting Electron app..."
cd apps/electron-desktop

# Build the app first
echo "Building Electron app..."
pnpm run build

# Launch electron directly without vite dev server
echo "Launching Electron..."
npx electron dist/main/main.js

echo "Electron app closed."