#!/bin/bash
# scripts/quality-gate.sh
# Quality gate script as specified in the reorganization plan

set -e

echo "🚀 Running quality gate checks..."

echo "📋 Running linter..."
bun run lint

echo "🔍 Running type check..."
bun run type-check

echo "🧪 Running unit tests..."
bun run test:unit

echo "🔗 Running integration tests..."
bun run test:integration

echo "✅ All quality gate checks passed!"
