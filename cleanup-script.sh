#!/bin/bash

echo "🧹 Starting codebase cleanup after Prisma schema sync..."

# Safety check
read -p "⚠️  This will delete files. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo "📁 Creating backup..."
git add . && git commit -m "Pre-cleanup backup"

echo "🗑️  Removing duplicate and obsolete files..."

# Remove backup directories
rm -rf packages/core/backup/src_original/dto/
rm -rf packages/core/backup/src_original/task/dto/

# Clean generated files for regeneration
rm -rf packages/workflow-engine/dist/
rm -rf packages/extension-system/dist/

# Remove chrome extension test files
cd chrome-extension
rm -f test-*.js debug-*.js tnf-relay-simple.js test-*.html
rm -rf native_host/dist/
cd ..

# Remove old compiled map files
find packages/ -name "*.d.ts.map" -delete
find packages/ -name "*.js.map" -delete

echo "🔄 Regenerating files..."

# Regenerate Prisma client
bun run db:generate

# Clean build everything
bun run build:clean

echo "✅ Cleanup complete! Please test your application."
echo "📝 Next steps:"
echo "   1. Update imports in frontend/src that used models/enums.ts"
echo "   2. Run 'bun run dev' to test"
echo "   3. Commit the cleanup changes"