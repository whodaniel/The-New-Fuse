#!/bin/bash
# Add Redis to CloudRuntime Production Deployment
# This script must be run interactively (not in automated mode)

set -e

echo "🚀 Adding Redis to CloudRuntime Production Deployment"
echo "================================================"
echo ""

# Check if CloudRuntime CLI is installed
if ! command -v cloud_runtime &> /dev/null; then
    echo "❌ CloudRuntime CLI is not installed"
    echo "Install it with: npm i -g @cloud_runtime/cli"
    exit 1
fi

# Check if authenticated
if ! cloud_runtime whoami &> /dev/null; then
    echo "❌ Not logged in to CloudRuntime"
    echo "Login with: cloud_runtime login"
    exit 1
fi

echo "✅ CloudRuntime CLI is installed and authenticated"
echo ""

# Display current project
echo "📦 Current CloudRuntime Project:"
cloud_runtime status
echo ""

echo "⚠️  IMPORTANT: You need to add Redis via the CloudRuntime Dashboard"
echo ""
echo "Steps to add Redis:"
echo "1. Go to: https://cloud_runtime.app/project/$(cloud_runtime status | grep 'Project:' | awk '{print $2}')"
echo "2. Click 'New' → 'Database' → 'Add Redis'"
echo "3. Wait for Redis to provision (takes ~30 seconds)"
echo "4. Redis will be automatically available as REDIS_URL"
echo ""
echo "After adding Redis, you need to:"
echo "1. Link Redis to the 'api' service"
echo "2. Link Redis to the 'backend' service"
echo "3. Remove REDIS_ENABLED=false from cloud_runtime.toml"
echo "4. Commit and push the changes"
echo ""

read -p "Have you added Redis via the CloudRuntime Dashboard? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please add Redis via the dashboard first, then run this script again."
    exit 0
fi

echo ""
echo "Great! Now let's update the configuration..."
echo ""

# Update cloud_runtime.toml to remove Redis disable flags
echo "📝 Updating cloud_runtime.toml..."

cd "$(git rev-parse --show-toplevel)"

# Check if cloud_runtime.toml exists
if [ ! -f "cloud_runtime.toml" ]; then
    echo "❌ cloud_runtime.toml not found"
    exit 1
fi

# Create backup
cp cloud_runtime.toml cloud_runtime.toml.backup
echo "✅ Created backup: cloud_runtime.toml.backup"

# Remove REDIS_ENABLED=false from api service
sed -i '' '/\[services\.api\.env\]/,/^$/d' cloud_runtime.toml
echo "✅ Removed REDIS_ENABLED=false from api service"

# Remove Redis disable flags from backend service
sed -i '' '/# Disable Redis-dependent features/,/CACHE_ENABLED = "false"/d' cloud_runtime.toml
echo "✅ Removed Redis disable flags from backend service"

echo ""
echo "✅ Configuration updated!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff cloud_runtime.toml"
echo "2. Commit: git add cloud_runtime.toml && git commit -m 'feat: enable Redis for production'"
echo "3. Push: git push origin main"
echo "4. Monitor deployment: cloud_runtime logs"
echo ""
echo "Expected logs after deployment:"
echo "  [RedisConfig] Using REDIS_URL: redis.cloud_runtime.internal:6379 (db: 0)"
echo "  [CacheService] Redis connected successfully"
echo ""
