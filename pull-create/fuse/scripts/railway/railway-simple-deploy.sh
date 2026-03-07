#!/bin/bash
# Simplified Railway Deployment Script
# This script deploys The New Fuse to Railway with minimal steps

set -e

echo "========================================"
echo "The New Fuse - Simple Railway Deploy"
echo "========================================"
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Install: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway"
    echo "Run: railway login"
    exit 1
fi

echo "✅ Logged in to Railway"
railway whoami
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
        echo "Step 1: Please add PostgreSQL to your Railway project:"
        echo "  1. Go to https://railway.app/dashboard"
        echo "  2. Select your project (or create new one with: railway init)"
        echo "  3. Click '+ New' → 'Database' → 'PostgreSQL'"
        echo ""
        read -p "Press Enter when PostgreSQL is added..."

        echo ""
        echo "🚀 Deploying API Service..."
        cd apps/api
        railway up || echo "⚠️  API deployment started (may take 10-15 min)"
        cd ../..

        echo ""
        echo "🚀 Deploying Frontend..."
        cd apps/frontend
        railway up || echo "⚠️  Frontend deployment started (may take 5-10 min)"
        cd ../..

        echo ""
        echo "✅ Deployment initiated!"
        echo ""
        echo "Next steps:"
        echo "1. Go to Railway Dashboard: railway open"
        echo "2. Configure environment variables (see DEPLOY_NOW.md)"
        echo "3. Wait for builds to complete (~15-20 min total)"
        ;;

    2)
        echo ""
        echo "🚀 Deploying API Service only..."
        cd apps/api
        railway up
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
        railway up
        cd ../..
        echo ""
        echo "✅ Frontend deployed!"
        echo "Don't forget to set VITE_API_URL environment variable"
        ;;

    4)
        echo ""
        echo "🎯 Initializing Railway project..."
        railway init
        echo ""
        echo "✅ Project initialized!"
        echo ""
        echo "Next:"
        echo "1. Add PostgreSQL: Dashboard → + New → Database → PostgreSQL"
        echo "2. Deploy API: cd apps/api && railway up"
        echo "3. Deploy Frontend: cd apps/frontend && railway up"
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
echo "View logs:      railway logs"
echo "Check status:   railway status"
echo "Open dashboard: railway open"
echo "Redeploy:       railway up --detach"
echo ""
echo "📖 Full guide: DEPLOY_NOW.md"
echo ""
