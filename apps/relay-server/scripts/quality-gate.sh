#!/bin/bash
# scripts/quality-gate.sh
# Quality gate script as specified in the reorganization plan

set -e

echo "🚀 Running quality gate checks..."

echo "📋 Running linter..."
pnpm run lint

echo "🔍 Running type check..."
pnpm run type-check

echo "🧪 Running unit tests..."
pnpm run test:unit

echo "🔗 Running integration tests..."
pnpm run test:integration

echo "✅ All quality gate checks passed!"
