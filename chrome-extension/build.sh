#!/bin/bash

# TNF AI Bridge - Simple Build Script
echo "Building TNF AI Bridge Chrome Extension..."

# Create dist directory
mkdir -p dist

# Copy extension files
cp manifest.json dist/
cp background.js dist/
cp content.js dist/
cp popup.html dist/
cp popup.js dist/

# Create README for installation
cat > dist/README.md << 'EOF'
# TNF AI Bridge Chrome Extension

## Installation

1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `dist` folder

## Usage

1. Make sure TNF relay is running on port 3001
2. Navigate to ChatGPT, Claude, or other supported AI sites
3. Use the extension popup to send messages or let the TNF relay route messages

## Supported Sites

- ChatGPT (https://chatgpt.com)
- Claude (https://claude.ai)
- Gemini (https://gemini.google.com)
- Perplexity (https://www.perplexity.ai)
- Poe (https://poe.com)
- Character.AI (https://character.ai)

## Architecture

The extension acts as a bridge between web-based AI chats and the TNF relay system, enabling AI-to-AI communication.
EOF

echo "Extension built successfully in dist/ folder"
echo "To install: Load unpacked extension from chrome://extensions/"