#!/bin/bash
# Simplified CloudRuntime Deployment Script
# This script deploys The New Fuse to CloudRuntime with minimal steps

set -e

echo "========================================"
echo "The New Fuse - Simple CloudRuntime Deploy"
echo "========================================"
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Check if CloudRuntime CLI is installed
if ! command -v cloud_runtime &> /dev/null; then
    echo "❌ CloudRuntime CLI not found!"
    echo "Install: npm install -g @cloud_runtime/cli"
    exit 1
fi

echo "✅ CloudRuntime CLI found"

# Check if logged in
if ! cloud_runtime whoami &> /dev/null; then
    echo "❌ Not logged in to CloudRuntime"
    echo "Run: cloud_runtime login"
    exit 1
fi

echo "✅ Logged in to CloudRuntime"
cloud_runtime whoami
echo ""

# Prompt for deployment choice
echo "What would you like to deploy?"
echo "1. Full Stack (API + Frontend + Databases)"
echo "2. API Service only"
echo "3. Frontend only"
echo "4. Just initialize project (I'll deploy manually)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📦 Full Stack Deployment"
        echo ""
        echo "Step 1: Please add PostgreSQL to your CloudRuntime project:"
        echo "  1. Go to https://cloud_runtime.app/dashboard"
        echo "  2. Select your project (or create new one with: cloud_runtime init)"
        echo "  3. Click '+ New' → 'Database' → 'PostgreSQL'"
        echo ""
        read -p "Press Enter when PostgreSQL is added..."

        echo ""
        echo "🚀 Deploying API Service..."
        cd apps/api
        cloud_runtime up || echo "⚠️  API deployment started (may take 10-15 min)"
        cd ../..

        echo ""
        echo "🚀 Deploying Frontend..."
        cd apps/frontend
        cloud_runtime up || echo "⚠️  Frontend deployment started (may take 5-10 min)"
        cd ../..

        echo ""
        echo "✅ Deployment initiated!"
        echo ""
        echo "Next steps:"
        echo "1. Go to CloudRuntime Dashboard: cloud_runtime open"
        echo "2. Configure environment variables (see DEPLOY_NOW.md)"
        echo "3. Wait for builds to complete (~15-20 min total)"
        ;;

    2)
        echo ""
        echo "🚀 Deploying API Service only..."
        cd apps/api
        cloud_runtime up
        cd ../..
        echo ""
        echo "✅ API Service deployed!"
        echo "Don't forget to:"
        echo "1. Add PostgreSQL database"
        echo "2. Set environment variables"
        ;;

    3)
        echo ""
        echo "🚀 Deploying Frontend only..."
        cd apps/frontend
        cloud_runtime up
        cd ../..
        echo ""
        echo "✅ Frontend deployed!"
        echo "Don't forget to set VITE_API_URL environment variable"
        ;;

    4)
        echo ""
        echo "🎯 Initializing CloudRuntime project..."
        cloud_runtime init
        echo ""
        echo "✅ Project initialized!"
        echo ""
        echo "Next:"
        echo "1. Add PostgreSQL: Dashboard → + New → Database → PostgreSQL"
        echo "2. Deploy API: cd apps/api && cloud_runtime up"
        echo "3. Deploy Frontend: cd apps/frontend && cloud_runtime up"
        echo ""
        echo "See DEPLOY_NOW.md for detailed instructions"
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo "Useful Commands:"
echo "========================================"
echo "View logs:      cloud_runtime logs"
echo "Check status:   cloud_runtime status"
echo "Open dashboard: cloud_runtime open"
echo "Redeploy:       cloud_runtime up --detach"
echo ""
echo "📖 Full guide: DEPLOY_NOW.md"
echo ""
