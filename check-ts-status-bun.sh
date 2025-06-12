#!/bin/bash
echo "🔍 TypeScript Status Check (Bun Environment)"
echo "=============================================="

echo "📦 Checking Bun workspace..."
bun --version
echo ""

echo "📂 Checking package structure..."
ls -la packages/ 2>/dev/null || echo "No packages directory"

echo ""
echo "🔧 Running TypeScript check with Bun (first 10 errors)..."
bun tsc --noEmit --skipLibCheck 2>&1 | head -10

echo ""
echo "📊 Error summary..."
ERROR_COUNT=$(bun tsc --noEmit --skipLibCheck 2>&1 | wc -l)
echo "Total TypeScript errors: $ERROR_COUNT"

if [ "$ERROR_COUNT" -lt 50 ]; then
    echo "✅ Good progress! Error count is manageable."
elif [ "$ERROR_COUNT" -lt 100 ]; then
    echo "🟡 Making progress. Continue with fixes."
else
    echo "🔴 Still many errors. Consider running 'bun install' first."
fi

echo ""
echo "🚀 Bun-specific commands:"
echo "   • Install deps: bun install"
echo "   • Build packages: bun run build"
echo "   • Type check: bun tsc --noEmit"
echo "   • Dev mode: bun dev"
