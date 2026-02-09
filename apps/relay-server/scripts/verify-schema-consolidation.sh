#!/bin/bash
set -e

echo "🔍 Verifying Schema Consolidation"

# 1. Check if new schema exists
if [ ! -f "packages/database/prisma/schema.prisma" ]; then
    echo "❌ New schema file not found!"
    exit 1
fi

# 2. Verify Prisma client generation
echo "📦 Verifying Prisma client..."
bun --filter @the-new-fuse/database run generate

# 3. Test database connections
echo "🔌 Testing database connection..."
bun --filter @the-new-fuse/database run prisma db pull

# 4. Verify all models are accessible
echo "🧪 Testing model accessibility..."
cat << EOF > test-models.ts
import { PrismaClient } from '@the-new-fuse/database/client'
const prisma = new PrismaClient()

async function testModels() {
    try {
        await prisma.\$connect()
        // Test a few key models
        await prisma.user.findMany({ take: 1 })
        await prisma.agent.findMany({ take: 1 })
        await prisma.feature.findMany({ take: 1 })
        await prisma.project.findMany({ take: 1 })
        console.log('✅ All models accessible')
    } catch (error) {
        console.error('❌ Model access failed:', error)
        process.exit(1)
    } finally {
        await prisma.\$disconnect()
    }
}

testModels()
EOF

# Run the test
bun ts-node test-models.ts
rm test-models.ts

echo "✅ Schema consolidation verification complete!"