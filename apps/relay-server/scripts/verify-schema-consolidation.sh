#!/bin/bash
set -e

echo "🔍 Verifying Schema Consolidation"

# 1. Check if new schema exists
if [ ! -f "packages/database/drizzle/schema.drizzle" ]; then
    echo "❌ New schema file not found!"
    exit 1
fi

# 2. Verify Drizzle client generation
echo "📦 Verifying Drizzle client..."
bun --filter @the-new-fuse/database run generate

# 3. Test database connections
echo "🔌 Testing database connection..."
bun --filter @the-new-fuse/database run drizzle db pull

# 4. Verify all models are accessible
echo "🧪 Testing model accessibility..."
cat << EOF > test-models.ts
import { DrizzleClient } from '@the-new-fuse/database/client'
const drizzle = new DrizzleClient()

async function testModels() {
    try {
        await drizzle.\$connect()
        // Test a few key models
        await drizzle.user.findMany({ take: 1 })
        await drizzle.agent.findMany({ take: 1 })
        await drizzle.feature.findMany({ take: 1 })
        await drizzle.project.findMany({ take: 1 })
        console.log('✅ All models accessible')
    } catch (error) {
        console.error('❌ Model access failed:', error)
        process.exit(1)
    } finally {
        await drizzle.\$disconnect()
    }
}

testModels()
EOF

# Run the test
bun ts-node test-models.ts
rm test-models.ts

echo "✅ Schema consolidation verification complete!"