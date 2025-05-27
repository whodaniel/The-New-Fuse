#!/bin/bash

echo "🧪 Testing The New Fuse Extension in Development Host..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the extension directory."
    exit 1
fi

print_info "Preparing extension for development testing..."

# Install dependencies if needed
echo "1️⃣ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Try to build with esbuild (ignore TypeScript errors for now)
echo "2️⃣ Building extension for development..."
print_warning "Building with esbuild (ignoring TypeScript errors)..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Build with esbuild, bundling for testing
npx esbuild src/extension.ts \
    --bundle \
    --outfile=dist/extension.js \
    --format=cjs \
    --platform=node \
    --external:vscode \
    --sourcemap \
    --define:process.env.NODE_ENV=\"development\"

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi
print_status "Build completed"

# Update package.json to use dist instead of out
echo "3️⃣ Updating package.json configuration..."
if grep -q '"main": "./out/extension.js"' package.json; then
    print_warning "Updating main entry point to use dist/ instead of out/"
    sed -i.bak 's/"main": ".\/out\/extension.js"/"main": ".\/dist\/extension.js"/' package.json
    print_status "Updated main entry point"
fi

echo "4️⃣ Opening Extension Development Host..."
print_info "This will:"
print_info "  • Open a new VS Code window"
print_info "  • Load the extension in development mode"
print_info "  • Allow you to test all features"
print_info ""
print_info "In the Extension Development Host window:"
print_info "  • Press F5 to reload the extension"
print_info "  • Check Developer Console (Help > Toggle Developer Tools)"
print_info "  • Look for 'The New Fuse' in Activity Bar"
print_info "  • Try commands via Command Palette (Ctrl+Shift+P)"
print_info ""

# Check if VS Code is available
if command -v code &> /dev/null; then
    print_status "Opening Extension Development Host..."
    code --extensionDevelopmentPath="$(pwd)"
    print_status "Extension Development Host opened!"
    echo ""
    print_info "🎯 Testing Steps:"
    echo "   1. Look for 'The New Fuse' robot icon in Activity Bar"
    echo "   2. Open Command Palette (Cmd+Shift+P)"
    echo "   3. Search for 'The New Fuse' commands"
    echo "   4. Try: 'The New Fuse: Start AI Collaboration'"
    echo "   5. Check the extension's webview panels"
    echo ""
    print_info "🐛 Debug Tips:"
    echo "   • Open Developer Console: Help > Toggle Developer Tools"
    echo "   • Check extension host logs in Output panel"
    echo "   • Reload extension: Developer: Reload Window"
else
    print_error "VS Code 'code' command not found in PATH"
    print_info "You can manually open VS Code and use:"
    print_info "File > Open Folder > Select this directory"
    print_info "Then press F5 to run the extension"
fi

echo ""
print_status "Development testing setup complete!"