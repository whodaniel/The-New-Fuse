#!/bin/bash

# fix-cli-and-test.sh - Fix the CLI import issue and test

echo "🔧 Fixing CLI import issues..."

PROJECT_ROOT="/Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse"
cd "$PROJECT_ROOT"

# 1. Build the port management package properly
echo "1. Building port management package..."
cd packages/port-management
yarn build
cd "$PROJECT_ROOT"

# 2. Test the simplified CLI
echo "2. Testing CLI functionality..."
tnf-ports status

echo "✅ CLI test complete!"
echo ""
echo "🎯 Available commands:"
echo "  tnf-ports status     - Check port allocation"
echo "  tnf-ports conflicts  - Detect conflicts"
echo "  tnf-ports health     - Check service health"
echo "  tnf-ports dev        - Prepare development environment"
