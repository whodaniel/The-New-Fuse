#!/bin/bash

# The New Fuse - Production Deployment Script
# This script builds and prepares the frontend for production deployment

set -e  # Exit on any error

echo "🚀 Starting Production Build for The New Fuse..."

# Change to frontend directory
cd "$(dirname "$0")"

# Check if required tools are installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is required but not installed. Please install bun first."
    exit 1
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf .vite/

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Run linting (if available)
if grep -q '"lint"' package.json; then
    echo "🔍 Running linter..."
    bun run lint || echo "⚠️  Linting warnings found, continuing..."
fi

# Run type checking (if available)
if grep -q '"type-check"' package.json; then
    echo "🔧 Running type check..."
    bun run type-check || echo "⚠️  Type check warnings found, continuing..."
fi

# Build for production
echo "🏗️  Building for production..."
NODE_ENV=production bun run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: Build failed - index.html not found"
    exit 1
fi

# Calculate build size
echo "📊 Build Statistics:"
echo "Total build size: $(du -sh dist | cut -f1)"
echo "Assets:"
find dist/assets -name "*.js" -o -name "*.css" | head -10 | while read file; do
    echo "  $(basename "$file"): $(du -sh "$file" | cut -f1)"
done

# Optional: Test build locally
if command -v python3 &> /dev/null; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "To test locally, run:"
    echo "  cd dist && python3 -m http.server 8080"
    echo "  Then open http://localhost:8080"
else
    echo "✅ Build completed successfully!"
    echo "The 'dist' directory contains your production build."
fi

echo ""
echo "🚀 Production build ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Upload the 'dist' directory to your web server"
echo "2. Configure your web server for SPA routing (redirect all routes to index.html)"
echo "3. Update environment variables in production:"
echo "   - VITE_API_URL to your production API URL"
echo "   - VITE_WS_URL to your production WebSocket URL"
echo "   - Other environment variables as needed"
echo ""
echo "For CDN deployment:"
echo "- Upload 'dist/assets/' to your CDN"
echo "- Update VITE_CDN_URL in production environment"
echo ""