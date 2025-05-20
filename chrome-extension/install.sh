#!/bin/bash

echo "Building and installing the Chrome extension..."

# Ensure node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clean dist directory
rm -rf dist
mkdir -p dist

# Build TypeScript files
echo "Building TypeScript files..."
npm run build

# Copy static files
echo "Copying static files..."
cp manifest.json dist/
cp popup.html dist/
cp popup.css dist/
cp dark-theme.css dist/
cp detached-popup.html dist/
cp -r icons dist/

# Create certificates directory if using secure WebSocket
mkdir -p certs
if [ ! -f "certs/server.key" ] || [ ! -f "certs/server.crt" ]; then
    echo "Generating self-signed certificates for secure WebSocket..."
    openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes -subj "/CN=localhost"
fi

echo "Build completed! The extension is ready to be loaded in Chrome."
echo ""
echo "To install in Chrome:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' in the top-right corner"
echo "3. Click 'Load unpacked' and select the 'dist' directory"
echo ""
echo "Make sure the VS Code extension is running and the WebSocket server is active on port 3710"