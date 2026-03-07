#!/bin/bash
# Add Redis to Railway Production Deployment
# This script must be run interactively (not in automated mode)

set -e

echo "🚀 Adding Redis to Railway Production Deployment"
echo "================================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

# Check if authenticated
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway"
    echo "Login with: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and authenticated"
echo ""

# Display current project
echo "📦 Current Railway Project:"
railway status
echo ""

echo "⚠️  IMPORTANT: You need to add Redis via the Railway Dashboard"
echo ""
echo "Steps to add Redis:"
echo "1. Go to: https://railway.app/project/$(railway status | grep 'Project:' | awk '{print $2}')"
echo "2. Click 'New' → 'Database' → 'Add Redis'"
echo "3. Wait for Redis to provision (takes ~30 seconds)"
echo "4. Redis will be automatically available as REDIS_URL"
echo ""
echo "After adding Redis, you need to:"
echo "1. Link Redis to the 'api' service"
echo "2. Link Redis to the 'backend' service"
echo "3. Remove REDIS_ENABLED=false from railway.toml"
echo "4. Commit and push the changes"
echo ""

read -p "Have you added Redis via the Railway Dashboard? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please add Redis via the dashboard first, then run this script again."
    exit 0
fi

echo ""
echo "Great! Now let's update the configuration..."
echo ""

# Update railway.toml to remove Redis disable flags
echo "📝 Updating railway.toml..."

cd "$(git rev-parse --show-toplevel)"

# Check if railway.toml exists
if [ ! -f "railway.toml" ]; then
    echo "❌ railway.toml not found"
    exit 1
fi

# Create backup
cp railway.toml railway.toml.backup
echo "✅ Created backup: railway.toml.backup"

# Remove REDIS_ENABLED=false from api service
sed -i '' '/\[services\.api\.env\]/,/^$/d' railway.toml
echo "✅ Removed REDIS_ENABLED=false from api service"

# Remove Redis disable flags from backend service
sed -i '' '/# Disable Redis-dependent features/,/CACHE_ENABLED = "false"/d' railway.toml
echo "✅ Removed Redis disable flags from backend service"

echo ""
echo "✅ Configuration updated!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff railway.toml"
echo "2. Commit: git add railway.toml && git commit -m 'feat: enable Redis for production'"
echo "3. Push: git push origin main"
echo "4. Monitor deployment: railway logs"
echo ""
echo "Expected logs after deployment:"
echo "  [RedisConfig] Using REDIS_URL: redis.railway.internal:6379 (db: 0)"
echo "  [CacheService] Redis connected successfully"
echo ""
