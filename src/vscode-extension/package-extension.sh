#!/bin/bash

echo "📦 Packaging The New Fuse Extension..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the extension directory (src/vscode-extension)."
    exit 1
fi

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    echo "To install pnpm, run:"
    echo "  npm install -g pnpm"
    echo "  or"
    echo "  curl -fsSL https://get.pnpm.io/install.sh | sh -"
    exit 1
fi

# Install vsce if not present
echo "1️⃣ Checking for vsce (Visual Studio Code Extension CLI)..."
if ! command -v vsce &> /dev/null; then
    print_warning "vsce not found. Installing globally via pnpm (requires pnpm to be functional)..."
    pnpm install -g @vscode/vsce
    if [ $? -ne 0 ]; then
        print_error "Failed to install vsce. Please ensure pnpm is working or install vsce manually."
        exit 1
    fi
    print_status "vsce installed successfully"
else
    print_status "vsce is already installed"
fi

# Install dependencies using Bun
echo "2️⃣ Installing dependencies using Bun..."
pnpm install --frozen-lockfile
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies using pnpm. Check for pnpm installation or workspace errors."
    exit 1
fi
print_status "Dependencies installed using pnpm"

# Build the extension using Bun
echo "3️⃣ Building extension using Bun..."
pnpm run compile # Assuming 'compile' is the correct build script in package.json
if [ $? -ne 0 ]; then
    print_warning "Build failed with errors (pnpm run compile), but attempting to package anyway..."
    echo "   Attempting fallback build with esbuild..."
    npx esbuild ./src/extension.ts --bundle --outfile=./dist/extension.js --format=cjs --platform=node --external:vscode --allow-overwrite
    if [ $? -ne 0 ]; then
        print_error "Fallback esbuild also failed. Cannot proceed with packaging."
        exit 1
    fi
    print_status "Fallback esbuild completed. Main entry point will be ./dist/extension.js"
    if ! grep -q '"main": "./dist/extension.js"' package.json; then
        print_warning "Updating main entry point to ./dist/extension.js due to fallback build."
        sed -i.bak 's#"main": ".*"#"main": "./dist/extension.js"#' package.json && rm package.json.bak
        print_status "Updated main entry point to ./dist/extension.js"
    fi
else
    print_status "Build completed successfully (pnpm run compile)"
fi

# Package the extension
echo "4️⃣ Creating .vsix package..."
if ! pnpm dlx vsce package; then
    print_error "Failed to create .vsix package using pnpm dlx vsce"
    exit 1
fi
print_status "Extension packaged successfully using pnpm dlx vsce"

# Find the created .vsix file
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -n1)
if [ -n "$VSIX_FILE" ]; then
    print_status "Extension packaged successfully: $VSIX_FILE"
    echo ""
    echo "🎉 Package created successfully!"
    echo "📁 File: \$VSIX_FILE"
    echo "📋 Size: \$(du -h "\$VSIX_FILE" | cut -f1)"
    echo ""
    echo "🔧 To install the extension:"
    echo "   1. Open VS Code"
    echo "   2. Go to Extensions (Ctrl+Shift+X)"
    echo "   3. Click '...' menu → 'Install from VSIX...'"
    echo "   4. Select: \$VSIX_FILE"
    echo ""
    echo "🧪 Or install via command line:"
    echo "   code --install-extension \"\$(pwd)/\$VSIX_FILE\""
else
    print_error "No .vsix file found after packaging"
    exit 1
fi
