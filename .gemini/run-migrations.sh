#!/bin/bash
# Railway API Service - Manual Migration Script
# Run this to create the missing database tables

echo "🔧 Running Drizzle migrations on Railway API service..."
echo ""
echo "📋 This will create the following tables:"
echo "   - User (with verifierId)"
echo "   - Wallet (with address, chain_id, wallet_type, Smart Account fields)"
echo "   - Transaction (with tx_hash, from_address, to_address, value, status)"
echo ""

# The command to run in Railway's API service shell:
MIGRATION_COMMAND="npx drizzle migrate deploy --schema=/app/apps/api/drizzle/schema.drizzle"

echo "🚀 Command to run in Railway API service shell:"
echo ""
echo "   $MIGRATION_COMMAND"
echo ""
echo "📝 Instructions:"
echo "   1. Go to: https://railway.com/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
echo "   2. Click on 'api' service in the left sidebar"
echo "   3. Click on the 'Shell' or 'Terminal' tab"
echo "   4. Paste the command above"
echo "   5. Press Enter"
echo ""
echo "✅ Expected output:"
echo "   - 'Running migrations...'"
echo "   - '1 migration found in drizzle/migrations'"
echo "   - 'Applying migration 20240101000000_add_wallet_system'"
echo "   - 'Migration applied successfully'"
echo ""
echo "❌ If you see errors:"
echo "   - Check that DATABASE_URL environment variable is set"
echo "   - Verify the schema file exists at the path above"
echo "   - Check Railway logs for more details"
