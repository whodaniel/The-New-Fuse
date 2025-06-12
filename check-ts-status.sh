#!/bin/bash
echo "🔍 TypeScript Status Check"
echo "=========================="

echo "📦 Checking package structure..."
ls -la packages/ 2>/dev/null || echo "No packages directory"

echo ""
echo "🔧 Running TypeScript check (first 10 errors)..."
npx tsc --noEmit --skipLibCheck 2>&1 | head -10

echo ""
echo "📊 Error summary..."
ERROR_COUNT=$(npx tsc --noEmit --skipLibCheck 2>&1 | wc -l)
echo "Total TypeScript errors: $ERROR_COUNT"

if [ "$ERROR_COUNT" -lt 50 ]; then
    echo "✅ Good progress! Error count is manageable."
elif [ "$ERROR_COUNT" -lt 100 ]; then
    echo "🟡 Making progress. Continue with fixes."
else
    echo "🔴 Still many errors. Consider installing dependencies first."
fi
