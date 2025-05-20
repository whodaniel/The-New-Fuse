#!/bin/bash

# Professional build script for The New Fuse VS Code Extension
echo "======================================"
echo "  Building The New Fuse VS Extension  "
echo "======================================"

# Create necessary directories
mkdir -p ./dist
mkdir -p ./resources
mkdir -p ./media/css
mkdir -p ./media/js

# Clean up node_modules if requested
if [ "$1" == "--clean" ]; then
  echo "🧹 Cleaning up node_modules..."
  rm -rf ./node_modules
fi

# Dependencies are managed by the root Yarn workspace; skip local install
echo "ℹ️ Skipping dependency installation (workspace root handles dependencies)"

# Clean up old build artifacts
echo "🧹 Cleaning up previous build artifacts..."
rm -rf ./dist/*

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npx tsc -p tsconfig.json # Explicitly specify the config file
if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed. Please fix the errors and try again."
  exit 1
fi

# Copy non-typescript files to dist if needed
echo "📋 Copying resources..."
cp -r ./resources ./dist/
if [ -d "./media" ]; then
  cp -r ./media ./dist/
fi

# Copy configuration files
if [ -f "./mcp_config.json" ]; then
  cp ./mcp_config.json ./dist/
fi

# Create CSS files if they don't exist
echo "📋 Setting up UI resources..."
if [ ! -f "./media/css/reset.css" ]; then
  echo "Creating reset.css..."
  cat > ./media/css/reset.css << EOF
html {
  box-sizing: border-box;
  font-size: 13px;
}

*,
*:before,
*:after {
  box-sizing: inherit;
}

body, h1, h2, h3, h4, h5, h6, p, ol, ul {
  margin: 0;
  padding: 0;
  font-weight: normal;
}

img {
  max-width: 100%;
  height: auto;
}
EOF
fi

if [ ! -f "./media/css/vscode.css" ]; then
  echo "Creating vscode.css..."
  cat > ./media/css/vscode.css << EOF
body {
  background-color: transparent;
  color: var(--vscode-editor-foreground);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  margin: 0;
  padding: 0 20px;
  line-height: 1.5;
}

h1, h2, h3 {
  font-weight: normal;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 1.5em;
}

h2 {
  font-size: 1.3em;
}

h3 {
  font-size: 1.1em;
}

button {
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  padding: 6px 14px;
  font-family: var(--vscode-font-family);
  cursor: pointer;
  outline: 1px solid transparent;
  border-radius: 2px;
}

button:hover {
  background-color: var(--vscode-button-hoverBackground);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-button {
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.secondary-button {
  background-color: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
}
EOF
fi

if [ ! -f "./media/css/fuse.css" ]; then
  echo "Creating fuse.css..."
  cat > ./media/css/fuse.css << EOF
.panel-container {
  padding: 15px 5px;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--vscode-panel-border);
  padding-bottom: 8px;
}

.panel-title .codicon {
  margin-right: 8px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-badge {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot.active {
  background-color: #5cb85c;
}

.status-dot.inactive {
  background-color: #d9534f;
}

.button-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.client-list {
  border: 1px solid var(--vscode-panel-border);
  border-radius: 3px;
  margin-top: 10px;
  margin-bottom: 15px;
  padding: 8px;
  max-height: 150px;
  overflow-y: auto;
  font-size: 12px;
}

.client-item {
  padding: 5px;
  border-bottom: 1px solid var(--vscode-panel-border);
  display: flex;
  justify-content: space-between;
}

.client-item:last-child {
  border-bottom: none;
}

.client-id {
  font-weight: bold;
}

.client-details {
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
}

.panel-section {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid var(--vscode-panel-border);
}

.debug-info {
  font-family: var(--vscode-editor-font-family);
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  margin-top: 5px;
}

.empty-state {
  color: var(--vscode-descriptionForeground);
  text-align: center;
  padding: 10px;
  font-style: italic;
}
EOF
fi

# Create .vscodeignore if it doesn't exist
if [ ! -f "./.vscodeignore" ]; then
  echo "📝 Creating .vscodeignore file..."
  cat > ./.vscodeignore << EOF
.vscode/**
.vscode-test/**
src/**
**/*.map
.gitignore
tsconfig.json
webpack.config.js
**/tsconfig.json
**/webpack.config.js
**/.eslintrc.json
**/*.ts
**/*.tsx
node_modules/**
!node_modules/@the-new-fuse/**
**/*.vsix
.yarnrc
**/yarn.lock
**/package-lock.json
.yarn/**
EOF
fi

echo "✅ Build completed successfully!"
echo "You can now run the extension with: code --extensionDevelopmentPath=\"$(pwd)\""
echo ""
echo "📦 To package a VSIX file, run: npm run package"