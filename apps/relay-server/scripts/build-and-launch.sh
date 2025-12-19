#!/bin/bash
set -e

echo "🚀 Starting consolidation process..."

# Build TypeScript files first
echo "🔨 Building TypeScript..."
bun tsc

# Execute consolidation
echo "🔄 Running consolidation..."
node dist/scripts/execute-consolidation.js

# Verify results
echo "✅ Verifying consolidation results..."
./scripts/verify-changes.sh
