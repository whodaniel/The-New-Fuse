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
    print_error "package.json not found. Please run this script from the extension directory."
    exit 1
fi

# Install vsce if not present
echo "1️⃣ Checking for vsce (Visual Studio Code Extension CLI)..."
if ! command -v vsce &> /dev/null; then
    print_warning "vsce not found. Installing globally..."
    npm install -g @vscode/vsce
    if [ $? -ne 0 ]; then
        print_error "Failed to install vsce"
        exit 1
    fi
    print_status "vsce installed successfully"
else
    print_status "vsce is already installed"
fi

# Install dependencies
echo "2️⃣ Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_status "Dependencies installed"

# Build the extension (this will try to compile despite type errors)
echo "3️⃣ Building extension..."
npm run build
if [ $? -ne 0 ]; then
    print_warning "Build failed with errors, but attempting to package anyway..."
    # Try esbuild directly to create a basic bundle
    echo "   Attempting fallback build with esbuild..."
    npx esbuild src/extension.ts --bundle --outfile=dist/extension.js --format=cjs --platform=node --external:vscode
    if [ $? -ne 0 ]; then
        print_error "Fallback build also failed"
        exit 1
    fi
    print_status "Fallback build completed"
else
    print_status "Build completed successfully"
fi

# Update package.json main entry point if needed
echo "4️⃣ Checking package.json configuration..."
if grep -q '"main": "./out/extension.js"' package.json; then
    print_warning "Updating main entry point to use dist/ instead of out/"
    sed -i.bak 's/"main": ".\/out\/extension.js"/"main": ".\/dist\/extension.js"/' package.json
    print_status "Updated main entry point"
fi

# Package the extension
echo "5️⃣ Creating .vsix package..."
vsce package --allow-star-activation --no-dependencies
if [ $? -ne 0 ]; then
    print_error "Failed to create .vsix package"
    
    # Try with less strict options
    print_warning "Trying with relaxed validation..."
    vsce package --allow-star-activation --no-dependencies --skip-license
    if [ $? -ne 0 ]; then
        print_error "Package creation failed even with relaxed validation"
        exit 1
    fi
fi

# Find the created .vsix file
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -n1)
if [ -n "$VSIX_FILE" ]; then
    print_status "Extension packaged successfully: $VSIX_FILE"
    echo ""
    echo "🎉 Package created successfully!"
    echo "📁 File: $VSIX_FILE"
    echo "📋 Size: $(du -h "$VSIX_FILE" | cut -f1)"
    echo ""
    echo "🔧 To install the extension:"
    echo "   1. Open VS Code"
    echo "   2. Go to Extensions (Ctrl+Shift+X)"
    echo "   3. Click '...' menu → 'Install from VSIX...'"
    echo "   4. Select: $VSIX_FILE"
    echo ""
    echo "🧪 Or install via command line:"
    echo "   code --install-extension $VSIX_FILE"
else
    print_error "No .vsix file found after packaging"
    exit 1
fi